"""
Configuration settings for War Room Analytics Dashboard.
Includes Redis, WebSocket, and security configurations.
"""
import os
from typing import Optional, List, ClassVar, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra='ignore'
    )

    # Application
    APP_NAME: str = "War Room Analytics"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False)
    PORT: int = Field(default=8000)
    ENVIRONMENT: str = Field(default="development")
    
    # GitHub
    GITHUB_PAT: str = Field(default="", description="GitHub Personal Access Token")
    
    # Supabase
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase anonymous key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase service role key")
    SUPABASE_DB_PASSWORD: str = Field(default="", description="Supabase database password")
    
    # PostHog
    POSTHOG_KEY: str = Field(default="", description="PostHog API key")
    POSTHOG_HOST: str = Field(default="https://app.posthog.com", description="PostHog host URL")
    
    # Deployment
    RENDER_ENV: str = Field(default="", description="Render environment")
    PYTHON_VERSION: str = Field(default="3.11", description="Python version")
    NODE_VERSION: str = Field(default="20.11.1", description="Node.js version")

    # API
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://user:pass@localhost:5432/warroom",
        description="PostgreSQL connection string",
    )

    # Database Connection Pool
    DB_POOL_SIZE: int = Field(default=20, description="Database connection pool size")
    DB_MAX_OVERFLOW: int = Field(
        default=40, description="Maximum connections beyond pool size"
    )
    DB_POOL_RECYCLE: int = Field(
        default=3600, description="Connection recycle time in seconds"
    )
    DB_POOL_PRE_PING: bool = Field(
        default=True, description="Enable connection pre-ping"
    )
    DB_POOL_TIMEOUT: int = Field(
        default=30, description="Connection timeout in seconds"
    )
    DB_ECHO: bool = Field(default=False, description="Enable SQL query logging")

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379", description="Redis connection string"
    )
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)
    REDIS_POOL_MIN_SIZE: int = 10
    REDIS_POOL_MAX_SIZE: int = 20
    REDIS_MAX_CONNECTIONS: int = 50

    # Redis databases
    REDIS_DATABASES: ClassVar[Dict[str, int]] = {
        "default": 0,
        "realtime": 1,
        "sessions": 2,
        "feature_flags": 3,
    }

    # Caching
    ANALYTICS_CACHE_TTL: int = Field(
        default=300, description="Analytics cache TTL in seconds (5 minutes)"
    )
    USER_ACTIVITY_CACHE_TTL: int = Field(
        default=1800, description="User activity cache TTL in seconds (30 minutes)"
    )

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = Field(
        default=30, description="WebSocket heartbeat interval in seconds"
    )
    WS_MESSAGE_QUEUE_SIZE: int = 100
    WS_CONNECTION_TIMEOUT: int = 60
    ANALYTICS_UPDATE_INTERVAL: int = Field(
        default=5, description="Real-time analytics update interval in seconds"
    )

    # Security
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT encoding",
    )
    JWT_SECRET: str = Field(
        default="your-secret-key",
        description="JWT secret key (alias for SECRET_KEY)"
    )
    JWT_ALGORITHM: str = "HS256"
    ALGORITHM: str = "HS256"  # Alias for JWT_ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Admin Authentication Security
    ADMIN_JWT_SECRET: str = Field(
        default="admin-jwt-secret-change-in-production",
        description="Separate JWT secret key for admin authentication"
    )
    ADMIN_SESSION_DURATION: int = Field(
        default=4, description="Admin session duration in hours"
    )
    ADMIN_USERNAME: str = Field(
        default="admin", description="Default admin username for initial setup"
    )
    ADMIN_PASSWORD: str = Field(
        default="", description="Admin password for initial setup (remove after use)"
    )
    ADMIN_EMAIL: str = Field(
        default="", description="Admin email for initial setup and notifications"
    )
    ADMIN_FULL_NAME: str = Field(
        default="", description="Admin full name for initial setup"
    )

    # OAuth Configuration
    GOOGLE_CLIENT_ID: str = Field(
        default="", description="Google OAuth Client ID"
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default="", description="Google OAuth Client Secret"
    )
    FACEBOOK_APP_ID: str = Field(
        default="", description="Facebook OAuth App ID"
    )
    FACEBOOK_APP_SECRET: str = Field(
        default="", description="Facebook OAuth App Secret"
    )
    OAUTH_REDIRECT_BASE_URL: str = Field(
        default="https://war-room-oa9t.onrender.com",
        description="Base URL for OAuth redirects"
    )

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins",
    )

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Rate Limiting
    RATE_LIMIT_ANALYTICS: str = "30/minute"
    RATE_LIMIT_EXPORT: str = "10/hour"
    RATE_LIMIT_WEBSOCKET: str = "100/minute"

    # Export Settings
    MAX_EXPORT_ROWS: int = 10000
    EXPORT_TIMEOUT: int = 300  # 5 minutes
    PDF_GENERATION_TIMEOUT: int = 60

    # Performance
    MAX_CHART_DATA_POINTS: int = 10000
    AGGREGATION_THRESHOLD: int = 1000

    # Monitoring
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = "json"
    ENABLE_METRICS: bool = True

    # Sentry Error Tracking
    SENTRY_DSN: Optional[str] = Field(
        default=None, description="Sentry DSN for error tracking"
    )
    SENTRY_ENVIRONMENT: str = Field(
        default="development", description="Environment name for Sentry"
    )
    SENTRY_TRACES_SAMPLE_RATE: float = Field(
        default=0.1,
        description="Percentage of transactions to send to Sentry (0.0-1.0)",
    )
    SENTRY_PROFILES_SAMPLE_RATE: float = Field(
        default=0.1, description="Percentage of transactions to profile (0.0-1.0)"
    )

    # Feature Flags
    ENABLE_REAL_TIME_UPDATES: bool = True
    ENABLE_EXPORT_FEATURE: bool = True
    ENABLE_ADVANCED_ANALYTICS: bool = True

    # PostHog Analytics (merged with above)
    POSTHOG_ENABLED: bool = Field(default=True)
    POSTHOG_API_KEY: str = Field(
        default="phc_project_api_key", description="PostHog project API key"
    )
    POSTHOG_PERSON_PROFILES: str = Field(
        default="identified_only", description="When to create person profiles"
    )

    # Platform Admin
    PLATFORM_ADMIN_EMAILS: List[str] = Field(
        default=["admin@warroom.app"],
        description="Email addresses of platform administrators",
    )

    # Pinecone Vector Database
    PINECONE_API_KEY: str = Field(
        default="", description="Pinecone API key for vector database operations"
    )
    PINECONE_ENVIRONMENT: str = Field(
        default="us-east-1", description="Pinecone environment (region)"
    )
    PINECONE_INDEX_NAME: str = Field(
        default="warroom-documents",
        description="Pinecone index name for document storage",
    )
    PINECONE_INDEX_HOST: str = Field(
        default="", description="Pinecone index host URL"
    )

    # OpenAI API
    OPENAI_API_KEY: str = Field(
        default="",
        description="OpenAI API key for embedding generation and AI features",
    )
    OPENAI_MODEL_EMBEDDING: str = Field(
        default="text-embedding-ada-002", description="OpenAI model for text embeddings"
    )
    OPENAI_MODEL_CHAT: str = Field(
        default="gpt-4", description="OpenAI model for chat completions"
    )

    # Document Processing
    MAX_DOCUMENT_SIZE_MB: int = Field(
        default=25, description="Maximum document size in MB"
    )
    DOCUMENT_CHUNK_SIZE: int = Field(
        default=1000, description="Text chunk size for vector embeddings"
    )
    DOCUMENT_CHUNK_OVERLAP: int = Field(
        default=200, description="Overlap between text chunks"
    )
    MAX_SEARCH_RESULTS: int = Field(
        default=10, description="Maximum number of search results to return"
    )
    
    # Communication Services
    SENDGRID_API_KEY: str = Field(
        default="", description="SendGrid API key for email delivery"
    )
    SENDGRID_EMAIL: str = Field(
        default="Info@wethinkbig.io", description="SendGrid account email"
    )
    SENDGRID_PASSWORD: str = Field(
        default="", description="SendGrid account password"
    )
    TWILIO_ACCOUNT_SID: str = Field(
        default="", description="Twilio Account SID for SMS/WhatsApp"
    )
    TWILIO_AUTH_TOKEN: str = Field(
        default="", description="Twilio Auth Token"
    )
    TWILIO_PHONE_NUMBER: str = Field(
        default="", description="Twilio phone number for sending SMS"
    )
    TWILIO_WHATSAPP_NUMBER: str = Field(
        default="", description="Twilio WhatsApp number"
    )
    NOTIFICATION_EMAIL: str = Field(
        default="Info@wethinkbig.io", description="Default notification email address"
    )
    NOTIFICATION_PASSWORD: str = Field(
        default="", description="Notification email password"
    )
    TWILIO_2FA_NUMBER: str = Field(
        default="813-965-2725", description="2FA phone number"
    )
    TWILIO_RECOVERY_CODE: str = Field(
        default="", description="Twilio recovery code"
    )
    
    # Meta/Facebook Business API
    META_APP_ID: str = Field(
        default="", description="Meta/Facebook app ID"
    )
    META_APP_SECRET: str = Field(
        default="", description="Meta/Facebook app secret"
    )
    META_ACCESS_TOKEN: str = Field(
        default="", description="Meta/Facebook access token (production)"
    )
    META_SANDBOX_TOKEN: str = Field(
        default="", description="Meta/Facebook sandbox token (testing)"
    )
    
    # Social Media APIs (Legacy)
    FACEBOOK_WARROOM_API_TOKEN: str = Field(
        default="", description="Facebook Marketing API token (deprecated - use META_ACCESS_TOKEN)"
    )
    MENTIONLYTICS_EMAIL: str = Field(
        default="", description="Mentionlytics account email"
    )
    MENTIONLYTICS_PASSWORD: str = Field(
        default="", description="Mentionlytics account password"
    )
    MENTIONLYTICS_API_ENDPOINT: str = Field(
        default="https://app.mentionlytics.com/api/token",
        description="Mentionlytics API endpoint"
    )
    
    # Google Ads API
    GOOGLE_ADS_DEVELOPER_TOKEN: str = Field(
        default="", description="Google Ads API developer token"
    )
    GOOGLE_ADS_CLIENT_ID: str = Field(
        default="", description="Google Ads OAuth2 client ID"
    )
    GOOGLE_ADS_CLIENT_SECRET: str = Field(
        default="", description="Google Ads OAuth2 client secret"
    )
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: str = Field(
        default="", description="Google Ads login customer ID (optional)"
    )
    
    # API Base URL for OAuth2 redirects
    API_BASE_URL: str = Field(
        default="http://localhost:8000", 
        description="Base URL for API (used for OAuth2 redirects)"
    )

    @property
    def redis_url_with_db(self) -> str:
        """Get Redis URL with database number for different purposes."""
        base_url = self.REDIS_URL.rstrip("/")
        return {
            "cache": f"{base_url}/0",
            "sessions": f"{base_url}/1",
            "rate_limit": f"{base_url}/2",
            "websocket": f"{base_url}/3",
        }


# Create global settings instance
settings = Settings()


def validate_api_credentials() -> dict:
    """
    Validate all API credentials and return status report.
    Used for startup checks and configuration validation.
    """
    issues = []
    warnings = []
    
    def is_valid_credential(value: str, name: str) -> bool:
        if not value or value in ["", "YOUR_VALUE_HERE", "development_placeholder"]:
            return False
        if len(value.strip()) < 8:  # Minimum credential length
            warnings.append(f"{name} appears to be too short (less than 8 characters)")
        return True
    
    # Check core required credentials
    if not is_valid_credential(settings.SUPABASE_URL, "SUPABASE_URL"):
        issues.append("Missing or invalid SUPABASE_URL")
    
    if not is_valid_credential(settings.SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY"):
        issues.append("Missing or invalid SUPABASE_ANON_KEY")
    
    # Check API credentials
    has_meta_credentials = (
        is_valid_credential(settings.META_APP_ID, "META_APP_ID") and
        is_valid_credential(settings.META_APP_SECRET, "META_APP_SECRET") and
        is_valid_credential(settings.META_ACCESS_TOKEN, "META_ACCESS_TOKEN")
    )
    
    has_google_ads_credentials = (
        is_valid_credential(settings.GOOGLE_ADS_CLIENT_ID, "GOOGLE_ADS_CLIENT_ID") and
        is_valid_credential(settings.GOOGLE_ADS_CLIENT_SECRET, "GOOGLE_ADS_CLIENT_SECRET") and
        is_valid_credential(settings.GOOGLE_ADS_DEVELOPER_TOKEN, "GOOGLE_ADS_DEVELOPER_TOKEN")
    )
    
    has_sendgrid_credentials = (
        is_valid_credential(settings.SENDGRID_EMAIL, "SENDGRID_EMAIL") and
        is_valid_credential(settings.SENDGRID_PASSWORD, "SENDGRID_PASSWORD")
    )
    
    has_posthog_credentials = (
        is_valid_credential(settings.POSTHOG_KEY, "POSTHOG_KEY")
    )
    
    has_openai_credentials = (
        is_valid_credential(settings.OPENAI_API_KEY, "OPENAI_API_KEY")
    )
    
    # Check security credentials
    if settings.SECRET_KEY in ["your-secret-key-change-in-production", "your-secret-key"]:
        issues.append("SECRET_KEY is still using default value - change in production!")
    
    if settings.ADMIN_JWT_SECRET == "admin-jwt-secret-change-in-production":
        issues.append("ADMIN_JWT_SECRET is still using default value - change in production!")
    
    # Environment-specific checks
    if settings.ENVIRONMENT == "production":
        if not has_meta_credentials:
            warnings.append("Meta/Facebook API credentials missing in production")
        if not has_google_ads_credentials:
            warnings.append("Google Ads API credentials missing in production")
        if not has_posthog_credentials:
            warnings.append("PostHog analytics credentials missing in production")
    
    return {
        "is_valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "credentials_status": {
            "meta": has_meta_credentials,
            "google_ads": has_google_ads_credentials,
            "sendgrid": has_sendgrid_credentials,
            "posthog": has_posthog_credentials,
            "openai": has_openai_credentials,
        },
        "environment": settings.ENVIRONMENT,
    }


def log_startup_validation():
    """Log credential validation results during startup."""
    validation = validate_api_credentials()
    
    if validation["is_valid"]:
        print("✅ API credential validation passed")
    else:
        print("❌ API credential validation failed:")
        for issue in validation["issues"]:
            print(f"  • {issue}")
    
    if validation["warnings"]:
        print("⚠️  Configuration warnings:")
        for warning in validation["warnings"]:
            print(f"  • {warning}")
    
    # Show credential status
    creds = validation["credentials_status"]
    print(f"📊 Credential status: Meta={creds['meta']}, Google Ads={creds['google_ads']}, "
          f"SendGrid={creds['sendgrid']}, PostHog={creds['posthog']}, OpenAI={creds['openai']}")
    
    return validation


# Derived settings
WS_ALLOWED_ORIGINS = settings.BACKEND_CORS_ORIGINS + [
    origin.replace("http://", "ws://").replace("https://", "wss://")
    for origin in settings.BACKEND_CORS_ORIGINS
]
