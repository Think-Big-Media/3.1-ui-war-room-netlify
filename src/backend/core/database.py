"""
Database configuration with connection pooling for War Room.
Provides optimized database connections with proper pool management.
"""
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import QueuePool
from sqlalchemy.engine.events import event
from sqlalchemy import event as sqlalchemy_event

from core.config import settings


logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Database manager with connection pooling and performance optimizations.
    """

    def __init__(self):
        self.engine = None
        self.session_factory = None
        self._initialized = False

    async def initialize(self):
        """Initialize database engine with connection pool."""
        if self._initialized:
            return

        try:
            # Create async engine with connection pooling
            self.engine = create_async_engine(
                settings.DATABASE_URL,
                # Connection pool configuration
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=settings.DB_POOL_PRE_PING,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                poolclass=QueuePool,
                # Performance optimizations
                echo=settings.DB_ECHO,
                echo_pool=settings.DEBUG,
                # Connection string options
                connect_args={
                    "server_settings": {
                        # PostgreSQL-specific optimizations
                        "jit": "off",  # Disable JIT for better performance on simple queries
                        "statement_timeout": "60s",  # Query timeout
                        "idle_in_transaction_session_timeout": "300s",  # Idle transaction timeout
                    }
                },
            )

            # Set up event listeners for performance monitoring
            self._setup_event_listeners()

            # Create session factory
            self.session_factory = async_sessionmaker(
                bind=self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,  # Manual control over flushing
            )

            # Test connection
            async with self.engine.begin() as conn:
                await conn.execute("SELECT 1")

            self._initialized = True
            logger.info(f"Database initialized with pool size: {settings.DB_POOL_SIZE}")

        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    def _setup_event_listeners(self):
        """Set up database event listeners for monitoring."""

        @event.listens_for(self.engine.sync_engine, "connect")
        def set_connection_options(dbapi_connection, connection_record):
            """Configure connection-specific options."""
            with dbapi_connection.cursor() as cursor:
                # Set connection-specific PostgreSQL options
                cursor.execute("SET statement_timeout = '60s'")
                cursor.execute("SET lock_timeout = '30s'")
                cursor.execute("SET idle_in_transaction_session_timeout = '300s'")

        @event.listens_for(self.engine.sync_engine, "checkout")
        def receive_checkout(dbapi_connection, connection_record, connection_proxy):
            """Log connection checkout for debugging."""
            if settings.DEBUG:
                logger.debug("Connection checked out from pool")

        @event.listens_for(self.engine.sync_engine, "checkin")
        def receive_checkin(dbapi_connection, connection_record):
            """Log connection checkin for debugging."""
            if settings.DEBUG:
                logger.debug("Connection checked in to pool")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Get database session with proper cleanup.

        Yields:
            AsyncSession: Database session
        """
        if not self._initialized:
            await self.initialize()

        async with self.session_factory() as session:
            try:
                yield session
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {e}")
                raise
            finally:
                await session.close()

    async def get_read_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Get read-only database session for analytics queries.

        Yields:
            AsyncSession: Read-only database session
        """
        async with self.get_session() as session:
            # Set session to read-only mode
            await session.execute("SET transaction_read_only = true")
            yield session

    async def execute_query(self, query: str, params: dict = None):
        """
        Execute raw SQL query with proper connection handling.

        Args:
            query: SQL query string
            params: Query parameters

        Returns:
            Query result
        """
        async with self.get_session() as session:
            result = await session.execute(query, params or {})
            await session.commit()
            return result

    async def get_pool_status(self) -> dict:
        """
        Get connection pool status for monitoring.

        Returns:
            Dictionary with pool metrics
        """
        if not self.engine:
            return {}

        pool = self.engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": pool.invalid(),
        }

    async def close(self):
        """Close database connections and cleanup."""
        if self.engine:
            await self.engine.dispose()
            self._initialized = False
            logger.info("Database connections closed")


# Global database manager instance
database_manager = DatabaseManager()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database session.

    Yields:
        AsyncSession: Database session
    """
    async with database_manager.get_session() as session:
        yield session


async def get_read_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting read-only database session.

    Yields:
        AsyncSession: Read-only database session
    """
    async with database_manager.get_read_session() as session:
        yield session


# Compatibility with existing code
async def get_database():
    """Legacy function for compatibility."""
    return get_db()
