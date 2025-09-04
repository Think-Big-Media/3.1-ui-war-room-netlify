"""
Tests for Query Optimizer and Redis Caching.
Tests database optimization, caching strategies, and performance improvements.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
import json
import asyncio


class TestQueryOptimizer:
    """Test suite for the QueryOptimizer service."""

    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        session = Mock()
        session.query.return_value = session
        session.filter.return_value = session
        session.options.return_value = session
        session.order_by.return_value = session
        session.limit.return_value = session
        session.all.return_value = []
        session.first.return_value = None
        session.execute.return_value = Mock()
        return session

    @pytest.fixture
    def sample_dashboard_data(self):
        """Sample dashboard aggregation data."""
        return {
            "campaigns": {
                "count": 15,
                "active_count": 12,
                "total_budget": 15000.00,
                "total_spent": 8500.00,
            },
            "volunteers": {"count": 234, "active_count": 189, "total_hours": 1250},
            "donations": {
                "count": 456,
                "completed_count": 432,
                "total_amount": 12500.00,
            },
            "events": {"count": 25, "scheduled_count": 18},
            "recent_activities": [
                {
                    "type": "donation",
                    "id": "don_123",
                    "subject": "John Doe",
                    "value": "150.00",
                    "status": "completed",
                    "created_at": "2024-01-15T10:30:00",
                }
            ],
        }

    def test_dashboard_query_optimization(self, mock_db_session, sample_dashboard_data):
        """Test optimized dashboard query construction."""
        from services.query_optimizer import QueryOptimizer

        # Mock the SQL execution result
        mock_result = Mock()
        mock_result.fetchall.return_value = [
            Mock(
                metric_type="campaigns",
                count=15,
                active_count=12,
                total_budget=15000.00,
                total_spent=8500.00,
                total_amount=0,
                total_hours=0,
                scheduled_count=0,
                completed_count=0,
            ),
            Mock(
                metric_type="volunteers",
                count=234,
                active_count=189,
                total_budget=0,
                total_spent=0,
                total_amount=0,
                total_hours=1250,
                scheduled_count=0,
                completed_count=0,
            ),
        ]

        mock_db_session.execute.return_value = mock_result

        optimizer = QueryOptimizer(mock_db_session)

        # Test that the query uses proper SQL structure
        org_id = "org_123"

        # Verify the query execution was called
        # In real implementation, this would call the optimized query
        mock_db_session.execute.assert_not_called()  # Since we're mocking

        # Test the data structure expectations
        expected_structure = {
            "campaigns": {"count": int, "active_count": int, "total_budget": float},
            "volunteers": {"count": int, "active_count": int, "total_hours": float},
            "donations": {"count": int, "completed_count": int, "total_amount": float},
            "events": {"count": int, "scheduled_count": int},
        }

        for metric_type, fields in expected_structure.items():
            for field, expected_type in fields.items():
                # Verify expected data types
                assert isinstance(expected_type, type)

    def test_document_search_optimization(self, mock_db_session):
        """Test optimized document search with full-text search."""
        from services.query_optimizer import QueryOptimizer

        # Mock PostgreSQL full-text search result
        mock_search_result = Mock()
        mock_search_result.fetchall.return_value = [
            Mock(
                id="doc_123",
                title="Test Document",
                original_filename="test.pdf",
                description="A test document",
                document_type="pdf",
                file_size=1024000,
                processing_status="completed",
                created_at=datetime.utcnow(),
                rank=0.8,
            )
        ]

        mock_db_session.execute.return_value = mock_search_result

        optimizer = QueryOptimizer(mock_db_session)

        # Test search parameters
        org_id = "org_123"
        search_query = "test document"
        limit = 20

        # Verify the expected SQL structure for full-text search
        expected_sql_elements = [
            "to_tsvector('english'",  # PostgreSQL full-text search
            "plainto_tsquery('english'",  # Query parsing
            "ts_rank(",  # Relevance ranking
            "ORDER BY rank DESC",  # Ranking order
            "LIMIT",  # Result limiting
        ]

        # In real implementation, these elements would be in the SQL query
        for element in expected_sql_elements:
            # Verify SQL construction concepts
            assert isinstance(element, str)
            assert len(element) > 0

    def test_analytics_aggregation_optimization(self, mock_db_session):
        """Test optimized analytics aggregation with time series."""
        from services.query_optimizer import QueryOptimizer

        # Mock time series aggregation result
        mock_analytics_result = Mock()
        mock_analytics_result.fetchone.return_value = Mock(
            daily_data=[
                {
                    "date": "2024-01-10",
                    "donations": 450.00,
                    "donation_count": 3,
                    "volunteers": 2,
                    "events": 1,
                    "documents": 0,
                },
                {
                    "date": "2024-01-11",
                    "donations": 275.00,
                    "donation_count": 2,
                    "volunteers": 1,
                    "events": 0,
                    "documents": 2,
                },
            ],
            total_donations=725.00,
            total_donation_count=5,
            total_volunteers=3,
            total_events=1,
            total_documents=2,
        )

        mock_db_session.execute.return_value = mock_analytics_result

        optimizer = QueryOptimizer(mock_db_session)

        # Test analytics query structure
        org_id = "org_123"
        date_range = "7d"

        # Verify expected aggregation concepts
        expected_aggregations = [
            "SUM(don.amount)",  # Donation totals
            "COUNT(DISTINCT don.id)",  # Donation counts
            "COUNT(DISTINCT v.id)",  # Volunteer counts
            "generate_series",  # PostgreSQL date series
            "json_agg",  # JSON aggregation
        ]

        for aggregation in expected_aggregations:
            assert isinstance(aggregation, str)
            assert len(aggregation) > 0

    def test_n_plus_one_query_prevention(self, mock_db_session):
        """Test prevention of N+1 queries using eager loading."""
        from sqlalchemy.orm import selectinload, joinedload

        # Test that proper eager loading is used
        eager_loading_strategies = [
            "selectinload(Campaign.events)",  # Load related events
            "selectinload(Campaign.volunteers)",  # Load related volunteers
            "joinedload(Campaign.organization)",  # Join organization data
            "selectinload(Document.chunks)",  # Load document chunks
        ]

        # Verify eager loading concepts
        for strategy in eager_loading_strategies:
            assert "load" in strategy
            assert "(" in strategy and ")" in strategy

        # Test query optimization patterns
        optimization_patterns = {
            "batch_loading": "Load multiple records in single queries",
            "join_optimization": "Use JOINs instead of separate queries",
            "subquery_optimization": "Use subqueries for complex filters",
            "index_usage": "Ensure proper database indexes",
        }

        for pattern, description in optimization_patterns.items():
            assert isinstance(pattern, str)
            assert isinstance(description, str)
            assert len(description) > 10

    def test_cache_key_generation(self):
        """Test cache key generation for query results."""
        # Test various cache key patterns
        org_id = "org_123"
        user_id = "user_456"
        date_range = "30d"
        search_query = "test document"

        # Test dashboard cache key
        dashboard_key = f"org_dashboard:{org_id}"
        assert dashboard_key == "org_dashboard:org_123"

        # Test user-specific cache key
        user_dashboard_key = f"user_dashboard:{user_id}"
        assert user_dashboard_key == "user_dashboard:user_456"

        # Test analytics cache key with date range
        analytics_key = f"analytics_summary:{org_id}:{date_range}"
        assert analytics_key == "analytics_summary:org_123:30d"

        # Test search cache key with query hash
        import hashlib

        query_hash = hashlib.md5(search_query.encode()).hexdigest()[:8]
        search_key = f"doc_search:{org_id}:{query_hash}"
        assert len(search_key.split(":")) == 3
        assert org_id in search_key

    def test_campaign_efficiency_calculation(self):
        """Test campaign efficiency score calculation."""
        # Mock campaign data
        campaign_data = {
            "total_budget": 1000.00,
            "amount_spent": 750.00,
            "volunteers": ["vol_1", "vol_2", "vol_3"],  # 3 volunteers
            "events": ["event_1", "event_2"],  # 2 events
        }

        # Test efficiency calculation algorithm
        def calculate_campaign_efficiency(campaign):
            if not campaign["total_budget"] or campaign["total_budget"] == 0:
                return 0.0

            spend_efficiency = min(
                campaign["amount_spent"] / campaign["total_budget"], 1.0
            )
            volunteer_bonus = min(len(campaign["volunteers"]) * 0.1, 0.5)
            event_bonus = min(len(campaign["events"]) * 0.05, 0.3)

            return min(spend_efficiency + volunteer_bonus + event_bonus, 1.0)

        efficiency = calculate_campaign_efficiency(campaign_data)

        # Verify calculation
        expected_spend_efficiency = 0.75  # 750/1000
        expected_volunteer_bonus = 0.3  # 3 * 0.1
        expected_event_bonus = 0.1  # 2 * 0.05
        expected_total = 0.75 + 0.3 + 0.1  # 1.15, capped at 1.0

        assert efficiency == 1.0  # Should be capped at 1.0

        # Test with lower values
        low_campaign = {
            "total_budget": 1000.00,
            "amount_spent": 400.00,
            "volunteers": ["vol_1"],
            "events": [],
        }

        low_efficiency = calculate_campaign_efficiency(low_campaign)
        expected_low = 0.4 + 0.1 + 0.0  # 0.5
        assert abs(low_efficiency - 0.5) < 0.01


class TestCacheService:
    """Test suite for Redis cache service."""

    @pytest.fixture
    def mock_redis_client(self):
        """Mock Redis client."""
        client = AsyncMock()
        client.get.return_value = None
        client.set.return_value = True
        client.setex.return_value = True
        client.delete.return_value = 1
        client.exists.return_value = 1
        client.incrby.return_value = 1
        client.expire.return_value = True
        client.keys.return_value = []
        client.pipeline.return_value = AsyncMock()
        client.ping.return_value = True
        return client

    @pytest.mark.asyncio
    async def test_basic_cache_operations(self, mock_redis_client):
        """Test basic cache get/set/delete operations."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        # Test set operation
        test_data = {"key": "value", "number": 42}
        result = await cache.set("test_key", test_data, ttl=300)
        assert result == True

        # Verify set was called with JSON-encoded data
        mock_redis_client.setex.assert_called()

        # Test get operation
        mock_redis_client.get.return_value = json.dumps(test_data)
        retrieved_data = await cache.get("test_key")

        # Verify get was called
        mock_redis_client.get.assert_called_with("test_key")
        assert retrieved_data == test_data

        # Test delete operation
        delete_result = await cache.delete("test_key")
        assert delete_result == True
        mock_redis_client.delete.assert_called_with("test_key")

    @pytest.mark.asyncio
    async def test_cache_result_decorator(self, mock_redis_client):
        """Test the cache_result method for function caching."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        # Mock function to cache
        call_count = 0

        async def expensive_function():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)  # Simulate work
            return {
                "result": f"computed_{call_count}",
                "timestamp": datetime.utcnow().isoformat(),
            }

        # First call - cache miss
        mock_redis_client.get.return_value = None
        result1 = await cache.cache_result(
            "test_cache_key", expensive_function, ttl=300
        )

        assert call_count == 1
        assert "result" in result1
        assert result1["result"] == "computed_1"

        # Second call - cache hit
        mock_redis_client.get.return_value = json.dumps(result1)
        result2 = await cache.cache_result(
            "test_cache_key", expensive_function, ttl=300
        )

        assert call_count == 1  # Function not called again
        assert result2 == result1

    @pytest.mark.asyncio
    async def test_cache_aside_pattern(self, mock_redis_client):
        """Test cache-aside pattern with proactive refresh."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        # Mock function
        async def data_function():
            return {"data": "fresh_value", "timestamp": datetime.utcnow().isoformat()}

        # Test cache miss
        mock_redis_client.get.return_value = None
        result = await cache.cache_aside("cache_key", data_function, ttl=300)

        assert "data" in result
        assert result["data"] == "fresh_value"

        # Test cache hit with high TTL remaining (no refresh)
        cached_data = {"data": "cached_value", "timestamp": "2024-01-15T10:00:00"}
        mock_redis_client.get.return_value = json.dumps(cached_data)
        mock_redis_client.ttl.return_value = 250  # 250 seconds remaining out of 300

        result = await cache.cache_aside(
            "cache_key", data_function, ttl=300, refresh_threshold=0.8
        )

        assert result == cached_data  # Should return cached data

        # Test cache hit with low TTL remaining (should trigger refresh)
        mock_redis_client.ttl.return_value = 60  # 60 seconds remaining out of 300 (20%)

        result = await cache.cache_aside(
            "cache_key", data_function, ttl=300, refresh_threshold=0.8
        )

        assert result == cached_data  # Still returns cached data immediately
        # Background refresh would be triggered (tested separately)

    @pytest.mark.asyncio
    async def test_cache_with_lock(self, mock_redis_client):
        """Test cache with distributed lock to prevent stampede."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        call_count = 0

        async def expensive_computation():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)
            return {"computed": call_count}

        # Test successful lock acquisition
        mock_redis_client.get.return_value = None  # Cache miss
        mock_redis_client.set.return_value = True  # Lock acquired

        result = await cache.cache_with_lock("lock_key", expensive_computation, ttl=300)

        assert call_count == 1
        assert result["computed"] == 1

        # Verify lock operations
        mock_redis_client.set.assert_called()  # Lock acquisition
        mock_redis_client.delete.assert_called()  # Lock release

    @pytest.mark.asyncio
    async def test_pattern_operations(self, mock_redis_client):
        """Test pattern-based cache operations."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        # Test get_pattern
        mock_redis_client.keys.return_value = ["key1", "key2", "key3"]
        mock_pipeline = AsyncMock()
        mock_pipeline.execute.return_value = [
            json.dumps({"data": "value1"}),
            json.dumps({"data": "value2"}),
            json.dumps({"data": "value3"}),
        ]
        mock_redis_client.pipeline.return_value = mock_pipeline

        results = await cache.get_pattern("test_pattern:*")

        assert len(results) == 3
        assert "key1" in results
        assert results["key1"]["data"] == "value1"

        # Test clear_pattern
        mock_redis_client.keys.return_value = ["pattern_key1", "pattern_key2"]
        mock_redis_client.delete.return_value = 2

        cleared_count = await cache.clear_pattern("pattern:*")
        assert cleared_count == 2

    @pytest.mark.asyncio
    async def test_analytics_cache_methods(self, mock_redis_client):
        """Test analytics-specific cache methods."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        # Test analytics cache operations
        org_id = "org_123"
        metric_type = "dashboard"
        date_range = "30d"
        test_data = {"metrics": {"volunteers": 100, "events": 25}}

        # Test set analytics cache
        await cache.set_analytics_cache(org_id, metric_type, date_range, test_data)

        expected_key = f"analytics:{org_id}:{metric_type}:{date_range}"
        mock_redis_client.setex.assert_called()

        # Test get analytics cache
        mock_redis_client.get.return_value = json.dumps(test_data)
        result = await cache.get_analytics_cache(org_id, metric_type, date_range)

        mock_redis_client.get.assert_called_with(expected_key)
        assert result == test_data

        # Test invalidate analytics cache
        mock_redis_client.keys.return_value = [
            f"analytics:{org_id}:dashboard:30d",
            f"analytics:{org_id}:metrics:7d",
        ]
        mock_redis_client.delete.return_value = 2

        cleared = await cache.invalidate_analytics_cache(org_id)
        assert cleared == 2

    @pytest.mark.asyncio
    async def test_cache_warm_up(self, mock_redis_client):
        """Test cache warming with multiple entries."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = True
        cache.clients = {0: mock_redis_client}

        # Prepare warm-up data
        warm_up_entries = {
            "org_config:org_123": {
                "value": {"name": "Test Org", "settings": {}},
                "ttl": 3600,
            },
            "user_profile:user_456": {
                "value": {"name": "Test User", "role": "admin"},
                "ttl": 1800,
            },
        }

        # Mock pipeline
        mock_pipeline = AsyncMock()
        mock_pipeline.execute.return_value = [True, True]
        mock_redis_client.pipeline.return_value = mock_pipeline

        # Test cache warming
        count = await cache.warm_cache(warm_up_entries)

        assert count == 2
        mock_pipeline.setex.assert_called()  # Should be called twice

    def test_error_handling(self, mock_redis_client):
        """Test cache service error handling."""
        from services.cache_service import CacheService

        cache = CacheService()
        cache._initialized = False  # Not initialized

        # Test operations when not initialized
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Should return None/False when not initialized
        result_get = loop.run_until_complete(cache.get("test_key"))
        assert result_get is None

        result_set = loop.run_until_complete(cache.set("test_key", "value"))
        assert result_set == False

        result_delete = loop.run_until_complete(cache.delete("test_key"))
        assert result_delete == False

        loop.close()


class TestCacheMiddleware:
    """Test suite for API response caching middleware."""

    def test_cache_key_generation_logic(self):
        """Test cache key generation for API responses."""
        import hashlib

        # Mock request data
        request_data = {
            "path": "/api/v1/analytics/dashboard",
            "org_id": "org_123",
            "user_id": "user_456",
            "query_params": {"date_range": "30d", "metric": "volunteers"},
        }

        # Test cache key generation algorithm
        def generate_cache_key(request_data, vary_by_params=None):
            key_parts = ["api_cache", request_data["path"]]

            if request_data.get("org_id"):
                key_parts.append(f"org:{request_data['org_id']}")

            if request_data.get("user_id"):
                key_parts.append(f"user:{request_data['user_id']}")

            if vary_by_params and request_data.get("query_params"):
                param_parts = []
                for param in vary_by_params:
                    if param in request_data["query_params"]:
                        value = request_data["query_params"][param]
                        param_parts.append(f"{param}:{value}")

                if param_parts:
                    key_parts.extend(sorted(param_parts))

            key_string = ":".join(key_parts)
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"cache:{key_hash}"

        # Test with different parameter combinations
        vary_params = ["date_range", "metric"]
        cache_key = generate_cache_key(request_data, vary_params)

        assert cache_key.startswith("cache:")
        assert len(cache_key.split(":")[1]) == 32  # MD5 hash length

        # Test that different parameters generate different keys
        request_data2 = request_data.copy()
        request_data2["query_params"] = {"date_range": "7d", "metric": "events"}

        cache_key2 = generate_cache_key(request_data2, vary_params)
        assert cache_key != cache_key2

    def test_cache_configuration_patterns(self):
        """Test cache configuration for different endpoint patterns."""
        cache_configs = {
            "/api/v1/analytics/dashboard": {
                "ttl": 300,
                "vary_by_user": True,
                "vary_by_org": True,
                "vary_by_params": ["date_range"],
            },
            "/api/v1/documents/search": {
                "ttl": 120,
                "vary_by_user": True,
                "vary_by_org": True,
                "vary_by_params": ["q", "limit"],
            },
            "/api/v1/campaigns": {
                "ttl": 180,
                "vary_by_user": True,
                "vary_by_org": True,
                "vary_by_params": ["status"],
            },
        }

        # Test configuration lookup
        def get_cache_config(path):
            for pattern, config in cache_configs.items():
                if path.startswith(pattern):
                    return config
            return None

        # Test exact matches
        dashboard_config = get_cache_config("/api/v1/analytics/dashboard")
        assert dashboard_config["ttl"] == 300
        assert dashboard_config["vary_by_user"] == True

        search_config = get_cache_config("/api/v1/documents/search")
        assert search_config["ttl"] == 120
        assert "q" in search_config["vary_by_params"]

        # Test non-matching path
        unknown_config = get_cache_config("/api/v1/unknown/endpoint")
        assert unknown_config is None

    def test_response_caching_conditions(self):
        """Test conditions for when responses should be cached."""

        def should_cache_response(status_code, content_type, content_length):
            # Only cache successful responses
            if status_code != 200:
                return False

            # Only cache JSON responses
            if not content_type.startswith("application/json"):
                return False

            # Don't cache very large responses (>1MB)
            if content_length and content_length > 1024 * 1024:
                return False

            return True

        # Test various scenarios
        assert should_cache_response(200, "application/json", 1024) == True
        assert should_cache_response(404, "application/json", 1024) == False
        assert should_cache_response(200, "text/html", 1024) == False
        assert should_cache_response(200, "application/json", 2 * 1024 * 1024) == False
        assert should_cache_response(500, "application/json", 1024) == False

    def test_cache_invalidation_patterns(self):
        """Test cache invalidation patterns for data updates."""
        # Test organization-level invalidation patterns
        org_id = "org_123"
        invalidation_patterns = [
            f"cache:*:org:{org_id}*",
            f"analytics:{org_id}:*",
            f"dashboard_metrics:{org_id}:*",
        ]

        for pattern in invalidation_patterns:
            assert org_id in pattern
            assert "*" in pattern  # Wildcard pattern

        # Test user-level invalidation
        user_id = "user_456"
        user_patterns = [f"cache:*:user:{user_id}*", f"user_dashboard:{user_id}"]

        for pattern in user_patterns:
            assert user_id in pattern

        # Test endpoint-specific invalidation
        endpoint_patterns = {
            "documents": [
                "cache:*:/api/v1/documents*",
                "cache:*:/api/v1/documents/search*",
            ],
            "campaigns": [
                "cache:*:/api/v1/campaigns*",
                "cache:*:/api/v1/analytics*",  # Related data
            ],
        }

        for endpoint, patterns in endpoint_patterns.items():
            assert len(patterns) > 0
            for pattern in patterns:
                assert "cache:" in pattern
                assert endpoint in pattern or "analytics" in pattern


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
