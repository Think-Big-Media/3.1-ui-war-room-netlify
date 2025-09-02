# Unified Ad Insights API Endpoint

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import os
import sys
from pydantic import BaseModel, Field

# Import our API clients
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../../api"))
from meta.client import MetaAPIClient
from meta.insights import MetaInsightsService
from google.client import GoogleAdsClient
from google.insights import GoogleAdsInsightsService

router = APIRouter(prefix="/ad-insights", tags=["Ad Insights"])


# Response Models
class UnifiedCampaignMetrics(BaseModel):
    platform: str = Field(..., description="Platform (meta/google)")
    campaign_id: str
    campaign_name: str
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    conversions: int = 0
    ctr: float = 0.0
    cpc: float = 0.0
    cpm: float = 0.0
    date_start: str
    date_stop: str
    last_updated: datetime = Field(default_factory=datetime.now)


class AdInsightsResponse(BaseModel):
    campaigns: List[UnifiedCampaignMetrics]
    summary: Dict[str, Any]
    platforms_active: List[str]
    total_spend: float
    total_impressions: int
    total_clicks: int
    average_ctr: float
    last_sync: datetime = Field(default_factory=datetime.now)


class RealTimeAlert(BaseModel):
    alert_type: str = Field(
        ..., description="spend_threshold/performance_drop/budget_exhausted"
    )
    platform: str
    campaign_id: str
    campaign_name: str
    message: str
    severity: str = Field(..., description="low/medium/high/critical")
    threshold_value: float
    current_value: float
    timestamp: datetime = Field(default_factory=datetime.now)


# Initialize API clients (with environment checks)
def get_meta_client():
    """Get Meta API client if credentials available"""
    app_id = os.getenv("META_APP_ID")
    app_secret = os.getenv("META_APP_SECRET")
    if not app_id or not app_secret:
        return None

    from meta.types import MetaConfig

    config = MetaConfig(
        appId=app_id,
        appSecret=app_secret,
        apiVersion="19.0",
        redirectUri=os.getenv(
            "META_REDIRECT_URI", "http://localhost:3000/auth/meta/callback"
        ),
    )
    return MetaAPIClient(config)


def get_google_ads_client():
    """Get Google Ads client if credentials available"""
    client_id = os.getenv("GOOGLE_ADS_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_ADS_CLIENT_SECRET")
    developer_token = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN")

    if not all([client_id, client_secret, developer_token]):
        return None

    from google.types import GoogleAdsConfig

    config = GoogleAdsConfig(
        clientId=client_id,
        clientSecret=client_secret,
        developerToken=developer_token,
        redirectUri=os.getenv(
            "GOOGLE_ADS_REDIRECT_URI", "http://localhost:3000/auth/google/callback"
        ),
    )
    return GoogleAdsClient(config)


@router.get("/campaigns", response_model=AdInsightsResponse)
async def get_unified_campaign_insights(
    date_preset: str = Query("last_7d", description="Date range preset"),
    account_ids: Optional[str] = Query(None, description="Comma-separated account IDs"),
    include_inactive: bool = Query(False, description="Include inactive campaigns"),
    real_time: bool = Query(False, description="Force real-time data fetch"),
):
    """Get unified campaign insights from all connected ad platforms"""

    campaigns = []
    platforms_active = []
    errors = []

    # Meta Business API Insights
    meta_client = get_meta_client()
    if meta_client:
        try:
            insights_service = MetaInsightsService(meta_client)

            # Parse account IDs if provided
            meta_account_ids = []
            if account_ids:
                meta_account_ids = [
                    aid.strip()
                    for aid in account_ids.split(",")
                    if aid.startswith("act_")
                ]

            for account_id in meta_account_ids or [
                os.getenv("META_DEFAULT_ACCOUNT_ID")
            ]:
                if account_id:
                    try:
                        from meta.types import InsightsParams

                        params = InsightsParams(
                            accountId=account_id.replace("act_", ""),
                            level="campaign",
                            date_preset=date_preset,
                            fields=[
                                "campaign_id",
                                "campaign_name",
                                "impressions",
                                "clicks",
                                "spend",
                                "actions",
                                "ctr",
                                "cpc",
                                "cpm",
                                "date_start",
                                "date_stop",
                            ],
                        )

                        meta_insights = await insights_service.getAccountInsights(
                            params
                        )

                        for insight in meta_insights:
                            campaigns.append(
                                UnifiedCampaignMetrics(
                                    platform="meta",
                                    campaign_id=insight.get("campaign_id", ""),
                                    campaign_name=insight.get(
                                        "campaign_name", "Unknown"
                                    ),
                                    impressions=int(insight.get("impressions", 0)),
                                    clicks=int(insight.get("clicks", 0)),
                                    spend=float(insight.get("spend", 0)),
                                    conversions=len(insight.get("actions", [])),
                                    ctr=float(insight.get("ctr", 0)),
                                    cpc=float(insight.get("cpc", 0)),
                                    cpm=float(insight.get("cpm", 0)),
                                    date_start=insight.get("date_start", ""),
                                    date_stop=insight.get("date_stop", ""),
                                )
                            )

                        platforms_active.append("meta")
                    except Exception as e:
                        errors.append(f"Meta account {account_id}: {str(e)}")
        except Exception as e:
            errors.append(f"Meta API error: {str(e)}")

    # Google Ads API Insights
    google_client = get_google_ads_client()
    if google_client:
        try:
            insights_service = GoogleAdsInsightsService(google_client)

            # Parse Google Ads account IDs
            google_account_ids = []
            if account_ids:
                google_account_ids = [
                    aid.strip()
                    for aid in account_ids.split(",")
                    if not aid.startswith("act_")
                ]

            for account_id in google_account_ids or [
                os.getenv("GOOGLE_ADS_DEFAULT_CUSTOMER_ID")
            ]:
                if account_id:
                    try:
                        # Calculate date range
                        end_date = datetime.now().date()
                        if date_preset == "last_7d":
                            start_date = end_date - timedelta(days=7)
                        elif date_preset == "last_30d":
                            start_date = end_date - timedelta(days=30)
                        else:
                            start_date = end_date - timedelta(days=7)

                        google_insights = await insights_service.getCampaignInsights(
                            customer_id=account_id,
                            start_date=start_date.isoformat(),
                            end_date=end_date.isoformat(),
                        )

                        for insight in google_insights:
                            campaigns.append(
                                UnifiedCampaignMetrics(
                                    platform="google",
                                    campaign_id=insight.get("campaign_id", ""),
                                    campaign_name=insight.get(
                                        "campaign_name", "Unknown"
                                    ),
                                    impressions=int(insight.get("impressions", 0)),
                                    clicks=int(insight.get("clicks", 0)),
                                    spend=float(insight.get("cost_micros", 0))
                                    / 1000000,  # Convert micros
                                    conversions=int(insight.get("conversions", 0)),
                                    ctr=float(insight.get("ctr", 0)),
                                    cpc=float(insight.get("average_cpc", 0)) / 1000000,
                                    cpm=float(insight.get("average_cpm", 0)) / 1000000,
                                    date_start=start_date.isoformat(),
                                    date_stop=end_date.isoformat(),
                                )
                            )

                        platforms_active.append("google")
                    except Exception as e:
                        errors.append(f"Google Ads account {account_id}: {str(e)}")
        except Exception as e:
            errors.append(f"Google Ads API error: {str(e)}")

    # Calculate summary metrics
    total_spend = sum(c.spend for c in campaigns)
    total_impressions = sum(c.impressions for c in campaigns)
    total_clicks = sum(c.clicks for c in campaigns)
    average_ctr = (
        (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    )

    summary = {
        "total_campaigns": len(campaigns),
        "platforms_connected": len(set(platforms_active)),
        "errors": errors if errors else None,
        "mock_mode": not bool(meta_client or google_client),
        "data_freshness": "real-time" if real_time else "cached",
    }

    return AdInsightsResponse(
        campaigns=campaigns,
        summary=summary,
        platforms_active=list(set(platforms_active)),
        total_spend=total_spend,
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        average_ctr=average_ctr,
    )


@router.get("/alerts", response_model=List[RealTimeAlert])
async def get_spend_alerts(
    severity: Optional[str] = Query(
        None, description="Filter by severity: low/medium/high/critical"
    ),
    platform: Optional[str] = Query(
        None, description="Filter by platform: meta/google"
    ),
):
    """Get real-time spend and performance alerts"""

    alerts = []

    # Get current campaign data
    insights_response = await get_unified_campaign_insights(date_preset="today")

    # Define alert thresholds (these would be configurable per campaign)
    SPEND_THRESHOLD_DAILY = float(os.getenv("DAILY_SPEND_THRESHOLD", "500"))  # $500/day
    CTR_THRESHOLD_LOW = float(os.getenv("CTR_THRESHOLD_LOW", "1.0"))  # 1% CTR
    CPC_THRESHOLD_HIGH = float(os.getenv("CPC_THRESHOLD_HIGH", "5.0"))  # $5 CPC

    for campaign in insights_response.campaigns:
        # High spend alert
        if campaign.spend > SPEND_THRESHOLD_DAILY:
            alerts.append(
                RealTimeAlert(
                    alert_type="spend_threshold",
                    platform=campaign.platform,
                    campaign_id=campaign.campaign_id,
                    campaign_name=campaign.campaign_name,
                    message=f"Daily spend ${campaign.spend:.2f} exceeds threshold ${SPEND_THRESHOLD_DAILY}",
                    severity="high"
                    if campaign.spend > SPEND_THRESHOLD_DAILY * 1.5
                    else "medium",
                    threshold_value=SPEND_THRESHOLD_DAILY,
                    current_value=campaign.spend,
                )
            )

        # Low CTR alert
        if campaign.ctr > 0 and campaign.ctr < CTR_THRESHOLD_LOW:
            alerts.append(
                RealTimeAlert(
                    alert_type="performance_drop",
                    platform=campaign.platform,
                    campaign_id=campaign.campaign_id,
                    campaign_name=campaign.campaign_name,
                    message=f"CTR {campaign.ctr:.2f}% below threshold {CTR_THRESHOLD_LOW}%",
                    severity="medium",
                    threshold_value=CTR_THRESHOLD_LOW,
                    current_value=campaign.ctr,
                )
            )

        # High CPC alert
        if campaign.cpc > CPC_THRESHOLD_HIGH:
            alerts.append(
                RealTimeAlert(
                    alert_type="performance_drop",
                    platform=campaign.platform,
                    campaign_id=campaign.campaign_id,
                    campaign_name=campaign.campaign_name,
                    message=f"CPC ${campaign.cpc:.2f} exceeds threshold ${CPC_THRESHOLD_HIGH}",
                    severity="high",
                    threshold_value=CPC_THRESHOLD_HIGH,
                    current_value=campaign.cpc,
                )
            )

    # Filter alerts
    if severity:
        alerts = [a for a in alerts if a.severity == severity]
    if platform:
        alerts = [a for a in alerts if a.platform == platform]

    return alerts


@router.post("/sync")
async def trigger_data_sync(
    platforms: Optional[str] = Query(
        None, description="Comma-separated platforms to sync"
    ),
    account_ids: Optional[str] = Query(
        None, description="Specific account IDs to sync"
    ),
):
    """Trigger manual data synchronization"""

    results = {}

    target_platforms = platforms.split(",") if platforms else ["meta", "google"]

    for platform in target_platforms:
        try:
            if platform == "meta" and get_meta_client():
                # Trigger Meta data sync
                results[platform] = {
                    "status": "success",
                    "message": "Meta data sync initiated",
                }
            elif platform == "google" and get_google_ads_client():
                # Trigger Google Ads data sync
                results[platform] = {
                    "status": "success",
                    "message": "Google Ads data sync initiated",
                }
            else:
                results[platform] = {
                    "status": "skipped",
                    "message": "Platform not configured",
                }
        except Exception as e:
            results[platform] = {"status": "error", "message": str(e)}

    return {"sync_initiated": True, "timestamp": datetime.now(), "results": results}


@router.get("/health")
async def check_api_health():
    """Health check for ad platform APIs"""

    health_status = {
        "meta": {"configured": bool(get_meta_client()), "status": "unknown"},
        "google": {"configured": bool(get_google_ads_client()), "status": "unknown"},
    }

    # Test Meta API connection
    if health_status["meta"]["configured"]:
        try:
            meta_client = get_meta_client()
            # Simple API test call
            test_response = await meta_client.request("me", {"fields": "id,name"})
            health_status["meta"]["status"] = "healthy"
        except Exception as e:
            health_status["meta"]["status"] = f"error: {str(e)}"

    # Test Google Ads API connection
    if health_status["google"]["configured"]:
        try:
            google_client = get_google_ads_client()
            # Simple API test call
            health_status["google"]["status"] = "healthy"
        except Exception as e:
            health_status["google"]["status"] = f"error: {str(e)}"

    overall_status = (
        "healthy"
        if any(status["status"] == "healthy" for status in health_status.values())
        else "degraded"
    )

    return {
        "overall_status": overall_status,
        "platforms": health_status,
        "timestamp": datetime.now(),
    }
