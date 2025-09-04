"""
Pytest configuration and fixtures for backend tests.
"""
import os
import asyncio
from typing import Generator, AsyncGenerator
from unittest.mock import Mock, AsyncMock
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from httpx import AsyncClient
from fastapi import FastAPI
from redis import Redis
import fakeredis

from core.config import settings
from core.database import get_db
from models.base import BaseModel as Base
from services.cache_service import CacheService
from models.user import User
from models.organization import Organization
from main import app as main_app
from core.security import create_access_token


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_settings():
    """Override settings for testing."""
    # Create a test settings object
    test_settings = type(settings)(
        DATABASE_URL=TEST_DATABASE_URL,
        SECRET_KEY="test-secret-key",
        JWT_ALGORITHM="HS256",
        ACCESS_TOKEN_EXPIRE_MINUTES=30,
        REDIS_HOST="localhost",
        REDIS_PORT=6379,
        DEBUG=True,
    )
    return test_settings


@pytest_asyncio.fixture
async def test_db_engine(test_settings):
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def test_db_session(test_db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session_maker = sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
def test_redis() -> Redis:
    """Create fake Redis client for testing."""
    return fakeredis.FakeRedis(decode_responses=True)


@pytest.fixture
def test_cache_service(test_redis) -> CacheService:
    """Create test cache service with fake Redis."""
    service = CacheService()
    # Override Redis clients with fake ones
    service.redis_clients = {
        0: test_redis,
        1: fakeredis.FakeRedis(decode_responses=True),
        2: fakeredis.FakeRedis(decode_responses=True),
        3: fakeredis.FakeRedis(decode_responses=True),
    }
    return service


@pytest.fixture
def test_app(test_settings, test_db_session, test_cache_service) -> FastAPI:
    """Create test FastAPI application."""
    # Use the main app instance
    app = main_app

    # Override dependencies
    app.dependency_overrides[get_db] = lambda: test_db_session

    # Mock external services
    app.state.cache_service = test_cache_service

    return app


@pytest_asyncio.fixture
async def test_client(test_app) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client."""
    async with AsyncClient(app=test_app, base_url="http://testserver") as client:
        yield client


@pytest_asyncio.fixture
async def test_org(test_db_session) -> Organization:
    """Create test organization."""
    org = Organization(
        id="test-org-123",
        name="Test Campaign",
        email="test@campaign.com",
        subscription_tier="professional",
        is_active=True,
        settings={},
    )
    test_db_session.add(org)
    await test_db_session.commit()
    await test_db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def test_user(test_db_session, test_org) -> User:
    """Create test user."""
    user = User(
        id="test-user-123",
        email="test@example.com",
        full_name="Test User",
        hashed_password="$2b$12$test_hash",  # Not a real hash
        org_id=test_org.id,
        role="admin",
        permissions=["analytics.view", "analytics.export", "platform.admin"],
        is_active=True,
    )
    test_db_session.add(user)
    await test_db_session.commit()
    await test_db_session.refresh(user)
    return user


@pytest.fixture
def test_token(test_user) -> str:
    """Create test JWT token."""
    return create_access_token(
        data={
            "sub": test_user.email,
            "user_id": test_user.id,
            "org_id": test_user.org_id,
            "role": test_user.role,
            "permissions": test_user.permissions,
        }
    )


@pytest.fixture
def auth_headers(test_token) -> dict:
    """Create authorization headers."""
    return {"Authorization": f"Bearer {test_token}"}


@pytest.fixture
def mock_posthog():
    """Mock PostHog client."""
    mock = Mock()
    mock.capture = Mock()
    mock.feature_enabled = Mock(return_value=True)
    mock.get_feature_flag = Mock(return_value=True)
    mock.get_all_flags = Mock(return_value={})
    return mock


@pytest.fixture
def mock_websocket_manager():
    """Mock WebSocket connection manager."""
    mock = AsyncMock()
    mock.connect = AsyncMock()
    mock.disconnect = AsyncMock()
    mock.send_personal_message = AsyncMock()
    mock.broadcast = AsyncMock()
    mock.broadcast_to_org = AsyncMock()
    return mock


@pytest.fixture
def mock_export_service():
    """Mock export service."""
    mock = AsyncMock()
    mock.export_dashboard_data = AsyncMock(
        return_value={
            "job_id": "test-job-123",
            "status": "processing",
        }
    )
    return mock


# Sample data fixtures
@pytest.fixture
def sample_analytics_data():
    """Sample analytics dashboard data."""
    return {
        "overview": {
            "total_volunteers": 1234,
            "active_volunteers": 456,
            "total_events": 78,
            "upcoming_events": 12,
            "total_donations": 98765.43,
            "donor_count": 234,
            "total_contacts": 5678,
            "engagement_rate": 0.234,
        },
        "metrics": {
            "volunteers": {
                "current": 1234,
                "previous": 1100,
                "trend": "up",
                "change_percent": 12.18,
                "sparkline": [1100, 1120, 1150, 1180, 1200, 1220, 1234],
            },
            "events": {
                "current": 78,
                "previous": 65,
                "trend": "up",
                "change_percent": 20.0,
                "sparkline": [65, 68, 70, 72, 74, 76, 78],
            },
            "donations": {
                "current": 98765.43,
                "previous": 87654.32,
                "trend": "up",
                "change_percent": 12.68,
                "sparkline": [87654, 89000, 91000, 93000, 95000, 97000, 98765],
            },
            "engagement": {
                "current": 23.4,
                "previous": 21.2,
                "trend": "up",
                "change_percent": 10.38,
                "sparkline": [21.2, 21.5, 22.0, 22.3, 22.8, 23.1, 23.4],
            },
        },
        "charts": {
            "volunteer_growth": {
                "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                "datasets": [
                    {
                        "label": "New Volunteers",
                        "data": [12, 19, 15, 25, 22, 30, 28],
                    }
                ],
            },
            "event_attendance": {
                "labels": ["Event 1", "Event 2", "Event 3", "Event 4"],
                "datasets": [
                    {
                        "label": "Registered",
                        "data": [120, 150, 180, 200],
                    },
                    {
                        "label": "Attended",
                        "data": [100, 130, 160, 180],
                    },
                ],
            },
        },
    }


@pytest.fixture
def sample_platform_admin_data():
    """Sample platform admin dashboard data."""
    return {
        "system_health": {
            "api_uptime": 99.9,
            "database_status": "healthy",
            "cache_status": "healthy",
            "worker_status": "healthy",
            "last_check": "2024-01-15T10:30:00Z",
        },
        "usage_metrics": {
            "total_organizations": 50,
            "active_organizations": 45,
            "total_users": 1250,
            "active_users_30d": 980,
            "api_calls_today": 125000,
            "storage_used_gb": 234.5,
        },
        "feature_flags": [
            {
                "id": "new-dashboard",
                "name": "New Analytics Dashboard",
                "enabled": True,
                "rollout_percentage": 100,
            },
            {
                "id": "ai-insights",
                "name": "AI Campaign Insights",
                "enabled": True,
                "rollout_percentage": 50,
            },
        ],
    }
