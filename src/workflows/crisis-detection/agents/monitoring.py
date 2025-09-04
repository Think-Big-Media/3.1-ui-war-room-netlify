"""
Monitoring Agents - Connect to external monitoring services
"""

import asyncio
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
import hashlib
import hmac
from urllib.parse import urlencode

from langchain.tools import Tool
from pydantic import BaseModel, Field

from ..utils.rate_limiter import RateLimiter
from .crisis_detection import CrisisMention

logger = logging.getLogger(__name__)


class MentionlyticsConfig(BaseModel):
    """Configuration for Mentionlytics API"""
    api_key: str
    api_secret: str
    base_url: str = "https://api.mentionlytics.com/v1"
    webhook_secret: Optional[str] = None


class MentionlyticsAgent:
    """Agent for monitoring mentions via Mentionlytics API"""
    
    def __init__(self, config: MentionlyticsConfig):
        self.config = config
        self.rate_limiter = RateLimiter(
            max_requests=100,
            time_window=3600  # 100 requests per hour
        )
        self.session: Optional[aiohttp.ClientSession] = None
        self._last_fetch_time = datetime.now() - timedelta(hours=1)
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def scan(self) -> List[CrisisMention]:
        """Scan for new mentions from Mentionlytics"""
        try:
            await self.rate_limiter.acquire()
            
            # Fetch mentions since last scan
            mentions_data = await self._fetch_mentions(
                since=self._last_fetch_time,
                until=datetime.now()
            )
            
            # Convert to CrisisMention objects
            mentions = []
            for data in mentions_data:
                mention = self._parse_mention(data)
                if mention:
                    mentions.append(mention)
            
            # Update last fetch time
            self._last_fetch_time = datetime.now()
            
            logger.info(f"Fetched {len(mentions)} mentions from Mentionlytics")
            return mentions
            
        except Exception as e:
            logger.error(f"Error scanning Mentionlytics: {e}")
            return []
    
    async def _fetch_mentions(
        self, 
        since: datetime,
        until: datetime,
        keywords: Optional[List[str]] = None
    ) -> List[Dict]:
        """Fetch mentions from Mentionlytics API"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        # Build query parameters
        params = {
            'since': since.isoformat(),
            'until': until.isoformat(),
            'limit': 100,
            'sort': 'published_at:desc'
        }
        
        if keywords:
            params['keywords'] = ','.join(keywords)
        
        # Add authentication
        headers = self._get_auth_headers('GET', '/mentions', params)
        
        url = f"{self.config.base_url}/mentions"
        
        try:
            async with self.session.get(
                url,
                params=params,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                data = await response.json()
                
                return data.get('mentions', [])
                
        except aiohttp.ClientError as e:
            logger.error(f"Mentionlytics API error: {e}")
            return []
    
    def _get_auth_headers(self, method: str, path: str, params: Dict) -> Dict:
        """Generate authentication headers for Mentionlytics API"""
        # Create signature based on Mentionlytics auth requirements
        timestamp = str(int(datetime.now().timestamp()))
        
        # Build string to sign
        query_string = urlencode(sorted(params.items()))
        string_to_sign = f"{method}\n{path}\n{query_string}\n{timestamp}"
        
        # Generate HMAC signature
        signature = hmac.new(
            self.config.api_secret.encode(),
            string_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return {
            'X-Api-Key': self.config.api_key,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
            'Content-Type': 'application/json'
        }
    
    def _parse_mention(self, data: Dict) -> Optional[CrisisMention]:
        """Parse Mentionlytics data into CrisisMention"""
        try:
            # Extract keywords from content
            content = data.get('content', '')
            keywords = self._extract_keywords(content)
            
            return CrisisMention(
                mention_id=data.get('id', ''),
                content=content,
                source=data.get('source', 'unknown'),
                author=data.get('author', {}).get('name'),
                url=data.get('url'),
                sentiment_score=data.get('sentiment', {}).get('score', 0),
                reach_count=data.get('author', {}).get('reach', 0),
                engagement_count=data.get('engagement', {}).get('total', 0),
                published_at=datetime.fromisoformat(
                    data.get('published_at', datetime.now().isoformat())
                ),
                keywords=keywords
            )
        except Exception as e:
            logger.error(f"Error parsing mention: {e}")
            return None
    
    def _extract_keywords(self, content: str) -> List[str]:
        """Extract relevant keywords from content"""
        # Simple keyword extraction - in production use NLP
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        
        words = content.lower().split()
        keywords = [
            word.strip('.,!?;:"') 
            for word in words 
            if len(word) > 3 and word not in stop_words
        ]
        
        # Return top 10 most common keywords
        from collections import Counter
        word_counts = Counter(keywords)
        return [word for word, _ in word_counts.most_common(10)]
    
    async def get_mention_details(self, mention_id: str) -> Optional[Dict]:
        """Get detailed information about a specific mention"""
        try:
            await self.rate_limiter.acquire()
            
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            headers = self._get_auth_headers('GET', f'/mentions/{mention_id}', {})
            url = f"{self.config.base_url}/mentions/{mention_id}"
            
            async with self.session.get(
                url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                return await response.json()
                
        except Exception as e:
            logger.error(f"Error fetching mention details: {e}")
            return None
    
    async def setup_webhook(self, webhook_url: str) -> bool:
        """Setup webhook for real-time mention notifications"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            data = {
                'url': webhook_url,
                'events': ['mention.created', 'mention.updated'],
                'active': True
            }
            
            headers = self._get_auth_headers('POST', '/webhooks', {})
            url = f"{self.config.base_url}/webhooks"
            
            async with self.session.post(
                url,
                json=data,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                # Store webhook secret for verification
                if 'secret' in result:
                    self.config.webhook_secret = result['secret']
                
                logger.info(f"Webhook setup successful: {webhook_url}")
                return True
                
        except Exception as e:
            logger.error(f"Error setting up webhook: {e}")
            return False
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from Mentionlytics"""
        if not self.config.webhook_secret:
            logger.warning("No webhook secret configured")
            return False
        
        expected_signature = hmac.new(
            self.config.webhook_secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)


class NewsWhipAgent:
    """Placeholder for NewsWhip integration"""
    
    async def scan(self) -> List[CrisisMention]:
        """Scan NewsWhip for trending stories"""
        # Placeholder - implement when NewsWhip credentials available
        return []


class SocialMediaAgent:
    """Placeholder for direct social media monitoring"""
    
    async def scan(self) -> List[CrisisMention]:
        """Scan social media platforms"""
        # Placeholder - implement platform-specific monitoring
        return []