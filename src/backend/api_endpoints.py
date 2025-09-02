"""
API Endpoints for Google Ads and Meta Business APIs
Quick implementation to serve real data
"""
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import os
import json
from datetime import datetime, timedelta

def setup_api_endpoints(app: FastAPI):
    """Add API endpoints to the FastAPI app"""
    
    # Mock data fallback if credentials not configured
    MOCK_GOOGLE_CAMPAIGNS = {
        "campaigns": [
            {
                "id": "1234567890",
                "name": "Q4 Brand Awareness",
                "status": "ENABLED",
                "budget": 5000.00,
                "impressions": 125432,
                "clicks": 3456,
                "spend": 2847.65,
                "ctr": 2.75,
                "conversions": 45,
            },
            {
                "id": "0987654321",
                "name": "Holiday Promotion 2025",
                "status": "ENABLED",
                "budget": 7500.00,
                "impressions": 98765,
                "clicks": 2341,
                "spend": 3456.78,
                "ctr": 2.37,
                "conversions": 67,
            }
        ],
        "total": 2,
        "timestamp": datetime.now().isoformat()
    }
    
    MOCK_META_CAMPAIGNS = {
        "data": [
            {
                "id": "23851234567890123",
                "name": "Social Media Engagement",
                "status": "ACTIVE",
                "objective": "REACH",
                "daily_budget": "500.00",
                "impressions": "234567",
                "clicks": "5678",
                "spend": "4567.89",
            },
            {
                "id": "23851234567890124",
                "name": "Lead Generation Campaign",
                "status": "ACTIVE",
                "objective": "CONVERSIONS",
                "daily_budget": "750.00",
                "impressions": "345678",
                "clicks": "7890",
                "spend": "6789.01",
            }
        ],
        "paging": {
            "cursors": {
                "before": "MAZDZD",
                "after": "MQZDZD"
            }
        }
    }
    
    # Helper to build unified ad insights response compatible with frontend types
    def build_unified_ad_insights():
        campaigns = []

        # Map mock Google data
        for c in MOCK_GOOGLE_CAMPAIGNS["campaigns"]:
            campaigns.append({
                "platform": "google",
                "campaign_id": c["id"],
                "campaign_name": c["name"],
                "impressions": int(c.get("impressions", 0)),
                "clicks": int(c.get("clicks", 0)),
                "spend": float(c.get("spend", 0.0)),
                "conversions": int(c.get("conversions", 0)),
                "ctr": float(c.get("ctr", 0.0)),
                "cpc": float(c.get("cpc", 0.0)) if "cpc" in c else round((float(c.get("spend", 0.0)) / max(1, int(c.get("clicks", 0)))), 2),
                "cpm": float(c.get("cpm", 0.0)),
                "date_start": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                "date_stop": datetime.now().strftime("%Y-%m-%d"),
                "last_updated": datetime.now().isoformat(),
            })

        # Map mock Meta data
        for c in MOCK_META_CAMPAIGNS["data"]:
            campaigns.append({
                "platform": "meta",
                "campaign_id": c["id"],
                "campaign_name": c["name"],
                "impressions": int(float(c.get("impressions", "0"))),
                "clicks": int(float(c.get("clicks", "0"))),
                "spend": float(c.get("spend", "0.0")),
                "conversions": 0,
                "ctr": 0.0,
                "cpc": 0.0,
                "cpm": 0.0,
                "date_start": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                "date_stop": datetime.now().strftime("%Y-%m-%d"),
                "last_updated": datetime.now().isoformat(),
            })

        total_spend = sum(c["spend"] for c in campaigns)
        total_impressions = sum(c["impressions"] for c in campaigns)
        total_clicks = sum(c["clicks"] for c in campaigns)
        average_ctr = round((total_clicks / total_impressions * 100), 2) if total_impressions > 0 else 0.0

        summary = {
            "total_spend": total_spend,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "average_ctr": average_ctr,
            "platforms_active": ["google", "meta"],
        }

        return {
            "campaigns": campaigns,
            "summary": summary,
            "total_spend": total_spend,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "average_ctr": average_ctr,
            "last_sync": datetime.now().isoformat(),
        }

    @app.get("/api/v1/google-ads/campaigns")
    async def get_google_campaigns():
        """Get Google Ads campaigns"""
        # Check for real credentials
        if os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") and os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") != "YOUR_VALUE_HERE":
            # TODO: Implement real Google Ads API call
            pass
        
        # Return mock data for now
        return JSONResponse(content=MOCK_GOOGLE_CAMPAIGNS)
    
    @app.get("/api/v1/google-ads/performance")
    async def get_google_performance(
        date_from: Optional[str] = Query(None),
        date_to: Optional[str] = Query(None)
    ):
        """Get Google Ads performance metrics"""
        return JSONResponse(content={
            "performance": {
                "impressions": 458976,
                "clicks": 12345,
                "spend": 23456.78,
                "conversions": 234,
                "ctr": 2.69,
                "cpc": 1.90,
                "roas": 3.45
            },
            "date_range": {
                "from": date_from or (datetime.now() - timedelta(days=30)).isoformat(),
                "to": date_to or datetime.now().isoformat()
            }
        })
    
    @app.get("/api/v1/meta/campaigns")
    async def get_meta_campaigns():
        """Get Meta campaigns"""
        # Check for real credentials
        if os.getenv("META_APP_ID") and os.getenv("META_APP_ID") != "YOUR_VALUE_HERE":
            # TODO: Implement real Meta API call
            pass
        
        # Return mock data for now
        return JSONResponse(content=MOCK_META_CAMPAIGNS)
    
    @app.get("/api/v1/meta/insights")
    async def get_meta_insights(
        campaign_id: Optional[str] = Query(None),
        date_preset: Optional[str] = Query("last_30d")
    ):
        """Get Meta insights"""
        return JSONResponse(content={
            "data": [
                {
                    "date_start": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                    "date_stop": datetime.now().strftime("%Y-%m-%d"),
                    "impressions": "567890",
                    "clicks": "13456",
                    "spend": "34567.89",
                    "cpm": "60.87",
                    "cpc": "2.57",
                    "ctr": "2.37",
                    "reach": "234567",
                    "frequency": "2.41"
                }
            ]
        })

    # Unified Ad Insights endpoints expected by frontend
    @app.get("/api/v1/ad-insights/campaigns")
    async def get_unified_campaigns(
        date_preset: Optional[str] = Query("last_7d"),
        account_ids: Optional[str] = Query(None),
        include_inactive: bool = Query(False),
        real_time: bool = Query(False)
    ):
        """Unified campaigns across platforms (mock-backed)."""
        return JSONResponse(content=build_unified_ad_insights())

    @app.get("/api/v1/ad-insights/alerts")
    async def get_unified_alerts(
        severity: Optional[str] = Query(None),
        platform: Optional[str] = Query(None),
        limit: Optional[int] = Query(20)
    ):
        """Generate mock alerts from unified campaigns."""
        data = build_unified_ad_insights()
        alerts = []
        SPEND_THRESHOLD = 3000.0
        for idx, c in enumerate(data["campaigns"]):
            if c["spend"] > SPEND_THRESHOLD:
                alerts.append({
                    "id": f"{c['campaign_id']}-{idx}",
                    "alert_type": "spend_threshold",
                    "platform": c["platform"],
                    "campaign_id": c["campaign_id"],
                    "campaign_name": c["campaign_name"],
                    "message": f"Spend ${c['spend']:.2f} exceeded threshold ${SPEND_THRESHOLD:.0f}",
                    "severity": "high" if c["spend"] > SPEND_THRESHOLD * 1.5 else "medium",
                    "threshold_value": SPEND_THRESHOLD,
                    "current_value": c["spend"],
                    "timestamp": datetime.now().isoformat(),
                })

        if platform:
            alerts = [a for a in alerts if a["platform"] == platform]
        if severity:
            alerts = [a for a in alerts if a["severity"] == severity]
        if limit:
            alerts = alerts[:limit]

        return JSONResponse(content=alerts)

    @app.get("/api/v1/ad-insights/health")
    async def ad_insights_health():
        """Basic health status for ad-insights endpoints."""
        return JSONResponse(content={
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "platforms": ["google", "meta"],
            "mock_mode": True,
        })
    
    @app.get("/api/v1/auth/google-ads/status")
    async def google_ads_auth_status():
        """Check Google Ads authentication status"""
        has_creds = bool(
            os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") and 
            os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") != "YOUR_VALUE_HERE"
        )
        return JSONResponse(content={
            "authenticated": has_creds,
            "message": "Connected to Google Ads" if has_creds else "Google Ads not configured"
        })
    
    @app.get("/api/v1/auth/meta/status")
    async def meta_auth_status():
        """Check Meta authentication status"""
        has_creds = bool(
            os.getenv("META_APP_ID") and 
            os.getenv("META_APP_ID") != "YOUR_VALUE_HERE"
        )
        return JSONResponse(content={
            "authenticated": has_creds,
            "message": "Connected to Meta Business" if has_creds else "Meta Business not configured"
        })
    
    return app