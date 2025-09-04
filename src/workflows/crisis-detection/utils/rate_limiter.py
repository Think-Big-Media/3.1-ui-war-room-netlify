"""
Rate Limiter for API calls
"""

import asyncio
import time
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter for API calls with token bucket algorithm
    """
    
    def __init__(
        self,
        max_requests: int,
        time_window: int,
        burst_allowance: Optional[int] = None
    ):
        """
        Initialize rate limiter
        
        Args:
            max_requests: Maximum requests allowed in time window
            time_window: Time window in seconds
            burst_allowance: Allow burst requests (default: max_requests)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.burst_allowance = burst_allowance or max_requests
        
        # Token bucket state
        self.tokens = max_requests
        self.last_update = time.time()
        
        # Request tracking
        self.request_history: Dict[float, int] = {}
        
        # Async lock for thread safety
        self._lock = asyncio.Lock()
    
    async def acquire(self, tokens: int = 1) -> bool:
        """
        Acquire tokens from the rate limiter
        
        Args:
            tokens: Number of tokens to acquire
            
        Returns:
            True if tokens were acquired, False if rate limited
        """
        async with self._lock:
            now = time.time()
            
            # Refill tokens based on elapsed time
            elapsed = now - self.last_update
            tokens_to_add = elapsed * (self.max_requests / self.time_window)
            self.tokens = min(self.max_requests, self.tokens + tokens_to_add)
            self.last_update = now
            
            # Check if we have enough tokens
            if self.tokens >= tokens:
                self.tokens -= tokens
                self._record_request(now)
                logger.debug(f"Rate limiter: {tokens} tokens acquired, {self.tokens:.2f} remaining")
                return True
            else:
                # Calculate wait time
                wait_time = self._calculate_wait_time(tokens)
                logger.warning(f"Rate limited: need {tokens} tokens, have {self.tokens:.2f}. Wait {wait_time:.2f}s")
                
                if wait_time > 0:
                    await asyncio.sleep(wait_time)
                    return await self.acquire(tokens)
                
                return False
    
    async def wait_for_capacity(self, tokens: int = 1) -> None:
        """
        Wait until capacity is available for the requested tokens
        
        Args:
            tokens: Number of tokens needed
        """
        while not await self.acquire(tokens):
            await asyncio.sleep(0.1)
    
    def _calculate_wait_time(self, tokens_needed: int) -> float:
        """Calculate time to wait for tokens to be available"""
        tokens_deficit = tokens_needed - self.tokens
        if tokens_deficit <= 0:
            return 0
        
        # Time to generate needed tokens
        generation_rate = self.max_requests / self.time_window
        return tokens_deficit / generation_rate
    
    def _record_request(self, timestamp: float) -> None:
        """Record a request for monitoring purposes"""
        # Clean old entries (older than time window)
        cutoff = timestamp - self.time_window
        self.request_history = {
            ts: count for ts, count in self.request_history.items()
            if ts > cutoff
        }
        
        # Record current request
        self.request_history[timestamp] = self.request_history.get(timestamp, 0) + 1
    
    def get_current_usage(self) -> Dict[str, float]:
        """Get current rate limiter usage statistics"""
        now = time.time()
        cutoff = now - self.time_window
        
        # Count recent requests
        recent_requests = sum(
            count for ts, count in self.request_history.items()
            if ts > cutoff
        )
        
        usage_percentage = (recent_requests / self.max_requests) * 100
        
        return {
            "current_tokens": self.tokens,
            "max_requests": self.max_requests,
            "time_window": self.time_window,
            "recent_requests": recent_requests,
            "usage_percentage": usage_percentage,
            "requests_remaining": max(0, self.max_requests - recent_requests)
        }
    
    def reset(self) -> None:
        """Reset the rate limiter state"""
        self.tokens = self.max_requests
        self.last_update = time.time()
        self.request_history.clear()
        logger.info("Rate limiter reset")


class MultiServiceRateLimiter:
    """
    Manages rate limiting for multiple services
    """
    
    def __init__(self):
        self.limiters: Dict[str, RateLimiter] = {}
    
    def add_service(
        self,
        service_name: str,
        max_requests: int,
        time_window: int,
        burst_allowance: Optional[int] = None
    ) -> None:
        """Add a rate limiter for a service"""
        self.limiters[service_name] = RateLimiter(
            max_requests=max_requests,
            time_window=time_window,
            burst_allowance=burst_allowance
        )
        logger.info(f"Added rate limiter for {service_name}: {max_requests} req/{time_window}s")
    
    async def acquire(self, service_name: str, tokens: int = 1) -> bool:
        """Acquire tokens for a specific service"""
        if service_name not in self.limiters:
            logger.warning(f"No rate limiter configured for service: {service_name}")
            return True
        
        return await self.limiters[service_name].acquire(tokens)
    
    async def wait_for_capacity(self, service_name: str, tokens: int = 1) -> None:
        """Wait for capacity for a specific service"""
        if service_name not in self.limiters:
            return
        
        await self.limiters[service_name].wait_for_capacity(tokens)
    
    def get_service_usage(self, service_name: str) -> Optional[Dict[str, float]]:
        """Get usage statistics for a service"""
        if service_name not in self.limiters:
            return None
        
        return self.limiters[service_name].get_current_usage()
    
    def get_all_usage(self) -> Dict[str, Dict[str, float]]:
        """Get usage statistics for all services"""
        return {
            service: limiter.get_current_usage()
            for service, limiter in self.limiters.items()
        }


# Default rate limiter configurations for common services
DEFAULT_RATE_LIMITS = {
    "mentionlytics": {"max_requests": 100, "time_window": 3600},  # 100/hour
    "openai": {"max_requests": 60, "time_window": 60},           # 60/minute  
    "twilio": {"max_requests": 1000, "time_window": 3600},       # 1000/hour
    "sendgrid": {"max_requests": 600, "time_window": 60},        # 600/minute
    "slack": {"max_requests": 50, "time_window": 60}             # 50/minute
}


def create_default_rate_limiter() -> MultiServiceRateLimiter:
    """Create a multi-service rate limiter with default configurations"""
    limiter = MultiServiceRateLimiter()
    
    for service, config in DEFAULT_RATE_LIMITS.items():
        limiter.add_service(
            service_name=service,
            max_requests=config["max_requests"],
            time_window=config["time_window"]
        )
    
    return limiter