"""
Mentionlytics API Service
Handles integration with Mentionlytics for social media monitoring and mentions tracking.
"""

import os
import logging
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime, timedelta
from core.config import settings

logger = logging.getLogger(__name__)


class MentionlyticsService:
    """
    Service for interacting with Mentionlytics API.
    
    Features:
    - Authentication token management
    - Mention retrieval
    - Sentiment analysis
    - Social media monitoring
    """
    
    def __init__(self):
        self.base_url = "https://app.mentionlytics.com/api"
        self.email = settings.MENTIONLYTICS_EMAIL
        self.password = settings.MENTIONLYTICS_PASSWORD
        self.token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        
    async def _get_auth_token(self) -> str:
        """
        Get authentication token from Mentionlytics API.
        
        Returns:
            Authentication token
        """
        try:
            # Check if we have a valid token
            if self.token and self.token_expiry and datetime.utcnow() < self.token_expiry:
                return self.token
                
            # Get new token
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/token",
                    params={
                        "email": self.email,
                        "password": self.password
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                self.token = data.get("token")
                # Token expires in 24 hours, we'll refresh after 23 hours
                self.token_expiry = datetime.utcnow() + timedelta(hours=23)
                
                logger.info("Successfully authenticated with Mentionlytics API")
                return self.token
                
        except Exception as e:
            logger.error(f"Failed to authenticate with Mentionlytics: {str(e)}")
            raise
            
    async def get_mentions(
        self,
        project_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve mentions for a specific project.
        
        Args:
            project_id: Mentionlytics project ID
            start_date: Start date for mentions
            end_date: End date for mentions
            limit: Maximum number of mentions to retrieve
            offset: Pagination offset
            
        Returns:
            List of mentions
        """
        try:
            token = await self._get_auth_token()
            
            params = {
                "project_id": project_id,
                "limit": limit,
                "offset": offset
            }
            
            if start_date:
                params["start_date"] = start_date.strftime("%Y-%m-%d")
            if end_date:
                params["end_date"] = end_date.strftime("%Y-%m-%d")
                
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/mentions",
                    headers={"Authorization": f"Bearer {token}"},
                    params=params
                )
                response.raise_for_status()
                
                data = response.json()
                mentions = data.get("mentions", [])
                
                logger.info(f"Retrieved {len(mentions)} mentions for project {project_id}")
                return mentions
                
        except Exception as e:
            logger.error(f"Failed to get mentions: {str(e)}")
            return []
            
    async def get_sentiment_analysis(
        self,
        project_id: str,
        period: str = "7days"
    ) -> Dict[str, Any]:
        """
        Get sentiment analysis for a project.
        
        Args:
            project_id: Mentionlytics project ID
            period: Analysis period (e.g., "7days", "30days", "3months")
            
        Returns:
            Sentiment analysis data
        """
        try:
            token = await self._get_auth_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/sentiment",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "project_id": project_id,
                        "period": period
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"Retrieved sentiment analysis for project {project_id}")
                return data
                
        except Exception as e:
            logger.error(f"Failed to get sentiment analysis: {str(e)}")
            return {}
            
    async def get_top_influencers(
        self,
        project_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get top influencers for a project.
        
        Args:
            project_id: Mentionlytics project ID
            limit: Number of top influencers to retrieve
            
        Returns:
            List of top influencers
        """
        try:
            token = await self._get_auth_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/influencers",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "project_id": project_id,
                        "limit": limit
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                influencers = data.get("influencers", [])
                
                logger.info(f"Retrieved {len(influencers)} top influencers for project {project_id}")
                return influencers
                
        except Exception as e:
            logger.error(f"Failed to get top influencers: {str(e)}")
            return []
            
    async def get_trending_topics(
        self,
        project_id: str,
        period: str = "24hours"
    ) -> List[Dict[str, Any]]:
        """
        Get trending topics for a project.
        
        Args:
            project_id: Mentionlytics project ID
            period: Analysis period
            
        Returns:
            List of trending topics
        """
        try:
            token = await self._get_auth_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/trending",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "project_id": project_id,
                        "period": period
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                topics = data.get("topics", [])
                
                logger.info(f"Retrieved {len(topics)} trending topics for project {project_id}")
                return topics
                
        except Exception as e:
            logger.error(f"Failed to get trending topics: {str(e)}")
            return []
            
    async def get_mention_statistics(
        self,
        project_id: str,
        group_by: str = "day"
    ) -> Dict[str, Any]:
        """
        Get mention statistics grouped by time period.
        
        Args:
            project_id: Mentionlytics project ID
            group_by: Grouping period ("hour", "day", "week", "month")
            
        Returns:
            Mention statistics
        """
        try:
            token = await self._get_auth_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/statistics",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "project_id": project_id,
                        "group_by": group_by
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"Retrieved mention statistics for project {project_id}")
                return data
                
        except Exception as e:
            logger.error(f"Failed to get mention statistics: {str(e)}")
            return {}


# Global Mentionlytics service instance
mentionlytics_service = MentionlyticsService()


# Helper functions for easy access
async def fetch_mentions(
    project_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """Fetch mentions from Mentionlytics."""
    return await mentionlytics_service.get_mentions(project_id, start_date, end_date)


async def analyze_sentiment(project_id: str, period: str = "7days") -> Dict[str, Any]:
    """Get sentiment analysis from Mentionlytics."""
    return await mentionlytics_service.get_sentiment_analysis(project_id, period)


async def get_influencers(project_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get top influencers from Mentionlytics."""
    return await mentionlytics_service.get_top_influencers(project_id, limit)