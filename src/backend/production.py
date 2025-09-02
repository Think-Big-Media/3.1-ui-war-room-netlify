"""
Production configuration and optimizations for War Room.
Includes security, performance, and monitoring settings for deployment.
"""
import os
import logging
from typing import Optional
from pathlib import Path

from core.config import Settings


class ProductionSettings(Settings):
    """
    Production-specific settings with security and performance optimizations.
    """

    # Security hardening
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "")
    DEBUG: bool = False

    # Database production optimizations
    DB_POOL_SIZE: int = 30  # Increased for production load
    DB_MAX_OVERFLOW: int = 60  # Higher overflow for traffic spikes
    DB_POOL_RECYCLE: int = 1800  # 30 minutes for production
    DB_POOL_TIMEOUT: int = 60  # Longer timeout for production

    # Redis production optimizations
    REDIS_MAX_CONNECTIONS: int = 100  # Increased for production
    REDIS_POOL_MIN_SIZE: int = 20
    REDIS_POOL_MAX_SIZE: int = 50

    # Cache TTL optimization for production
    ANALYTICS_CACHE_TTL: int = 600  # 10 minutes for production
    USER_ACTIVITY_CACHE_TTL: int = 3600  # 1 hour for production

    # Security headers and HTTPS
    HTTPS_ONLY: bool = True
    SECURE_HEADERS: bool = True

    # Production CORS - more restrictive
    BACKEND_CORS_ORIGINS: list = [
        "https://your-domain.com",
        "https://www.your-domain.com",
        "https://app.your-domain.com",
    ]

    # Logging configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = "/var/log/warroom/app.log"

    # Performance monitoring
    ENABLE_PROMETHEUS: bool = True
    PROMETHEUS_PORT: int = 9090

    # Rate limiting for production
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # 1 minute

    # File upload limits
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".doc", ".docx", ".xlsx", ".csv"]

    # Background task configuration
    CELERY_BROKER_URL: str = os.environ.get(
        "CELERY_BROKER_URL", "redis://localhost:6379/4"
    )
    CELERY_RESULT_BACKEND: str = os.environ.get(
        "CELERY_RESULT_BACKEND", "redis://localhost:6379/5"
    )

    # Health check configuration
    HEALTH_CHECK_ENABLED: bool = True
    HEALTH_CHECK_TIMEOUT: int = 30

    # Graceful shutdown timeout
    SHUTDOWN_TIMEOUT: int = 30

    @classmethod
    def validate_production_env(cls) -> bool:
        """
        Validate that all required production environment variables are set.

        Returns:
            bool: True if all required variables are set
        """
        required_vars = [
            "SECRET_KEY",
            "DATABASE_URL",
            "REDIS_URL",
        ]

        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)

        if missing_vars:
            logging.error(f"Missing required environment variables: {missing_vars}")
            return False

        return True

    @classmethod
    def setup_production_logging(cls):
        """Set up production logging configuration."""
        log_level = getattr(logging, cls.LOG_LEVEL.upper())
        log_format = cls.LOG_FORMAT

        # Configure root logger
        logging.basicConfig(
            level=log_level,
            format=log_format,
            handlers=[
                logging.StreamHandler(),  # Console output
                logging.FileHandler(cls.LOG_FILE)
                if cls.LOG_FILE
                else logging.NullHandler(),
            ],
        )

        # Configure specific loggers
        logging.getLogger("uvicorn").setLevel(log_level)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
        logging.getLogger("redis").setLevel(logging.WARNING)


def get_production_settings() -> ProductionSettings:
    """
    Get production settings with validation.

    Returns:
        ProductionSettings: Validated production settings
    """
    settings = ProductionSettings()

    # Validate environment
    if not settings.validate_production_env():
        raise ValueError("Production environment validation failed")

    # Setup logging
    settings.setup_production_logging()

    return settings
