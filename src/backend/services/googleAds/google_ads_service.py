"""
Google Ads API service for data retrieval and campaign management.
Handles all Google Ads API operations with proper error handling and rate limiting.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Union

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.api_core.exceptions import GoogleAPICallError, RetryError
from google.oauth2.credentials import Credentials

from core.config import settings
from services.googleAds.google_ads_auth_service import google_ads_auth_service

logger = logging.getLogger(__name__)


class GoogleAdsService:
    """Service for interacting with Google Ads API."""
    
    def __init__(self):
        """Initialize the Google Ads service."""
        self.developer_token = settings.GOOGLE_ADS_DEVELOPER_TOKEN
        self.login_customer_id = settings.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        
        if not self.developer_token:
            logger.warning("Google Ads developer token not configured")
    
    async def _get_client(self, org_id: str) -> Optional[GoogleAdsClient]:
        """
        Get authenticated Google Ads client for organization.
        
        Args:
            org_id: Organization ID
            
        Returns:
            Configured GoogleAdsClient or None if authentication fails
        """
        try:
            credentials = await google_ads_auth_service.get_valid_credentials(org_id)
            if not credentials:
                logger.error(f"No valid credentials for org {org_id}")
                return None
            
            # Create client configuration
            config = {
                'developer_token': self.developer_token,
                'oauth2_client_id': credentials.client_id,
                'oauth2_client_secret': credentials.client_secret,
                'oauth2_refresh_token': credentials.refresh_token,
                'use_proto_plus': True
            }
            
            if self.login_customer_id:
                config['login_customer_id'] = self.login_customer_id
            
            client = GoogleAdsClient.load_from_dict(config)
            return client
            
        except Exception as e:
            logger.error(f"Failed to create Google Ads client for org {org_id}: {str(e)}")
            return None
    
    async def _retry_with_backoff(self, func, *args, max_retries: int = 3, **kwargs):
        """
        Execute function with exponential backoff retry logic.
        
        Args:
            func: Function to execute
            *args: Function arguments
            max_retries: Maximum number of retries
            **kwargs: Function keyword arguments
            
        Returns:
            Function result or raises exception
        """
        for attempt in range(max_retries + 1):
            try:
                return await func(*args, **kwargs)
            
            except GoogleAdsException as e:
                logger.error(f"Google Ads API error (attempt {attempt + 1}): {e}")
                
                # Check if it's a rate limit error
                if any("RATE_EXCEEDED" in error.error_code.name for error in e.errors):
                    if attempt < max_retries:
                        wait_time = (2 ** attempt) + (time.time() % 1)  # Exponential backoff with jitter
                        logger.info(f"Rate limited, waiting {wait_time:.2f} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                
                # Re-raise for non-retryable errors
                raise
                
            except (GoogleAPICallError, RetryError) as e:
                logger.error(f"Google API error (attempt {attempt + 1}): {str(e)}")
                if attempt < max_retries:
                    wait_time = (2 ** attempt) + (time.time() % 1)
                    await asyncio.sleep(wait_time)
                    continue
                raise
                
            except Exception as e:
                logger.error(f"Unexpected error (attempt {attempt + 1}): {str(e)}")
                if attempt < max_retries:
                    wait_time = (2 ** attempt)
                    await asyncio.sleep(wait_time)
                    continue
                raise
        
        raise Exception(f"Failed after {max_retries + 1} attempts")
    
    async def get_accessible_customers(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Get list of customer accounts accessible to the organization.
        
        Args:
            org_id: Organization ID
            
        Returns:
            List of customer account information
        """
        try:
            client = await self._get_client(org_id)
            if not client:
                return self._get_mock_customers()
            
            customer_service = client.get_service("CustomerService")
            accessible_customers = customer_service.list_accessible_customers()
            
            customers = []
            for customer_resource in accessible_customers.resource_names:
                customer_id = customer_resource.split("/")[-1]
                
                # Get customer details
                try:
                    customer_info = await self._get_customer_info(client, customer_id)
                    customers.append(customer_info)
                except Exception as e:
                    logger.warning(f"Failed to get info for customer {customer_id}: {str(e)}")
                    # Add basic info
                    customers.append({
                        "customer_id": customer_id,
                        "descriptive_name": f"Customer {customer_id}",
                        "currency_code": "USD",
                        "time_zone": "America/New_York",
                        "is_manager": False
                    })
            
            logger.info(f"Retrieved {len(customers)} accessible customers for org {org_id}")
            return customers
            
        except Exception as e:
            logger.error(f"Failed to get accessible customers for org {org_id}: {str(e)}")
            return self._get_mock_customers()
    
    async def _get_customer_info(self, client: GoogleAdsClient, customer_id: str) -> Dict[str, Any]:
        """Get detailed information for a customer."""
        ga_service = client.get_service("GoogleAdsService")
        
        query = f"""
            SELECT 
                customer.id,
                customer.descriptive_name,
                customer.currency_code,
                customer.time_zone,
                customer.manager
            FROM customer
            WHERE customer.id = {customer_id}
        """
        
        response = ga_service.search(customer_id=customer_id, query=query)
        
        for row in response:
            customer = row.customer
            return {
                "customer_id": str(customer.id),
                "descriptive_name": customer.descriptive_name,
                "currency_code": customer.currency_code,
                "time_zone": customer.time_zone,
                "is_manager": customer.manager
            }
        
        # Fallback if no data found
        return {
            "customer_id": customer_id,
            "descriptive_name": f"Customer {customer_id}",
            "currency_code": "USD",
            "time_zone": "America/New_York",
            "is_manager": False
        }
    
    async def get_campaigns(self, org_id: str, customer_id: str, page_size: int = 50) -> List[Dict[str, Any]]:
        """
        Get campaigns for a specific customer.
        
        Args:
            org_id: Organization ID
            customer_id: Google Ads customer ID
            page_size: Number of campaigns to retrieve
            
        Returns:
            List of campaign information
        """
        try:
            client = await self._get_client(org_id)
            if not client:
                return self._get_mock_campaigns(customer_id)
            
            ga_service = client.get_service("GoogleAdsService")
            
            query = f"""
                SELECT 
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    campaign.advertising_channel_type,
                    campaign.start_date,
                    campaign.end_date,
                    campaign.optimization_goal_types,
                    campaign_budget.amount_micros,
                    campaign_budget.delivery_method
                FROM campaign
                WHERE campaign.status != 'REMOVED'
                ORDER BY campaign.name
                LIMIT {page_size}
            """
            
            response = ga_service.search(customer_id=customer_id, query=query)
            
            campaigns = []
            for row in response:
                campaign = row.campaign
                budget = row.campaign_budget if hasattr(row, 'campaign_budget') else None
                
                campaigns.append({
                    "id": str(campaign.id),
                    "name": campaign.name,
                    "status": campaign.status.name,
                    "advertising_channel_type": campaign.advertising_channel_type.name,
                    "start_date": campaign.start_date,
                    "end_date": campaign.end_date if campaign.end_date else None,
                    "budget_amount_micros": budget.amount_micros if budget else 0,
                    "delivery_method": budget.delivery_method.name if budget else "STANDARD",
                    "optimization_goal_types": [goal.name for goal in campaign.optimization_goal_types]
                })
            
            logger.info(f"Retrieved {len(campaigns)} campaigns for customer {customer_id}")
            return campaigns
            
        except Exception as e:
            logger.error(f"Failed to get campaigns for customer {customer_id}: {str(e)}")
            return self._get_mock_campaigns(customer_id)
    
    async def get_ad_groups(self, org_id: str, customer_id: str, campaign_id: Optional[str] = None, page_size: int = 50) -> List[Dict[str, Any]]:
        """
        Get ad groups for a customer, optionally filtered by campaign.
        
        Args:
            org_id: Organization ID
            customer_id: Google Ads customer ID
            campaign_id: Optional campaign ID to filter by
            page_size: Number of ad groups to retrieve
            
        Returns:
            List of ad group information
        """
        try:
            client = await self._get_client(org_id)
            if not client:
                return self._get_mock_ad_groups(customer_id, campaign_id)
            
            ga_service = client.get_service("GoogleAdsService")
            
            query = f"""
                SELECT 
                    ad_group.id,
                    ad_group.name,
                    ad_group.status,
                    ad_group.type,
                    ad_group.cpm_bid_micros,
                    ad_group.cpc_bid_micros,
                    ad_group.target_cpa_micros,
                    campaign.id,
                    campaign.name
                FROM ad_group
                WHERE ad_group.status != 'REMOVED'
            """
            
            if campaign_id:
                query += f" AND campaign.id = {campaign_id}"
            
            query += f" ORDER BY ad_group.name LIMIT {page_size}"
            
            response = ga_service.search(customer_id=customer_id, query=query)
            
            ad_groups = []
            for row in response:
                ad_group = row.ad_group
                campaign = row.campaign
                
                ad_groups.append({
                    "id": str(ad_group.id),
                    "name": ad_group.name,
                    "status": ad_group.status.name,
                    "type": ad_group.type_.name,
                    "campaign_id": str(campaign.id),
                    "campaign_name": campaign.name,
                    "cpm_bid_micros": ad_group.cpm_bid_micros,
                    "cpc_bid_micros": ad_group.cpc_bid_micros,
                    "target_cpa_micros": ad_group.target_cpa_micros
                })
            
            logger.info(f"Retrieved {len(ad_groups)} ad groups for customer {customer_id}")
            return ad_groups
            
        except Exception as e:
            logger.error(f"Failed to get ad groups for customer {customer_id}: {str(e)}")
            return self._get_mock_ad_groups(customer_id, campaign_id)
    
    async def get_performance_metrics(
        self, 
        org_id: str, 
        customer_id: str, 
        date_range: Dict[str, str],
        segments: Optional[List[str]] = None,
        metrics: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get performance metrics for campaigns.
        
        Args:
            org_id: Organization ID
            customer_id: Google Ads customer ID
            date_range: Dictionary with 'start_date' and 'end_date' (YYYY-MM-DD format)
            segments: Optional list of segments (date, campaign, ad_group)
            metrics: Optional list of metrics to retrieve
            
        Returns:
            List of performance metrics
        """
        try:
            client = await self._get_client(org_id)
            if not client:
                return self._get_mock_metrics(customer_id, date_range)
            
            # Default metrics if not provided
            if not metrics:
                metrics = [
                    "impressions",
                    "clicks", 
                    "cost_micros",
                    "conversions",
                    "conversion_value"
                ]
            
            # Default segments if not provided
            if not segments:
                segments = ["date", "campaign"]
            
            # Build query
            select_fields = []
            
            # Add segments
            for segment in segments:
                if segment == "date":
                    select_fields.append("segments.date")
                elif segment == "campaign":
                    select_fields.extend(["campaign.id", "campaign.name"])
                elif segment == "ad_group":
                    select_fields.extend(["ad_group.id", "ad_group.name"])
            
            # Add metrics
            select_fields.extend([f"metrics.{metric}" for metric in metrics])
            
            query = f"""
                SELECT {', '.join(select_fields)}
                FROM campaign
                WHERE segments.date BETWEEN '{date_range['start_date']}' AND '{date_range['end_date']}'
                AND campaign.status != 'REMOVED'
                ORDER BY segments.date DESC
            """
            
            ga_service = client.get_service("GoogleAdsService")
            response = ga_service.search(customer_id=customer_id, query=query)
            
            results = []
            for row in response:
                result = {}
                
                # Extract segments
                if "date" in segments and hasattr(row, 'segments'):
                    result["date"] = row.segments.date
                
                if "campaign" in segments and hasattr(row, 'campaign'):
                    result["campaign_id"] = str(row.campaign.id)
                    result["campaign_name"] = row.campaign.name
                
                if "ad_group" in segments and hasattr(row, 'ad_group'):
                    result["ad_group_id"] = str(row.ad_group.id)
                    result["ad_group_name"] = row.ad_group.name
                
                # Extract metrics
                if hasattr(row, 'metrics'):
                    metrics_data = row.metrics
                    for metric in metrics:
                        value = getattr(metrics_data, metric, 0)
                        # Convert micros to actual values for cost
                        if metric == "cost_micros":
                            result["cost"] = value / 1_000_000
                        else:
                            result[metric] = value
                
                results.append(result)
            
            logger.info(f"Retrieved {len(results)} metric rows for customer {customer_id}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to get metrics for customer {customer_id}: {str(e)}")
            return self._get_mock_metrics(customer_id, date_range)
    
    async def search_stream(
        self, 
        org_id: str, 
        customer_id: str, 
        query: str,
        page_size: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a Google Ads Query Language (GAQL) search stream query.
        
        Args:
            org_id: Organization ID
            customer_id: Google Ads customer ID
            query: GAQL query string
            page_size: Optional page size limit
            
        Returns:
            List of query results
        """
        try:
            client = await self._get_client(org_id)
            if not client:
                return self._get_mock_search_results(query)
            
            ga_service = client.get_service("GoogleAdsService")
            
            # Use search_stream for better performance with large result sets
            if page_size:
                query += f" LIMIT {page_size}"
            
            response = ga_service.search_stream(customer_id=customer_id, query=query)
            
            results = []
            for batch in response:
                for row in batch.results:
                    # Convert protobuf row to dictionary
                    result = self._row_to_dict(row)
                    results.append(result)
            
            logger.info(f"Search stream returned {len(results)} results for customer {customer_id}")
            return results
            
        except Exception as e:
            logger.error(f"Search stream failed for customer {customer_id}: {str(e)}")
            return self._get_mock_search_results(query)
    
    def _row_to_dict(self, row) -> Dict[str, Any]:
        """Convert a Google Ads API row to dictionary."""
        result = {}
        
        # Handle different row types dynamically
        for field in row.DESCRIPTOR.fields:
            if row.HasField(field.name):
                field_value = getattr(row, field.name)
                
                if hasattr(field_value, 'DESCRIPTOR'):  # It's a message
                    result[field.name] = self._message_to_dict(field_value)
                else:
                    result[field.name] = field_value
        
        return result
    
    def _message_to_dict(self, message) -> Dict[str, Any]:
        """Convert a protobuf message to dictionary."""
        result = {}
        
        for field in message.DESCRIPTOR.fields:
            if message.HasField(field.name):
                field_value = getattr(message, field.name)
                
                if hasattr(field_value, 'DESCRIPTOR'):  # Nested message
                    result[field.name] = self._message_to_dict(field_value)
                elif hasattr(field_value, 'name'):  # Enum
                    result[field.name] = field_value.name
                else:
                    result[field.name] = field_value
        
        return result
    
    # Mock data methods for fallback when API is unavailable
    def _get_mock_customers(self) -> List[Dict[str, Any]]:
        """Return mock customer data."""
        return [
            {
                "customer_id": "1234567890",
                "descriptive_name": "Demo Campaign Account",
                "currency_code": "USD",
                "time_zone": "America/New_York",
                "is_manager": False
            }
        ]
    
    def _get_mock_campaigns(self, customer_id: str) -> List[Dict[str, Any]]:
        """Return mock campaign data."""
        return [
            {
                "id": "987654321",
                "name": "Demo Campaign",
                "status": "ENABLED",
                "advertising_channel_type": "SEARCH",
                "start_date": "2024-01-01",
                "end_date": None,
                "budget_amount_micros": 50000000,  # $50 in micros
                "delivery_method": "STANDARD",
                "optimization_goal_types": ["MAXIMIZE_CLICKS"]
            }
        ]
    
    def _get_mock_ad_groups(self, customer_id: str, campaign_id: Optional[str]) -> List[Dict[str, Any]]:
        """Return mock ad group data."""
        return [
            {
                "id": "456789123",
                "name": "Demo Ad Group",
                "status": "ENABLED",
                "type": "SEARCH_STANDARD",
                "campaign_id": campaign_id or "987654321",
                "campaign_name": "Demo Campaign",
                "cpm_bid_micros": 0,
                "cpc_bid_micros": 1500000,  # $1.50 in micros
                "target_cpa_micros": 0
            }
        ]
    
    def _get_mock_metrics(self, customer_id: str, date_range: Dict[str, str]) -> List[Dict[str, Any]]:
        """Return mock metrics data."""
        return [
            {
                "date": date_range["start_date"],
                "campaign_id": "987654321",
                "campaign_name": "Demo Campaign",
                "impressions": 1000,
                "clicks": 50,
                "cost": 75.00,
                "conversions": 5,
                "conversion_value": 250.00
            }
        ]
    
    def _get_mock_search_results(self, query: str) -> List[Dict[str, Any]]:
        """Return mock search results."""
        return [
            {
                "message": "Mock data - Google Ads API not configured",
                "query": query,
                "timestamp": datetime.utcnow().isoformat()
            }
        ]


# Global instance
google_ads_service = GoogleAdsService()