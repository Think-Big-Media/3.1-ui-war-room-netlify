"""
Redis client configuration and utilities.
"""

import logging
from typing import Optional
from redis import Redis
from core.config import settings

logger = logging.getLogger(__name__)

# Global Redis client instance
redis_client: Optional[Redis] = None


def get_redis_client() -> Optional[Redis]:
    """
    Get or create Redis client instance.
    
    Returns:
        Redis client instance or None if not available
    """
    global redis_client
    
    if redis_client is None:
        try:
            redis_client = Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            # Test connection
            redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed: {str(e)}")
            redis_client = None
    
    return redis_client


def close_redis():
    """Close Redis connection."""
    global redis_client
    if redis_client:
        redis_client.close()
        redis_client = None
        logger.info("Redis connection closed")


# Initialize on module import
redis_client = get_redis_client()