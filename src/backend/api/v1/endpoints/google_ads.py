"""
Google Ads data retrieval endpoints.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from core.deps import get_current_user
from models.user import User
from services.googleAds.google_ads_service import google_ads_service

logger = logging.getLogger(__name__)

router = APIRouter()


class SearchStreamRequest(BaseModel):
    """Request model for search stream endpoint."""
    query: str = Field(..., description="Google Ads Query Language (GAQL) query")
    page_size: Optional[int] = Field(None, ge=1, le=10000, description="Maximum number of results")


class DateRangeRequest(BaseModel):
    """Request model for date range queries."""
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    

class MetricsRequest(DateRangeRequest):
    """Request model for metrics queries."""
    segments: Optional[List[str]] = Field(None, description="Segments to include (date, campaign, ad_group)")
    metrics: Optional[List[str]] = Field(None, description="Metrics to retrieve")


@router.get("/google-ads/customers")
async def get_accessible_customers(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get list of Google Ads customer accounts accessible to the organization.
    
    Returns customer account information including IDs, names, and metadata.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        customers = await google_ads_service.get_accessible_customers(current_user.org_id)
        
        return {
            "success": True,
            "customers": customers,
            "count": len(customers)
        }
        
    except Exception as e:
        logger.error(f"Error getting accessible customers: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve customer accounts: {str(e)}"
        )


@router.get("/google-ads/customers/{customer_id}")
async def get_customer_details(
    customer_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get detailed information for a specific customer account.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        customers = await google_ads_service.get_accessible_customers(current_user.org_id)
        
        # Find the specific customer
        customer = next((c for c in customers if c["customer_id"] == customer_id), None)
        
        if not customer:
            raise HTTPException(
                status_code=404,
                detail=f"Customer {customer_id} not found or not accessible"
            )
        
        return {
            "success": True,
            "customer": customer
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting customer details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve customer details: {str(e)}"
        )


@router.get("/google-ads/campaigns/{customer_id}")
async def get_campaigns(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    page_size: int = Query(50, ge=1, le=1000, description="Number of campaigns to retrieve")
) -> Dict[str, Any]:
    """
    Get campaigns for a specific Google Ads customer account.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        campaigns = await google_ads_service.get_campaigns(
            current_user.org_id, 
            customer_id, 
            page_size
        )
        
        return {
            "success": True,
            "customer_id": customer_id,
            "campaigns": campaigns,
            "count": len(campaigns)
        }
        
    except Exception as e:
        logger.error(f"Error getting campaigns for customer {customer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve campaigns: {str(e)}"
        )


@router.get("/google-ads/ad-groups/{customer_id}")
async def get_ad_groups(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    campaign_id: Optional[str] = Query(None, description="Filter by campaign ID"),
    page_size: int = Query(50, ge=1, le=1000, description="Number of ad groups to retrieve")
) -> Dict[str, Any]:
    """
    Get ad groups for a specific customer, optionally filtered by campaign.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        ad_groups = await google_ads_service.get_ad_groups(
            current_user.org_id,
            customer_id,
            campaign_id,
            page_size
        )
        
        return {
            "success": True,
            "customer_id": customer_id,
            "campaign_id": campaign_id,
            "ad_groups": ad_groups,
            "count": len(ad_groups)
        }
        
    except Exception as e:
        logger.error(f"Error getting ad groups for customer {customer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve ad groups: {str(e)}"
        )


@router.post("/google-ads/metrics/{customer_id}")
async def get_performance_metrics(
    customer_id: str,
    request: MetricsRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get performance metrics for campaigns, ad groups, or other entities.
    
    Supports various segments (date, campaign, ad_group) and metrics
    (impressions, clicks, cost, conversions, etc.).
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        # Validate date range
        try:
            start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
            end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
            
            if end_date < start_date:
                raise HTTPException(
                    status_code=400,
                    detail="End date must be after start date"
                )
            
            # Limit to reasonable date range (2 years)
            if (end_date - start_date).days > 730:
                raise HTTPException(
                    status_code=400,
                    detail="Date range cannot exceed 2 years"
                )
                
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        date_range = {
            "start_date": request.start_date,
            "end_date": request.end_date
        }
        
        metrics = await google_ads_service.get_performance_metrics(
            current_user.org_id,
            customer_id,
            date_range,
            request.segments,
            request.metrics
        )
        
        return {
            "success": True,
            "customer_id": customer_id,
            "date_range": date_range,
            "segments": request.segments,
            "metrics_requested": request.metrics,
            "data": metrics,
            "count": len(metrics)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting metrics for customer {customer_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve performance metrics: {str(e)}"
        )


@router.post("/google-ads/search-stream")
async def search_stream(
    request: SearchStreamRequest,
    customer_id: str = Query(..., description="Google Ads customer ID"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Execute a Google Ads Query Language (GAQL) search stream query.
    
    This endpoint allows for flexible querying of Google Ads data using GAQL.
    Use this for custom reports and advanced data retrieval.
    
    Example GAQL queries:
    - SELECT campaign.name, metrics.clicks FROM campaign WHERE campaign.status = 'ENABLED'
    - SELECT ad_group.name, metrics.impressions FROM ad_group WHERE segments.date = '2024-01-01'
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        # Basic query validation
        query = request.query.strip()
        if not query.upper().startswith("SELECT"):
            raise HTTPException(
                status_code=400,
                detail="Query must start with SELECT"
            )
        
        # Prevent potentially dangerous queries
        dangerous_keywords = ["DELETE", "UPDATE", "INSERT", "DROP", "ALTER", "CREATE"]
        if any(keyword in query.upper() for keyword in dangerous_keywords):
            raise HTTPException(
                status_code=400,
                detail="Query contains prohibited keywords"
            )
        
        results = await google_ads_service.search_stream(
            current_user.org_id,
            customer_id,
            query,
            request.page_size
        )
        
        return {
            "success": True,
            "customer_id": customer_id,
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing search stream query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute query: {str(e)}"
        )


@router.get("/google-ads/reports/summary/{customer_id}")
async def get_account_summary(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365, description="Number of days to include in summary")
) -> Dict[str, Any]:
    """
    Get a comprehensive account summary with key metrics.
    
    Returns overview data including campaign performance, spend, and trends.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        # Calculate date range
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        date_range = {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        }
        
        # Get campaigns
        campaigns = await google_ads_service.get_campaigns(current_user.org_id, customer_id)
        
        # Get performance metrics
        metrics = await google_ads_service.get_performance_metrics(
            current_user.org_id,
            customer_id,
            date_range,
            segments=["date"],
            metrics=["impressions", "clicks", "cost_micros", "conversions", "conversion_value"]
        )
        
        # Calculate totals
        total_impressions = sum(row.get("impressions", 0) for row in metrics)
        total_clicks = sum(row.get("clicks", 0) for row in metrics)
        total_cost = sum(row.get("cost", 0) for row in metrics)
        total_conversions = sum(row.get("conversions", 0) for row in metrics)
        total_conversion_value = sum(row.get("conversion_value", 0) for row in metrics)
        
        # Calculate rates
        ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        cpc = (total_cost / total_clicks) if total_clicks > 0 else 0
        conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
        
        summary = {
            "customer_id": customer_id,
            "date_range": date_range,
            "campaigns": {
                "total": len(campaigns),
                "enabled": len([c for c in campaigns if c["status"] == "ENABLED"]),
                "paused": len([c for c in campaigns if c["status"] == "PAUSED"])
            },
            "performance": {
                "impressions": total_impressions,
                "clicks": total_clicks,
                "cost": round(total_cost, 2),
                "conversions": total_conversions,
                "conversion_value": round(total_conversion_value, 2),
                "ctr": round(ctr, 2),
                "cpc": round(cpc, 2),
                "conversion_rate": round(conversion_rate, 2)
            },
            "daily_metrics": metrics
        }
        
        return {
            "success": True,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Error getting account summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve account summary: {str(e)}"
        )