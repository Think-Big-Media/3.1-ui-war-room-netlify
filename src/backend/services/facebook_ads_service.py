"""
Facebook Marketing API Service
Handles integration with Facebook Ads API for campaign management and analytics.
"""

import os
import logging
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime, timedelta
from core.config import settings

logger = logging.getLogger(__name__)


class FacebookAdsService:
    """
    Service for interacting with Facebook Marketing API.
    
    Features:
    - Campaign management
    - Ad performance metrics
    - Audience insights
    - Ad creative management
    """
    
    def __init__(self):
        self.base_url = "https://graph.facebook.com/v19.0"
        self.access_token = settings.FACEBOOK_WARROOM_API_TOKEN
        
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make authenticated request to Facebook API.
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            params: Query parameters
            data: Request body data
            
        Returns:
            API response data
        """
        try:
            # Add access token to params
            if params is None:
                params = {}
            params["access_token"] = self.access_token
            
            url = f"{self.base_url}/{endpoint}"
            
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    params=params,
                    json=data
                )
                response.raise_for_status()
                
                return response.json()
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Facebook API error: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Failed to make Facebook API request: {str(e)}")
            raise
            
    async def get_ad_accounts(self) -> List[Dict[str, Any]]:
        """
        Get all ad accounts accessible by the token.
        
        Returns:
            List of ad accounts
        """
        try:
            response = await self._make_request(
                "GET",
                "me/adaccounts",
                params={
                    "fields": "id,name,account_status,currency,timezone_name,amount_spent"
                }
            )
            
            accounts = response.get("data", [])
            logger.info(f"Retrieved {len(accounts)} ad accounts")
            
            return accounts
            
        except Exception as e:
            logger.error(f"Failed to get ad accounts: {str(e)}")
            return []
            
    async def get_campaigns(
        self,
        ad_account_id: str,
        status: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get campaigns for an ad account.
        
        Args:
            ad_account_id: Facebook ad account ID
            status: Filter by campaign status (ACTIVE, PAUSED, etc.)
            
        Returns:
            List of campaigns
        """
        try:
            params = {
                "fields": "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time"
            }
            
            if status:
                params["filtering"] = f'[{{"field":"status","operator":"IN","value":{status}}}]'
                
            response = await self._make_request(
                "GET",
                f"{ad_account_id}/campaigns",
                params=params
            )
            
            campaigns = response.get("data", [])
            logger.info(f"Retrieved {len(campaigns)} campaigns for account {ad_account_id}")
            
            return campaigns
            
        except Exception as e:
            logger.error(f"Failed to get campaigns: {str(e)}")
            return []
            
    async def get_campaign_insights(
        self,
        campaign_id: str,
        date_preset: str = "last_7d"
    ) -> Dict[str, Any]:
        """
        Get performance insights for a campaign.
        
        Args:
            campaign_id: Facebook campaign ID
            date_preset: Date range preset (today, yesterday, last_7d, last_30d, etc.)
            
        Returns:
            Campaign insights data
        """
        try:
            response = await self._make_request(
                "GET",
                f"{campaign_id}/insights",
                params={
                    "fields": "impressions,reach,clicks,ctr,cpc,cpm,spend,conversions,cost_per_conversion",
                    "date_preset": date_preset,
                    "level": "campaign"
                }
            )
            
            insights = response.get("data", [])
            if insights:
                logger.info(f"Retrieved insights for campaign {campaign_id}")
                return insights[0]
            
            return {}
            
        except Exception as e:
            logger.error(f"Failed to get campaign insights: {str(e)}")
            return {}
            
    async def get_ads(
        self,
        ad_account_id: str,
        campaign_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get ads for an ad account or campaign.
        
        Args:
            ad_account_id: Facebook ad account ID
            campaign_id: Optional campaign ID to filter by
            limit: Maximum number of ads to retrieve
            
        Returns:
            List of ads
        """
        try:
            endpoint = f"{ad_account_id}/ads"
            params = {
                "fields": "id,name,status,creative,created_time,effective_status",
                "limit": limit
            }
            
            if campaign_id:
                params["filtering"] = f'[{{"field":"campaign_id","operator":"EQUAL","value":"{campaign_id}"}}]'
                
            response = await self._make_request("GET", endpoint, params=params)
            
            ads = response.get("data", [])
            logger.info(f"Retrieved {len(ads)} ads")
            
            return ads
            
        except Exception as e:
            logger.error(f"Failed to get ads: {str(e)}")
            return []
            
    async def get_audience_insights(
        self,
        ad_account_id: str,
        targeting_spec: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get audience insights based on targeting specifications.
        
        Args:
            ad_account_id: Facebook ad account ID
            targeting_spec: Targeting specifications
            
        Returns:
            Audience insights data
        """
        try:
            response = await self._make_request(
                "GET",
                f"{ad_account_id}/reachestimate",
                params={
                    "targeting_spec": targeting_spec,
                    "optimization_goal": "REACH"
                }
            )
            
            logger.info(f"Retrieved audience insights for account {ad_account_id}")
            return response.get("data", {})
            
        except Exception as e:
            logger.error(f"Failed to get audience insights: {str(e)}")
            return {}
            
    async def create_campaign(
        self,
        ad_account_id: str,
        name: str,
        objective: str,
        status: str = "PAUSED",
        daily_budget: Optional[int] = None,
        lifetime_budget: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a new campaign.
        
        Args:
            ad_account_id: Facebook ad account ID
            name: Campaign name
            objective: Campaign objective (LINK_CLICKS, CONVERSIONS, etc.)
            status: Campaign status (ACTIVE or PAUSED)
            daily_budget: Daily budget in cents
            lifetime_budget: Lifetime budget in cents
            
        Returns:
            Created campaign data
        """
        try:
            data = {
                "name": name,
                "objective": objective,
                "status": status
            }
            
            if daily_budget:
                data["daily_budget"] = daily_budget
            elif lifetime_budget:
                data["lifetime_budget"] = lifetime_budget
                
            response = await self._make_request(
                "POST",
                f"{ad_account_id}/campaigns",
                data=data
            )
            
            logger.info(f"Created campaign '{name}' with ID: {response.get('id')}")
            return response
            
        except Exception as e:
            logger.error(f"Failed to create campaign: {str(e)}")
            raise
            
    async def update_campaign_status(
        self,
        campaign_id: str,
        status: str
    ) -> bool:
        """
        Update campaign status.
        
        Args:
            campaign_id: Facebook campaign ID
            status: New status (ACTIVE, PAUSED, DELETED)
            
        Returns:
            Success status
        """
        try:
            await self._make_request(
                "POST",
                campaign_id,
                data={"status": status}
            )
            
            logger.info(f"Updated campaign {campaign_id} status to {status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update campaign status: {str(e)}")
            return False
            
    async def get_custom_audiences(
        self,
        ad_account_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get custom audiences for an ad account.
        
        Args:
            ad_account_id: Facebook ad account ID
            
        Returns:
            List of custom audiences
        """
        try:
            response = await self._make_request(
                "GET",
                f"{ad_account_id}/customaudiences",
                params={
                    "fields": "id,name,description,size,time_created,time_updated"
                }
            )
            
            audiences = response.get("data", [])
            logger.info(f"Retrieved {len(audiences)} custom audiences")
            
            return audiences
            
        except Exception as e:
            logger.error(f"Failed to get custom audiences: {str(e)}")
            return []


# Global Facebook Ads service instance
facebook_ads_service = FacebookAdsService()


# Helper functions for easy access
async def get_facebook_campaigns(
    ad_account_id: str,
    status: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Get Facebook campaigns."""
    return await facebook_ads_service.get_campaigns(ad_account_id, status)


async def get_facebook_insights(
    campaign_id: str,
    date_preset: str = "last_7d"
) -> Dict[str, Any]:
    """Get Facebook campaign insights."""
    return await facebook_ads_service.get_campaign_insights(campaign_id, date_preset)


async def create_facebook_campaign(
    ad_account_id: str,
    name: str,
    objective: str,
    **kwargs
) -> Dict[str, Any]:
    """Create a new Facebook campaign."""
    return await facebook_ads_service.create_campaign(
        ad_account_id,
        name,
        objective,
        **kwargs
    )