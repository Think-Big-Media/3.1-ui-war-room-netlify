"""
Mock Meta Business API Service for Development and Testing

This service provides realistic mock data for Meta Business API responses,
enabling development and testing without requiring actual API access.

Features:
- Realistic mock data based on actual Meta API responses
- Configurable scenarios (success, error, rate limiting)
- Consistent data relationships (accounts, campaigns, ads)
- Performance simulation with realistic delays
- Error scenario testing
"""

import asyncio
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

import httpx
from fastapi import HTTPException


class MockScenario(Enum):
    """Available mock scenarios for testing different conditions."""
    SUCCESS = "success"
    RATE_LIMITED = "rate_limited" 
    INVALID_TOKEN = "invalid_token"
    NETWORK_ERROR = "network_error"
    INSUFFICIENT_PERMISSIONS = "insufficient_permissions"
    NO_AD_ACCOUNTS = "no_ad_accounts"
    EMPTY_CAMPAIGNS = "empty_campaigns"


@dataclass
class MockConfig:
    """Configuration for mock service behavior."""
    scenario: MockScenario = MockScenario.SUCCESS
    response_delay: float = 0.5  # Simulate API latency
    failure_rate: float = 0.0  # Percentage of calls that fail
    rate_limit_threshold: int = 100  # Calls per hour before rate limiting


class MockMetaService:
    """
    Mock implementation of Meta Business API service.
    
    Provides realistic mock data for development and testing without
    requiring actual Meta API credentials or network access.
    """
    
    def __init__(self, config: MockConfig = None):
        self.config = config or MockConfig()
        self.call_count = 0
        self.last_reset = datetime.utcnow()
        
        # Mock data storage
        self._mock_tokens = {}
        self._mock_ad_accounts = self._generate_mock_ad_accounts()
        self._mock_campaigns = self._generate_mock_campaigns()
        self._mock_insights = self._generate_mock_insights()
    
    async def handle_oauth_callback(self, code: str, redirect_uri: str, user_id: str) -> Dict[str, Any]:
        """
        Mock OAuth callback handling.
        
        Args:
            code: Authorization code from Meta
            redirect_uri: OAuth redirect URI
            user_id: Internal user ID
            
        Returns:
            Dict containing access token and user info
        """
        await self._simulate_api_delay()
        await self._check_scenario_conditions()
        
        if self.config.scenario == MockScenario.INVALID_TOKEN:
            raise HTTPException(
                status_code=400,
                detail="Invalid authorization code"
            )
        
        # Generate mock token
        mock_token = {
            "access_token": f"mock_token_{user_id}_{int(datetime.utcnow().timestamp())}",
            "token_type": "bearer",
            "expires_in": 5184000  # 60 days
        }
        
        # Store token for later use
        self._mock_tokens[user_id] = {
            **mock_token,
            "created_at": datetime.utcnow(),
            "user_id": user_id
        }
        
        # Get user's first ad account for convenience
        ad_accounts = await self.get_ad_accounts(user_id)
        selected_account = ad_accounts["data"][0]["id"] if ad_accounts["data"] else None
        
        return {
            "access_token": mock_token["access_token"],
            "token_type": mock_token["token_type"],
            "expires_in": mock_token["expires_in"],
            "account_id": selected_account,
            "user_id": user_id,
            "setup_complete": True
        }
    
    async def get_ad_accounts(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's Meta ad accounts.
        
        Args:
            user_id: Internal user ID
            
        Returns:
            Dict containing ad accounts data
        """
        await self._simulate_api_delay()
        await self._check_scenario_conditions()
        
        if self.config.scenario == MockScenario.NO_AD_ACCOUNTS:
            return {
                "data": [],
                "paging": {}
            }
        
        # Return subset of accounts for this user
        user_accounts = [
            account for account in self._mock_ad_accounts
            if hash(user_id) % 3 == hash(account["id"]) % 3  # Distribute accounts
        ]
        
        return {
            "data": user_accounts,
            "paging": {
                "cursors": {
                    "before": "MAZDZD",
                    "after": "MjQZD"
                }
            }
        }
    
    async def get_campaigns(self, account_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get campaigns for specified ad account.
        
        Args:
            account_id: Meta ad account ID
            user_id: Internal user ID
            
        Returns:
            Dict containing campaigns data
        """
        await self._simulate_api_delay()
        await self._check_scenario_conditions()
        
        if self.config.scenario == MockScenario.EMPTY_CAMPAIGNS:
            return {
                "data": [],
                "paging": {}
            }
        
        # Filter campaigns for this account
        account_campaigns = [
            campaign for campaign in self._mock_campaigns
            if campaign["account_id"] == account_id
        ]
        
        return {
            "data": account_campaigns,
            "paging": {
                "cursors": {
                    "before": "CAMPAIGN_BEFORE",
                    "after": "CAMPAIGN_AFTER"
                }
            }
        }
    
    async def get_campaign_insights(
        self, 
        campaign_id: str, 
        user_id: str,
        date_range: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Get insights data for specified campaign.
        
        Args:
            campaign_id: Meta campaign ID
            user_id: Internal user ID
            date_range: Date range for insights
            
        Returns:
            Dict containing campaign insights
        """
        await self._simulate_api_delay()
        await self._check_scenario_conditions()
        
        # Generate insights for date range
        start_date = date_range.get("since", "2024-08-01") if date_range else "2024-08-01"
        end_date = date_range.get("until", "2024-08-07") if date_range else "2024-08-07"
        
        # Find campaign insights
        campaign_insights = [
            insight for insight in self._mock_insights
            if insight["campaign_id"] == campaign_id
        ]
        
        if not campaign_insights:
            # Generate insights on-demand for this campaign
            campaign_insights = self._generate_campaign_insights(campaign_id, start_date, end_date)
        
        return {
            "data": campaign_insights,
            "paging": {}
        }
    
    async def get_account_insights(
        self,
        account_id: str,
        user_id: str,
        date_range: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Get aggregated insights for entire ad account.
        
        Args:
            account_id: Meta ad account ID  
            user_id: Internal user ID
            date_range: Date range for insights
            
        Returns:
            Dict containing account-level insights
        """
        await self._simulate_api_delay()
        await self._check_scenario_conditions()
        
        # Aggregate insights from all campaigns in account
        account_campaigns = await self.get_campaigns(account_id, user_id)
        
        total_spend = 0
        total_impressions = 0
        total_clicks = 0
        total_reach = 0
        
        for campaign in account_campaigns["data"]:
            campaign_insights = await self.get_campaign_insights(campaign["id"], user_id, date_range)
            for insight in campaign_insights["data"]:
                total_spend += float(insight.get("spend", 0))
                total_impressions += int(insight.get("impressions", 0))
                total_clicks += int(insight.get("clicks", 0))
                total_reach += int(insight.get("reach", 0))
        
        return {
            "data": [{
                "account_id": account_id,
                "spend": str(total_spend),
                "impressions": str(total_impressions),
                "clicks": str(total_clicks),
                "reach": str(total_reach),
                "ctr": str(round((total_clicks / max(total_impressions, 1)) * 100, 2)),
                "cpm": str(round((total_spend / max(total_impressions, 1)) * 1000, 2)),
                "date_start": date_range.get("since", "2024-08-01") if date_range else "2024-08-01",
                "date_stop": date_range.get("until", "2024-08-07") if date_range else "2024-08-07"
            }]
        }
    
    async def refresh_access_token(self, user_id: str) -> Dict[str, Any]:
        """
        Mock token refresh functionality.
        
        Args:
            user_id: Internal user ID
            
        Returns:
            Dict containing new access token
        """
        await self._simulate_api_delay()
        
        if user_id not in self._mock_tokens:
            raise HTTPException(
                status_code=401,
                detail="No token found for user"
            )
        
        # Generate new token
        new_token = {
            "access_token": f"refreshed_token_{user_id}_{int(datetime.utcnow().timestamp())}",
            "token_type": "bearer", 
            "expires_in": 5184000
        }
        
        self._mock_tokens[user_id].update(new_token)
        
        return new_token
    
    async def get_auth_status(self, user_id: str) -> Dict[str, Any]:
        """
        Check authentication status for user.
        
        Args:
            user_id: Internal user ID
            
        Returns:
            Dict containing auth status info
        """
        if user_id in self._mock_tokens:
            token_data = self._mock_tokens[user_id]
            created_at = token_data["created_at"]
            expires_in = token_data.get("expires_in", 5184000)
            expires_at = created_at + timedelta(seconds=expires_in)
            
            return {
                "authenticated": expires_at > datetime.utcnow(),
                "expires_at": expires_at.isoformat(),
                "account_id": token_data.get("account_id")
            }
        
        return {
            "authenticated": False,
            "expires_at": None,
            "account_id": None
        }
    
    async def disconnect_account(self, user_id: str) -> Dict[str, Any]:
        """
        Disconnect Meta account (revoke authorization).
        
        Args:
            user_id: Internal user ID
            
        Returns:
            Dict containing disconnection status
        """
        await self._simulate_api_delay()
        
        if user_id in self._mock_tokens:
            del self._mock_tokens[user_id]
        
        return {
            "success": True,
            "message": "Account disconnected successfully"
        }
    
    # Private helper methods
    
    async def _simulate_api_delay(self):
        """Simulate realistic API response time."""
        if self.config.response_delay > 0:
            # Add some random variation to delay
            actual_delay = self.config.response_delay * (0.5 + random.random())
            await asyncio.sleep(actual_delay)
    
    async def _check_scenario_conditions(self):
        """Check and apply configured mock scenarios."""
        self.call_count += 1
        
        # Reset call count every hour
        if datetime.utcnow() - self.last_reset > timedelta(hours=1):
            self.call_count = 0
            self.last_reset = datetime.utcnow()
        
        # Apply scenario-based behaviors
        if self.config.scenario == MockScenario.RATE_LIMITED:
            if self.call_count > self.config.rate_limit_threshold:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded",
                    headers={"Retry-After": "3600"}
                )
        
        elif self.config.scenario == MockScenario.NETWORK_ERROR:
            if random.random() < self.config.failure_rate:
                raise httpx.NetworkError("Simulated network error")
        
        elif self.config.scenario == MockScenario.INSUFFICIENT_PERMISSIONS:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to access this resource"
            )
    
    def _generate_mock_ad_accounts(self) -> List[Dict[str, Any]]:
        """Generate realistic mock ad account data."""
        accounts = []
        
        account_templates = [
            {"name": "Presidential Campaign 2024", "currency": "USD", "timezone": "America/New_York"},
            {"name": "Congressional District 5", "currency": "USD", "timezone": "America/Chicago"}, 
            {"name": "State Senate Campaign", "currency": "USD", "timezone": "America/Los_Angeles"},
            {"name": "Mayor Election Fund", "currency": "USD", "timezone": "America/Denver"},
            {"name": "Advocacy Action Fund", "currency": "USD", "timezone": "America/New_York"},
            {"name": "Progressive PAC", "currency": "USD", "timezone": "America/Chicago"}
        ]
        
        for i, template in enumerate(account_templates):
            account_id = f"act_{1000000000 + i}"
            accounts.append({
                "id": account_id,
                "account_id": str(1000000000 + i),
                "name": template["name"],
                "account_status": 1,  # Active
                "currency": template["currency"],
                "timezone_name": template["timezone"],
                "amount_spent": str(round(random.uniform(5000, 150000), 2)),
                "balance": str(round(random.uniform(10000, 50000), 2)),
                "spend_cap": str(round(random.uniform(200000, 500000), 2)),
                "created_time": (datetime.utcnow() - timedelta(days=random.randint(30, 365))).isoformat(),
                "business": {
                    "id": f"business_{i}",
                    "name": f"{template['name']} Organization"
                }
            })
        
        return accounts
    
    def _generate_mock_campaigns(self) -> List[Dict[str, Any]]:
        """Generate realistic mock campaign data."""
        campaigns = []
        
        campaign_objectives = ["REACH", "TRAFFIC", "CONVERSIONS", "BRAND_AWARENESS", "VIDEO_VIEWS"]
        campaign_statuses = ["ACTIVE", "PAUSED", "ARCHIVED"]
        
        for account in self._mock_ad_accounts:
            account_id = account["id"]
            num_campaigns = random.randint(3, 8)
            
            for i in range(num_campaigns):
                campaign_id = f"campaign_{account_id}_{i}"
                start_date = datetime.utcnow() - timedelta(days=random.randint(7, 90))
                
                campaigns.append({
                    "id": campaign_id,
                    "account_id": account_id,
                    "name": f"{account['name']} - {random.choice(['Awareness', 'Engagement', 'Conversion', 'Retargeting'])} Campaign {i+1}",
                    "objective": random.choice(campaign_objectives),
                    "status": random.choice(campaign_statuses),
                    "created_time": start_date.isoformat(),
                    "start_time": start_date.isoformat(),
                    "stop_time": (start_date + timedelta(days=random.randint(14, 60))).isoformat() if random.random() > 0.3 else None,
                    "budget_remaining": str(round(random.uniform(1000, 10000), 2)),
                    "daily_budget": str(round(random.uniform(100, 1000), 2)),
                    "lifetime_budget": str(round(random.uniform(5000, 50000), 2)) if random.random() > 0.5 else None,
                    "bid_strategy": random.choice(["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP"]),
                    "buying_type": "AUCTION",
                    "can_use_spend_cap": True
                })
        
        return campaigns
    
    def _generate_mock_insights(self) -> List[Dict[str, Any]]:
        """Generate realistic mock insights data."""
        insights = []
        
        for campaign in self._mock_campaigns[:10]:  # Generate insights for first 10 campaigns
            insights.extend(self._generate_campaign_insights(campaign["id"]))
        
        return insights
    
    def _generate_campaign_insights(
        self, 
        campaign_id: str, 
        start_date: str = "2024-08-01", 
        end_date: str = "2024-08-07"
    ) -> List[Dict[str, Any]]:
        """Generate insights for specific campaign and date range."""
        insights = []
        
        # Parse dates
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        # Generate daily insights
        current_date = start
        while current_date <= end:
            daily_spend = round(random.uniform(50, 500), 2)
            daily_impressions = random.randint(1000, 15000)
            daily_clicks = random.randint(20, 300)
            daily_reach = random.randint(800, int(daily_impressions * 0.8))
            
            insights.append({
                "campaign_id": campaign_id,
                "date_start": current_date.strftime("%Y-%m-%d"),
                "date_stop": current_date.strftime("%Y-%m-%d"),
                "spend": str(daily_spend),
                "impressions": str(daily_impressions),
                "clicks": str(daily_clicks),
                "reach": str(daily_reach),
                "frequency": str(round(daily_impressions / max(daily_reach, 1), 2)),
                "ctr": str(round((daily_clicks / max(daily_impressions, 1)) * 100, 3)),
                "cpm": str(round((daily_spend / max(daily_impressions, 1)) * 1000, 2)),
                "cpp": str(round(daily_spend / max(daily_reach, 1), 2)),
                "actions": [
                    {
                        "action_type": "link_click",
                        "value": str(random.randint(10, 100))
                    },
                    {
                        "action_type": "post_engagement", 
                        "value": str(random.randint(5, 50))
                    }
                ],
                "video_p25_watched_actions": [
                    {
                        "action_type": "video_view",
                        "value": str(random.randint(100, 500))
                    }
                ] if random.random() > 0.5 else []
            })
            
            current_date += timedelta(days=1)
        
        return insights


# Configuration presets for different testing scenarios
MOCK_SCENARIOS = {
    "success": MockConfig(
        scenario=MockScenario.SUCCESS,
        response_delay=0.3,
        failure_rate=0.0
    ),
    "slow_api": MockConfig(
        scenario=MockScenario.SUCCESS,
        response_delay=2.0,
        failure_rate=0.0
    ),
    "rate_limited": MockConfig(
        scenario=MockScenario.RATE_LIMITED,
        response_delay=0.3,
        rate_limit_threshold=50
    ),
    "unreliable": MockConfig(
        scenario=MockScenario.NETWORK_ERROR,
        response_delay=1.0,
        failure_rate=0.2
    ),
    "no_permissions": MockConfig(
        scenario=MockScenario.INSUFFICIENT_PERMISSIONS,
        response_delay=0.5
    ),
    "empty_account": MockConfig(
        scenario=MockScenario.NO_AD_ACCOUNTS,
        response_delay=0.3
    )
}


def get_mock_service(scenario: str = "success") -> MockMetaService:
    """
    Factory function to get configured mock service.
    
    Args:
        scenario: Name of mock scenario to use
        
    Returns:
        Configured MockMetaService instance
    """
    config = MOCK_SCENARIOS.get(scenario, MOCK_SCENARIOS["success"])
    return MockMetaService(config)


# Example usage and testing
if __name__ == "__main__":
    async def test_mock_service():
        """Test the mock service functionality."""
        
        # Test different scenarios
        scenarios_to_test = ["success", "rate_limited", "no_permissions"]
        
        for scenario_name in scenarios_to_test:
            print(f"\n=== Testing {scenario_name} scenario ===")
            
            mock_service = get_mock_service(scenario_name)
            test_user_id = f"test_user_{scenario_name}"
            
            try:
                # Test OAuth flow
                oauth_result = await mock_service.handle_oauth_callback(
                    code="test_code_123",
                    redirect_uri="http://localhost:8000/callback", 
                    user_id=test_user_id
                )
                print(f"OAuth success: {oauth_result['access_token'][:20]}...")
                
                # Test ad accounts
                accounts = await mock_service.get_ad_accounts(test_user_id)
                print(f"Ad accounts: {len(accounts['data'])} found")
                
                if accounts["data"]:
                    # Test campaigns
                    first_account = accounts["data"][0]["id"]
                    campaigns = await mock_service.get_campaigns(first_account, test_user_id)
                    print(f"Campaigns: {len(campaigns['data'])} found")
                    
                    # Test insights
                    if campaigns["data"]:
                        first_campaign = campaigns["data"][0]["id"] 
                        insights = await mock_service.get_campaign_insights(
                            first_campaign, 
                            test_user_id
                        )
                        print(f"Insights: {len(insights['data'])} records found")
                
            except Exception as e:
                print(f"Expected error for {scenario_name}: {e}")
    
    # Run test
    import asyncio
    asyncio.run(test_mock_service())