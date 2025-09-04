"""
Unit tests for cache service.
"""
import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
import fakeredis

from services.cache_service import CacheService


class TestCacheService:
    """Test suite for CacheService."""

    @pytest.fixture
    def cache_service(self):
        """Create cache service with fake Redis."""
        service = CacheService()
        # Override with fake Redis clients
        service.redis_clients = {
            0: fakeredis.FakeRedis(decode_responses=True),
            1: fakeredis.FakeRedis(decode_responses=True),
            2: fakeredis.FakeRedis(decode_responses=True),
            3: fakeredis.FakeRedis(decode_responses=True),
        }
        return service

    @pytest.mark.asyncio
    async def test_set_and_get_string(self, cache_service):
        """Test setting and getting string values."""
        key = "test:string"
        value = "Hello, World!"

        # Set value
        await cache_service.set(key, value, expire=60)

        # Get value
        result = await cache_service.get(key)
        assert result == value

    @pytest.mark.asyncio
    async def test_set_and_get_dict(self, cache_service):
        """Test setting and getting dictionary values."""
        key = "test:dict"
        value = {"name": "Test", "count": 42, "active": True}

        # Set value
        await cache_service.set(key, value, expire=60)

        # Get value
        result = await cache_service.get(key)
        assert result == value
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_set_and_get_list(self, cache_service):
        """Test setting and getting list values."""
        key = "test:list"
        value = [1, 2, 3, "four", {"five": 5}]

        # Set value
        await cache_service.set(key, value, expire=60)

        # Get value
        result = await cache_service.get(key)
        assert result == value
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_nonexistent_key(self, cache_service):
        """Test getting a nonexistent key returns None."""
        result = await cache_service.get("nonexistent:key")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_key(self, cache_service):
        """Test deleting a key."""
        key = "test:delete"
        value = "to be deleted"

        # Set value
        await cache_service.set(key, value)

        # Verify it exists
        assert await cache_service.get(key) == value

        # Delete it
        deleted = await cache_service.delete(key)
        assert deleted == 1

        # Verify it's gone
        assert await cache_service.get(key) is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_key(self, cache_service):
        """Test deleting a nonexistent key returns 0."""
        deleted = await cache_service.delete("nonexistent:key")
        assert deleted == 0

    @pytest.mark.asyncio
    async def test_exists(self, cache_service):
        """Test checking if key exists."""
        key = "test:exists"
        value = "exists"

        # Check nonexistent key
        assert not await cache_service.exists(key)

        # Set value
        await cache_service.set(key, value)

        # Check existing key
        assert await cache_service.exists(key)

    @pytest.mark.asyncio
    async def test_expire(self, cache_service):
        """Test setting expiration on a key."""
        key = "test:expire"
        value = "will expire"

        # Set value without expiration
        await cache_service.set(key, value)

        # Set expiration
        result = await cache_service.expire(key, 10)
        assert result is True

        # Try to expire nonexistent key
        result = await cache_service.expire("nonexistent", 10)
        assert result is False

    @pytest.mark.asyncio
    async def test_increment(self, cache_service):
        """Test incrementing a counter."""
        key = "test:counter"

        # First increment creates the key
        result = await cache_service.increment(key)
        assert result == 1

        # Subsequent increments
        result = await cache_service.increment(key)
        assert result == 2

        result = await cache_service.increment(key, amount=5)
        assert result == 7

    @pytest.mark.asyncio
    async def test_decrement(self, cache_service):
        """Test decrementing a counter."""
        key = "test:decrement"

        # Set initial value
        await cache_service.set(key, "10")

        # Decrement
        result = await cache_service.decrement(key)
        assert result == 9

        result = await cache_service.decrement(key, amount=3)
        assert result == 6

    @pytest.mark.asyncio
    async def test_lpush_and_lrange(self, cache_service):
        """Test list operations."""
        key = "test:list:ops"

        # Push items
        await cache_service.lpush(key, "third")
        await cache_service.lpush(key, "second")
        await cache_service.lpush(key, "first")

        # Get full list
        result = await cache_service.lrange(key, 0, -1)
        assert result == ["first", "second", "third"]

        # Get partial list
        result = await cache_service.lrange(key, 0, 1)
        assert result == ["first", "second"]

    @pytest.mark.asyncio
    async def test_sadd_and_smembers(self, cache_service):
        """Test set operations."""
        key = "test:set:ops"

        # Add members
        await cache_service.sadd(key, "apple")
        await cache_service.sadd(key, "banana")
        await cache_service.sadd(key, "apple")  # Duplicate

        # Get members
        result = await cache_service.smembers(key)
        assert len(result) == 2
        assert "apple" in result
        assert "banana" in result

    @pytest.mark.asyncio
    async def test_clear_pattern(self, cache_service):
        """Test clearing keys by pattern."""
        # Set multiple keys
        await cache_service.set("test:clear:1", "value1")
        await cache_service.set("test:clear:2", "value2")
        await cache_service.set("test:keep:1", "keeper")

        # Clear by pattern
        deleted = await cache_service.clear_pattern("test:clear:*")
        assert deleted == 2

        # Verify cleared
        assert await cache_service.get("test:clear:1") is None
        assert await cache_service.get("test:clear:2") is None

        # Verify kept
        assert await cache_service.get("test:keep:1") == "keeper"

    @pytest.mark.asyncio
    async def test_get_client_for_db(self, cache_service):
        """Test getting Redis client for specific database."""
        # Default database
        client = cache_service.get_client()
        assert client is not None

        # Specific databases
        for db in range(4):
            client = cache_service.get_client(db=db)
            assert client is not None

    @pytest.mark.asyncio
    async def test_json_serialization_edge_cases(self, cache_service):
        """Test JSON serialization with edge cases."""
        # DateTime objects
        key = "test:datetime"
        now = datetime.utcnow()
        value = {"timestamp": now.isoformat()}

        await cache_service.set(key, value)
        result = await cache_service.get(key)
        assert result == value

        # Special characters
        key = "test:special"
        value = {"text": "Hello\nWorld\t!", "emoji": "🚀"}

        await cache_service.set(key, value)
        result = await cache_service.get(key)
        assert result == value

    @pytest.mark.asyncio
    async def test_connection_error_handling(self, cache_service):
        """Test handling of Redis connection errors."""
        # Mock connection error
        with patch.object(
            cache_service.redis_clients[0],
            "set",
            side_effect=Exception("Connection failed"),
        ):
            with pytest.raises(Exception) as exc_info:
                await cache_service.set("test:key", "value")
            assert "Connection failed" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_batch_operations(self, cache_service):
        """Test batch operations performance."""
        # Set multiple keys
        keys = []
        for i in range(100):
            key = f"test:batch:{i}"
            keys.append(key)
            await cache_service.set(key, f"value{i}", expire=60)

        # Get all keys
        for i, key in enumerate(keys):
            result = await cache_service.get(key)
            assert result == f"value{i}"

        # Clear all
        deleted = await cache_service.clear_pattern("test:batch:*")
        assert deleted == 100
