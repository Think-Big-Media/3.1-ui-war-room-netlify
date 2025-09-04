"""CodeRabbit API Client

Comprehensive API client for CodeRabbit integration:
- Review triggering and management
- Feedback retrieval and parsing
- Configuration management
- Error handling and retry logic
- Rate limiting compliance
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
import backoff
import time

logger = logging.getLogger(__name__)

class ReviewType(Enum):
    """CodeRabbit review types"""
    QUICK = "quick"
    COMPREHENSIVE = "comprehensive"
    SECURITY_FOCUSED = "security_focused"
    PERFORMANCE_FOCUSED = "performance_focused"

class ReviewStatus(Enum):
    """Review status values"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class ReviewRequest:
    """Review request configuration"""
    repository_url: str
    commit_sha: str
    review_type: ReviewType = ReviewType.COMPREHENSIVE
    include_security: bool = True
    include_performance: bool = True
    include_maintainability: bool = True
    include_style: bool = False
    file_patterns: Optional[List[str]] = None
    exclude_patterns: Optional[List[str]] = None
    priority: str = "normal"

@dataclass
class ReviewResult:
    """Review result data structure"""
    review_id: str
    status: ReviewStatus
    started_at: datetime
    completed_at: Optional[datetime]
    repository_url: str
    commit_sha: str
    summary: Dict[str, Any]
    feedback: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    errors: List[str]

class CodeRabbitAPIClient:
    """CodeRabbit API client with comprehensive functionality"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.coderabbit.ai/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = None
        
        # Rate limiting
        self.rate_limit_remaining = 1000
        self.rate_limit_reset = datetime.utcnow() + timedelta(hours=1)
        self.request_count = 0
        
        # Configuration
        self.default_timeout = 30
        self.max_retries = 3
        self.retry_delay = 1
        
        # Cache
        self.review_cache = {}
        self.feedback_cache = {}
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.default_timeout),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "WarRoom-CodeRabbit-Integration/1.0"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    @backoff.on_exception(
        backoff.expo,
        (aiohttp.ClientError, asyncio.TimeoutError),
        max_tries=3,
        max_time=60
    )
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, str]] = None
    ) -> Tuple[int, Dict[str, Any]]:
        """Make HTTP request with error handling and retries"""
        if not self.session:
            raise RuntimeError("Client not initialized - use async context manager")
        
        # Check rate limiting
        await self._check_rate_limit()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, params=params) as response:
                    return await self._handle_response(response)
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, params=params) as response:
                    return await self._handle_response(response)
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, params=params) as response:
                    return await self._handle_response(response)
            elif method.upper() == "DELETE":
                async with self.session.delete(url, params=params) as response:
                    return await self._handle_response(response)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
        
        except Exception as e:
            logger.error(f"API request failed: {method} {url} - {e}")
            raise
    
    async def _handle_response(self, response: aiohttp.ClientResponse) -> Tuple[int, Dict[str, Any]]:
        """Handle API response and update rate limiting info"""
        self.request_count += 1
        
        # Update rate limiting info
        if "X-RateLimit-Remaining" in response.headers:
            self.rate_limit_remaining = int(response.headers["X-RateLimit-Remaining"])
        
        if "X-RateLimit-Reset" in response.headers:
            reset_timestamp = int(response.headers["X-RateLimit-Reset"])
            self.rate_limit_reset = datetime.fromtimestamp(reset_timestamp)
        
        # Handle response
        if response.content_type == "application/json":
            data = await response.json()
        else:
            data = {"text": await response.text()}
        
        if 200 <= response.status < 300:
            return response.status, data
        else:
            error_msg = data.get("error", data.get("message", "Unknown error"))
            logger.error(f"API error {response.status}: {error_msg}")
            raise aiohttp.ClientResponseError(
                request_info=response.request_info,
                history=response.history,
                status=response.status,
                message=error_msg
            )
    
    async def _check_rate_limit(self):
        """Check and handle rate limiting"""
        if self.rate_limit_remaining <= 10:  # Conservative threshold
            wait_time = (self.rate_limit_reset - datetime.utcnow()).total_seconds()
            if wait_time > 0:
                logger.warning(f"Rate limit low, waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
    
    async def trigger_review(self, request: ReviewRequest) -> ReviewResult:
        """Trigger a new CodeRabbit review"""
        try:
            payload = {
                "repository_url": request.repository_url,
                "commit_sha": request.commit_sha,
                "review_type": request.review_type.value,
                "configuration": {
                    "include_security": request.include_security,
                    "include_performance": request.include_performance,
                    "include_maintainability": request.include_maintainability,
                    "include_style": request.include_style
                },
                "priority": request.priority
            }
            
            # Add file patterns if specified
            if request.file_patterns:
                payload["file_patterns"] = request.file_patterns
            if request.exclude_patterns:
                payload["exclude_patterns"] = request.exclude_patterns
            
            status, response_data = await self._make_request("POST", "/reviews", payload)
            
            # Parse response into ReviewResult
            review_result = ReviewResult(
                review_id=response_data.get("review_id"),
                status=ReviewStatus(response_data.get("status", "pending")),
                started_at=datetime.fromisoformat(response_data.get("started_at")),
                completed_at=None,
                repository_url=request.repository_url,
                commit_sha=request.commit_sha,
                summary=response_data.get("summary", {}),
                feedback=[],
                metrics=response_data.get("metrics", {}),
                errors=response_data.get("errors", [])
            )
            
            # Cache the review
            self.review_cache[review_result.review_id] = review_result
            
            logger.info(f"Triggered CodeRabbit review: {review_result.review_id}")
            return review_result
        
        except Exception as e:
            logger.error(f"Failed to trigger review: {e}")
            raise
    
    async def get_review_status(self, review_id: str) -> ReviewResult:
        """Get current status of a review"""
        try:
            status, response_data = await self._make_request("GET", f"/reviews/{review_id}")
            
            # Update cached review result
            review_result = ReviewResult(
                review_id=review_id,
                status=ReviewStatus(response_data.get("status")),
                started_at=datetime.fromisoformat(response_data.get("started_at")),
                completed_at=datetime.fromisoformat(response_data.get("completed_at")) if response_data.get("completed_at") else None,
                repository_url=response_data.get("repository_url"),
                commit_sha=response_data.get("commit_sha"),
                summary=response_data.get("summary", {}),
                feedback=response_data.get("feedback", []),
                metrics=response_data.get("metrics", {}),
                errors=response_data.get("errors", [])
            )
            
            self.review_cache[review_id] = review_result
            return review_result
        
        except Exception as e:
            logger.error(f"Failed to get review status: {e}")
            raise
    
    async def get_review_feedback(self, review_id: str) -> List[Dict[str, Any]]:
        """Get detailed feedback from a completed review"""
        try:
            # Check cache first
            if review_id in self.feedback_cache:
                cached_feedback = self.feedback_cache[review_id]
                if datetime.utcnow() - cached_feedback["timestamp"] < timedelta(minutes=10):
                    return cached_feedback["feedback"]
            
            status, response_data = await self._make_request("GET", f"/reviews/{review_id}/feedback")
            
            feedback = response_data.get("feedback", [])
            
            # Enrich feedback with additional metadata
            enriched_feedback = []
            for item in feedback:
                enriched_item = {
                    **item,
                    "retrieved_at": datetime.utcnow().isoformat(),
                    "review_id": review_id
                }
                enriched_feedback.append(enriched_item)
            
            # Cache feedback
            self.feedback_cache[review_id] = {
                "feedback": enriched_feedback,
                "timestamp": datetime.utcnow()
            }
            
            return enriched_feedback
        
        except Exception as e:
            logger.error(f"Failed to get review feedback: {e}")
            raise
    
    async def wait_for_review_completion(
        self, 
        review_id: str, 
        timeout: int = 600,
        poll_interval: int = 10
    ) -> ReviewResult:
        """Wait for review to complete with polling"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                review_result = await self.get_review_status(review_id)
                
                if review_result.status == ReviewStatus.COMPLETED:
                    # Get feedback for completed review
                    feedback = await self.get_review_feedback(review_id)
                    review_result.feedback = feedback
                    return review_result
                
                elif review_result.status in [ReviewStatus.FAILED, ReviewStatus.CANCELLED]:
                    logger.error(f"Review {review_id} failed with status: {review_result.status}")
                    return review_result
                
                # Wait before next poll
                await asyncio.sleep(poll_interval)
                
            except Exception as e:
                logger.warning(f"Polling error for review {review_id}: {e}")
                await asyncio.sleep(poll_interval)
        
        raise TimeoutError(f"Review {review_id} did not complete within {timeout} seconds")
    
    async def cancel_review(self, review_id: str) -> bool:
        """Cancel an in-progress review"""
        try:
            status, response_data = await self._make_request("DELETE", f"/reviews/{review_id}")
            
            if status == 200:
                logger.info(f"Cancelled review: {review_id}")
                
                # Update cache
                if review_id in self.review_cache:
                    self.review_cache[review_id].status = ReviewStatus.CANCELLED
                
                return True
            return False
        
        except Exception as e:
            logger.error(f"Failed to cancel review: {e}")
            return False
    
    async def list_reviews(
        self, 
        repository_url: Optional[str] = None,
        status: Optional[ReviewStatus] = None,
        limit: int = 50
    ) -> List[ReviewResult]:
        """List reviews with optional filtering"""
        try:
            params = {"limit": str(limit)}
            if repository_url:
                params["repository_url"] = repository_url
            if status:
                params["status"] = status.value
            
            status_code, response_data = await self._make_request("GET", "/reviews", params=params)
            
            reviews = []
            for review_data in response_data.get("reviews", []):
                review_result = ReviewResult(
                    review_id=review_data.get("review_id"),
                    status=ReviewStatus(review_data.get("status")),
                    started_at=datetime.fromisoformat(review_data.get("started_at")),
                    completed_at=datetime.fromisoformat(review_data.get("completed_at")) if review_data.get("completed_at") else None,
                    repository_url=review_data.get("repository_url"),
                    commit_sha=review_data.get("commit_sha"),
                    summary=review_data.get("summary", {}),
                    feedback=[],  # Feedback not included in list view
                    metrics=review_data.get("metrics", {}),
                    errors=review_data.get("errors", [])
                )
                reviews.append(review_result)
            
            return reviews
        
        except Exception as e:
            logger.error(f"Failed to list reviews: {e}")
            raise
    
    async def get_repository_insights(self, repository_url: str) -> Dict[str, Any]:
        """Get repository-level insights and statistics"""
        try:
            params = {"repository_url": repository_url}
            status, response_data = await self._make_request("GET", "/insights", params=params)
            
            insights = {
                "repository_url": repository_url,
                "total_reviews": response_data.get("total_reviews", 0),
                "quality_metrics": response_data.get("quality_metrics", {}),
                "security_metrics": response_data.get("security_metrics", {}),
                "performance_metrics": response_data.get("performance_metrics", {}),
                "trend_data": response_data.get("trend_data", {}),
                "top_issues": response_data.get("top_issues", []),
                "recommendations": response_data.get("recommendations", []),
                "retrieved_at": datetime.utcnow().isoformat()
            }
            
            return insights
        
        except Exception as e:
            logger.error(f"Failed to get repository insights: {e}")
            raise
    
    async def submit_feedback(self, review_id: str, feedback: Dict[str, Any]) -> bool:
        """Submit feedback on CodeRabbit's review"""
        try:
            payload = {
                "review_id": review_id,
                "feedback": feedback,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            status, response_data = await self._make_request("POST", f"/reviews/{review_id}/feedback", payload)
            
            if status in [200, 201]:
                logger.info(f"Submitted feedback for review: {review_id}")
                return True
            return False
        
        except Exception as e:
            logger.error(f"Failed to submit feedback: {e}")
            return False
    
    def get_client_stats(self) -> Dict[str, Any]:
        """Get client usage statistics"""
        return {
            "total_requests": self.request_count,
            "rate_limit_remaining": self.rate_limit_remaining,
            "rate_limit_reset": self.rate_limit_reset.isoformat(),
            "cached_reviews": len(self.review_cache),
            "cached_feedback": len(self.feedback_cache),
            "base_url": self.base_url,
            "last_request_time": datetime.utcnow().isoformat()
        }
    
    def clear_cache(self):
        """Clear all cached data"""
        self.review_cache.clear()
        self.feedback_cache.clear()
        logger.info("Cleared API client cache")

# Utility functions for common operations
async def quick_review(api_key: str, repository_url: str, commit_sha: str) -> ReviewResult:
    """Quick helper function for simple reviews"""
    async with CodeRabbitAPIClient(api_key) as client:
        request = ReviewRequest(
            repository_url=repository_url,
            commit_sha=commit_sha,
            review_type=ReviewType.QUICK
        )
        
        review_result = await client.trigger_review(request)
        completed_review = await client.wait_for_review_completion(review_result.review_id)
        return completed_review

async def comprehensive_security_review(api_key: str, repository_url: str, commit_sha: str) -> ReviewResult:
    """Security-focused comprehensive review"""
    async with CodeRabbitAPIClient(api_key) as client:
        request = ReviewRequest(
            repository_url=repository_url,
            commit_sha=commit_sha,
            review_type=ReviewType.SECURITY_FOCUSED,
            include_security=True,
            include_performance=True,
            include_maintainability=True,
            priority="high"
        )
        
        review_result = await client.trigger_review(request)
        completed_review = await client.wait_for_review_completion(review_result.review_id)
        return completed_review