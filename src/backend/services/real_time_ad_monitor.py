# Real-time Ad Spend Monitoring Service

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from fastapi import WebSocket
from pydantic import BaseModel
import os
from cachetools import TTLCache
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SpendAlert(BaseModel):
    alert_id: str
    campaign_id: str
    campaign_name: str
    platform: str
    alert_type: str  # "spend_threshold", "budget_pacing", "performance_drop"
    message: str
    severity: str  # "low", "medium", "high", "critical"
    current_value: float
    threshold_value: float
    timestamp: datetime
    account_id: str


class CampaignSpendData(BaseModel):
    campaign_id: str
    campaign_name: str
    platform: str
    account_id: str
    current_spend: float
    daily_budget: float
    spend_rate: float  # spend per hour
    last_updated: datetime
    is_active: bool


class RealTimeAdMonitor:
    """Real-time monitoring service for ad spend and performance"""

    def __init__(self):
        self.connected_clients: Set[WebSocket] = set()
        # TTL Cache with max 1000 campaigns, 1 hour TTL to prevent memory leaks
        self.campaign_data: TTLCache = TTLCache(maxsize=1000, ttl=3600)
        # TTL Cache with max 500 alerts, 30 minute TTL for alerts
        self.active_alerts: TTLCache = TTLCache(maxsize=500, ttl=1800)
        self.monitoring_active = False
        # Thread lock for thread-safe cache operations
        self._cache_lock = threading.RLock()

        # Configurable thresholds
        self.spend_threshold_percentage = float(
            os.getenv("SPEND_THRESHOLD_PERCENTAGE", "80")
        )  # 80% of daily budget
        self.performance_drop_threshold = float(
            os.getenv("PERFORMANCE_DROP_THRESHOLD", "20")
        )  # 20% drop
        self.monitoring_interval = int(
            os.getenv("MONITORING_INTERVAL_SECONDS", "300")
        )  # 5 minutes

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring memory usage."""
        with self._cache_lock:
            return {
                "campaign_cache": {
                    "size": len(self.campaign_data),
                    "maxsize": self.campaign_data.maxsize,
                    "ttl": self.campaign_data.ttl,
                    "memory_usage_percent": len(self.campaign_data) / self.campaign_data.maxsize * 100,
                },
                "alerts_cache": {
                    "size": len(self.active_alerts),
                    "maxsize": self.active_alerts.maxsize,
                    "ttl": self.active_alerts.ttl,
                    "memory_usage_percent": len(self.active_alerts) / self.active_alerts.maxsize * 100,
                },
                "connected_clients": len(self.connected_clients),
            }

    async def cleanup_expired_data(self):
        """Manual cleanup of expired TTL cache entries (automatic cleanup happens on access)."""
        with self._cache_lock:
            # TTL cache automatically removes expired items, but we can log statistics
            stats = self.get_cache_stats()
            logger.info(f"Cache cleanup - Campaign cache: {stats['campaign_cache']['size']}/{stats['campaign_cache']['maxsize']}, "
                       f"Alert cache: {stats['alerts_cache']['size']}/{stats['alerts_cache']['maxsize']}")
            
            # If cache is >90% full, log warning
            if stats['campaign_cache']['memory_usage_percent'] > 90:
                logger.warning("Campaign cache is >90% full. Consider increasing maxsize or reducing TTL.")
            if stats['alerts_cache']['memory_usage_percent'] > 90:
                logger.warning("Alerts cache is >90% full. Consider increasing maxsize or reducing TTL.")

    async def connect_client(self, websocket: WebSocket):
        """Add a new WebSocket client"""
        await websocket.accept()
        self.connected_clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.connected_clients)}")

        # Send current alerts to new client
        if self.active_alerts:
            await self.send_to_client(
                websocket,
                {
                    "type": "current_alerts",
                    "alerts": [alert.dict() for alert in self.active_alerts.values()],
                },
            )

    async def disconnect_client(self, websocket: WebSocket):
        """Remove a WebSocket client"""
        self.connected_clients.discard(websocket)
        logger.info(
            f"Client disconnected. Total clients: {len(self.connected_clients)}"
        )

    async def send_to_client(self, websocket: WebSocket, data: dict):
        """Send data to a specific client"""
        try:
            await websocket.send_text(json.dumps(data, default=str))
        except Exception as e:
            logger.error(f"Error sending data to client: {e}")
            await self.disconnect_client(websocket)

    async def broadcast_to_all(self, data: dict):
        """Broadcast data to all connected clients"""
        if not self.connected_clients:
            return

        disconnected_clients = set()

        for client in self.connected_clients:
            try:
                await client.send_text(json.dumps(data, default=str))
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected_clients.add(client)

        # Remove disconnected clients
        for client in disconnected_clients:
            await self.disconnect_client(client)

    async def update_campaign_data(self, campaigns: List[CampaignSpendData]):
        """Update campaign spending data"""
        for campaign in campaigns:
            campaign_key = f"{campaign.platform}_{campaign.campaign_id}"

            # Calculate spend rate if we have previous data
            # Thread-safe access to TTL cache
            with self._cache_lock:
                previous_data = self.campaign_data.get(campaign_key)
            if previous_data:
                time_diff = (
                    campaign.last_updated - previous_data.last_updated
                ).total_seconds() / 3600  # hours
                if time_diff > 0:
                    spend_diff = campaign.current_spend - previous_data.current_spend
                    campaign.spend_rate = spend_diff / time_diff

            # Thread-safe campaign data update with TTL cache
            with self._cache_lock:
                self.campaign_data[campaign_key] = campaign

            # Check for alerts
            await self.check_campaign_alerts(campaign)

        # Broadcast updated data to clients
        await self.broadcast_to_all(
            {
                "type": "campaign_update",
                "campaigns": [campaign.dict() for campaign in campaigns],
                "timestamp": datetime.now(),
            }
        )

    async def check_campaign_alerts(self, campaign: CampaignSpendData):
        """Check if campaign triggers any alerts"""
        alerts_to_create = []
        campaign_key = f"{campaign.platform}_{campaign.campaign_id}"

        # 1. Spend threshold alert
        if campaign.daily_budget > 0:
            spend_percentage = (campaign.current_spend / campaign.daily_budget) * 100

            if spend_percentage >= self.spend_threshold_percentage:
                alert_id = f"{campaign_key}_spend_threshold"

                # Only create alert if it doesn't exist or values changed significantly
                # Thread-safe access to TTL cache for alerts
                with self._cache_lock:
                    existing_alert = self.active_alerts.get(alert_id)
                if (
                    not existing_alert
                    or abs(existing_alert.current_value - spend_percentage) > 5
                ):
                    severity = (
                        "critical"
                        if spend_percentage >= 95
                        else "high"
                        if spend_percentage >= 85
                        else "medium"
                    )

                    alert = SpendAlert(
                        alert_id=alert_id,
                        campaign_id=campaign.campaign_id,
                        campaign_name=campaign.campaign_name,
                        platform=campaign.platform,
                        alert_type="spend_threshold",
                        message=f"Campaign spend ({spend_percentage:.1f}%) approaching daily budget limit",
                        severity=severity,
                        current_value=spend_percentage,
                        threshold_value=self.spend_threshold_percentage,
                        timestamp=datetime.now(),
                        account_id=campaign.account_id,
                    )
                    alerts_to_create.append(alert)

        # 2. Budget pacing alert
        if campaign.spend_rate > 0 and campaign.daily_budget > 0:
            hours_remaining = 24 - datetime.now().hour
            projected_spend = campaign.current_spend + (
                campaign.spend_rate * hours_remaining
            )

            if projected_spend > campaign.daily_budget * 1.1:  # 110% of budget
                alert_id = f"{campaign_key}_budget_pacing"

                if alert_id not in self.active_alerts:
                    alert = SpendAlert(
                        alert_id=alert_id,
                        campaign_id=campaign.campaign_id,
                        campaign_name=campaign.campaign_name,
                        platform=campaign.platform,
                        alert_type="budget_pacing",
                        message=f"Campaign pacing to exceed budget. Projected: ${projected_spend:.2f}",
                        severity="high",
                        current_value=projected_spend,
                        threshold_value=campaign.daily_budget,
                        timestamp=datetime.now(),
                        account_id=campaign.account_id,
                    )
                    alerts_to_create.append(alert)

        # Store new alerts and broadcast with thread-safe TTL cache
        for alert in alerts_to_create:
            with self._cache_lock:
                self.active_alerts[alert.alert_id] = alert

            # Broadcast individual alert
            await self.broadcast_to_all(
                {
                    "type": "new_alert",
                    "alert": alert.dict(),
                    "timestamp": datetime.now(),
                }
            )

            logger.warning(
                f"Alert created: {alert.message} for campaign {alert.campaign_name}"
            )

    async def dismiss_alert(self, alert_id: str):
        """Dismiss an active alert"""
        if alert_id in self.active_alerts:
            dismissed_alert = self.active_alerts.pop(alert_id)

            await self.broadcast_to_all(
                {
                    "type": "alert_dismissed",
                    "alert_id": alert_id,
                    "timestamp": datetime.now(),
                }
            )

            logger.info(f"Alert dismissed: {alert_id}")
            return dismissed_alert
        return None

    async def get_current_alerts(self) -> List[SpendAlert]:
        """Get all current active alerts"""
        return list(self.active_alerts.values())

    async def start_monitoring(self):
        """Start the monitoring loop"""
        if self.monitoring_active:
            return

        self.monitoring_active = True
        logger.info("Real-time ad monitoring started")

        while self.monitoring_active:
            try:
                # Fetch latest data from APIs
                await self.fetch_and_update_data()

                # Clean up old alerts (older than 1 hour)
                await self.cleanup_old_alerts()

                # Wait for next monitoring cycle
                await asyncio.sleep(self.monitoring_interval)

            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying

    async def stop_monitoring(self):
        """Stop the monitoring loop"""
        self.monitoring_active = False
        logger.info("Real-time ad monitoring stopped")

    async def fetch_and_update_data(self):
        """Fetch latest campaign data from APIs"""
        try:
            # Import API clients
            import sys

            sys.path.append(os.path.join(os.path.dirname(__file__), "../../api"))

            campaigns_data = []

            # Meta Business API data
            try:
                from meta.client import MetaAPIClient
                from meta.insights import MetaInsightsService
                from meta.types import MetaConfig, InsightsParams

                if os.getenv("META_APP_ID") and os.getenv("META_APP_SECRET"):
                    config = MetaConfig(
                        appId=os.getenv("META_APP_ID"),
                        appSecret=os.getenv("META_APP_SECRET"),
                        apiVersion="19.0",
                        redirectUri="",
                    )

                    client = MetaAPIClient(config)
                    insights_service = MetaInsightsService(client)

                    # Get today's insights
                    params = InsightsParams(
                        accountId=os.getenv("META_DEFAULT_ACCOUNT_ID", "").replace(
                            "act_", ""
                        ),
                        level="campaign",
                        date_preset="today",
                        fields=[
                            "campaign_id",
                            "campaign_name",
                            "spend",
                            "daily_budget",
                            "campaign_status",
                        ],
                    )

                    meta_insights = await insights_service.getAccountInsights(params)

                    for insight in meta_insights:
                        campaigns_data.append(
                            CampaignSpendData(
                                campaign_id=insight.get("campaign_id", ""),
                                campaign_name=insight.get("campaign_name", "Unknown"),
                                platform="meta",
                                account_id=os.getenv("META_DEFAULT_ACCOUNT_ID", ""),
                                current_spend=float(insight.get("spend", 0)),
                                daily_budget=float(insight.get("daily_budget", 0)),
                                spend_rate=0.0,  # Will be calculated in update_campaign_data
                                last_updated=datetime.now(),
                                is_active=insight.get("campaign_status") == "ACTIVE",
                            )
                        )
            except Exception as e:
                logger.error(f"Error fetching Meta data: {e}")

            # Google Ads API data
            try:
                from google.client import GoogleAdsClient
                from google.insights import GoogleAdsInsightsService
                from google.types import GoogleAdsConfig

                if all(
                    [
                        os.getenv("GOOGLE_ADS_CLIENT_ID"),
                        os.getenv("GOOGLE_ADS_CLIENT_SECRET"),
                        os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
                    ]
                ):
                    config = GoogleAdsConfig(
                        clientId=os.getenv("GOOGLE_ADS_CLIENT_ID"),
                        clientSecret=os.getenv("GOOGLE_ADS_CLIENT_SECRET"),
                        developerToken=os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
                        redirectUri="",
                    )

                    client = GoogleAdsClient(config)
                    insights_service = GoogleAdsInsightsService(client)

                    # Get today's insights
                    today = datetime.now().date()
                    google_insights = await insights_service.getCampaignInsights(
                        customer_id=os.getenv("GOOGLE_ADS_DEFAULT_CUSTOMER_ID", ""),
                        start_date=today.isoformat(),
                        end_date=today.isoformat(),
                    )

                    for insight in google_insights:
                        campaigns_data.append(
                            CampaignSpendData(
                                campaign_id=insight.get("campaign_id", ""),
                                campaign_name=insight.get("campaign_name", "Unknown"),
                                platform="google",
                                account_id=os.getenv(
                                    "GOOGLE_ADS_DEFAULT_CUSTOMER_ID", ""
                                ),
                                current_spend=float(insight.get("cost_micros", 0))
                                / 1000000,
                                daily_budget=float(
                                    insight.get("budget_amount_micros", 0)
                                )
                                / 1000000,
                                spend_rate=0.0,
                                last_updated=datetime.now(),
                                is_active=insight.get("campaign_status") == "ENABLED",
                            )
                        )
            except Exception as e:
                logger.error(f"Error fetching Google Ads data: {e}")

            # Update with fetched data
            if campaigns_data:
                await self.update_campaign_data(campaigns_data)

        except Exception as e:
            logger.error(f"Error in fetch_and_update_data: {e}")

    async def cleanup_old_alerts(self):
        """Remove alerts older than 1 hour"""
        cutoff_time = datetime.now() - timedelta(hours=1)
        alerts_to_remove = []

        for alert_id, alert in self.active_alerts.items():
            if alert.timestamp < cutoff_time:
                alerts_to_remove.append(alert_id)

        for alert_id in alerts_to_remove:
            self.active_alerts.pop(alert_id, None)
            logger.info(f"Cleaned up old alert: {alert_id}")

    async def get_monitoring_stats(self) -> dict:
        """Get monitoring service statistics"""
        return {
            "monitoring_active": self.monitoring_active,
            "connected_clients": len(self.connected_clients),
            "tracked_campaigns": len(self.campaign_data),
            "active_alerts": len(self.active_alerts),
            "monitoring_interval": self.monitoring_interval,
            "last_update": max(
                [c.last_updated for c in self.campaign_data.values()], default=None
            ),
        }


# Global monitor instance
real_time_monitor = RealTimeAdMonitor()
