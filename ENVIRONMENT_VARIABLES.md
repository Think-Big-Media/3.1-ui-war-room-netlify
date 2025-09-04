# Environment Variables Configuration Guide

## Overview

This document provides comprehensive documentation for all environment variables used in the War Room platform. Environment variables are used to configure the application for different deployment environments, secure sensitive information, and enable/disable features.

## Table of Contents

- [Configuration Principles](#configuration-principles)
- [Environment Files](#environment-files)
- [Core Application Variables](#core-application-variables)
- [Database Configuration](#database-configuration)
- [Authentication & Security](#authentication--security)
- [External API Integrations](#external-api-integrations)
- [Monitoring & Analytics](#monitoring--analytics)
- [Feature Flags](#feature-flags)
- [Performance Configuration](#performance-configuration)
- [Development Variables](#development-variables)
- [Deployment-Specific Variables](#deployment-specific-variables)
- [Validation & Testing](#validation--testing)
- [Security Considerations](#security-considerations)

## Configuration Principles

### Environment Separation
- **Development**: Local development with mock services and debug features
- **Staging**: Production-like environment for testing and validation
- **Production**: Live environment with real external services and security hardening

### Security Best Practices
- Never commit sensitive values to version control
- Use secure secret management for production
- Rotate API keys and secrets regularly
- Implement least-privilege access principles

### Naming Conventions
- Use UPPER_CASE with underscores for environment variables
- Prefix related variables (e.g., `DATABASE_`, `REDIS_`, `META_`)
- Use descriptive names that indicate purpose and scope

## Environment Files

### Frontend Environment Files

#### Production Frontend (.env.production)
```env
# Application Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
REACT_APP_BUILD_DATE=2025-08-08

# API Configuration
REACT_APP_API_BASE_URL=https://war-room-oa9t.onrender.com/api/v1
REACT_APP_WS_BASE_URL=wss://war-room-oa9t.onrender.com/ws
REACT_APP_DEFAULT_ORG_ID=default

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# External Services
REACT_APP_POSTHOG_KEY=phc_your_posthog_key_here
REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CRISIS_MONITORING=true
REACT_APP_ENABLE_SUB_AGENTS=true
REACT_APP_ENABLE_DEBUG_TOOLS=false
```

#### Development Frontend (.env.local)
```env
# Development Overrides
REACT_APP_ENVIRONMENT=development
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_WS_BASE_URL=ws://localhost:8000/ws

# Debug Features
REACT_APP_ENABLE_DEBUG_TOOLS=true
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_DISABLE_AUTH=false

# Development-specific keys (use test keys)
REACT_APP_POSTHOG_KEY=phc_test_key
REACT_APP_SENTRY_DSN=test_dsn
```

### Backend Environment Files

#### Production Backend (.env)
```env
# Render.com Configuration
RENDER_ENV=production
PYTHON_VERSION=3.11
NODE_VERSION=20.11.1

# Application Settings
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=production
API_VERSION=v1

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/warroom
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DB_ECHO=false

# Redis Configuration
REDIS_URL=redis://host:6379/0
REDIS_CACHE_TTL=300
REDIS_MAX_CONNECTIONS=20
REDIS_CONNECTION_TIMEOUT=5

# Security Configuration
SECRET_KEY=your-256-bit-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS Configuration
ALLOWED_ORIGINS=["https://war-room-oa9t.onrender.com"]
ALLOW_CREDENTIALS=true
ALLOWED_METHODS=["GET","POST","PUT","DELETE","OPTIONS"]
ALLOWED_HEADERS=["*"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_BURST=20
RATE_LIMIT_STORAGE=redis

# WebSocket Configuration
WS_MAX_CONNECTIONS=1000
WS_PING_INTERVAL=25
WS_PING_TIMEOUT=5
```

#### Development Backend (.env.local)
```env
# Development Overrides
DEBUG=true
LOG_LEVEL=DEBUG
ENVIRONMENT=development

# Local Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/warroom_dev
REDIS_URL=redis://localhost:6379/0

# Relaxed Security for Development
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Mock Services
USE_MOCK_APIS=true
ENABLE_DEBUG_LOGGING=true
DISABLE_RATE_LIMITING=true
```

## Core Application Variables

### Application Configuration

#### RENDER_ENV
- **Description**: Deployment environment identifier
- **Values**: `production`, `staging`, `development`
- **Required**: Yes (Render.com)
- **Default**: None
- **Example**: `RENDER_ENV=production`

#### PYTHON_VERSION
- **Description**: Python runtime version for Render.com
- **Values**: `3.11`, `3.10`, `3.9`
- **Required**: Yes (Render.com)
- **Default**: `3.11`
- **Example**: `PYTHON_VERSION=3.11`

#### NODE_VERSION
- **Description**: Node.js runtime version for frontend build
- **Values**: `20.11.1`, `18.18.2`, `16.20.2`
- **Required**: Yes (Render.com)
- **Default**: `20.11.1`
- **Example**: `NODE_VERSION=20.11.1`

#### DEBUG
- **Description**: Enable/disable debug mode
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `false`
- **Example**: `DEBUG=false`

#### LOG_LEVEL
- **Description**: Logging verbosity level
- **Values**: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Required**: No
- **Default**: `INFO`
- **Example**: `LOG_LEVEL=INFO`

#### API_VERSION
- **Description**: API version identifier
- **Values**: `v1`, `v2`
- **Required**: No
- **Default**: `v1`
- **Example**: `API_VERSION=v1`

## Database Configuration

### PostgreSQL Configuration

#### DATABASE_URL
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://user:password@host:port/database`
- **Required**: Yes
- **Security**: High (contains credentials)
- **Example**: `DATABASE_URL=postgresql://user:pass@localhost:5432/warroom`

#### DB_POOL_SIZE
- **Description**: Connection pool size
- **Values**: Integer (recommended: 5-20)
- **Required**: No
- **Default**: `10`
- **Example**: `DB_POOL_SIZE=10`

#### DB_MAX_OVERFLOW
- **Description**: Maximum pool overflow connections
- **Values**: Integer (recommended: 10-50)
- **Required**: No
- **Default**: `20`
- **Example**: `DB_MAX_OVERFLOW=20`

#### DB_POOL_TIMEOUT
- **Description**: Connection pool timeout in seconds
- **Values**: Integer (recommended: 10-60)
- **Required**: No
- **Default**: `30`
- **Example**: `DB_POOL_TIMEOUT=30`

#### DB_POOL_RECYCLE
- **Description**: Connection recycle time in seconds
- **Values**: Integer (recommended: 1800-7200)
- **Required**: No
- **Default**: `3600`
- **Example**: `DB_POOL_RECYCLE=3600`

#### DB_ECHO
- **Description**: Enable SQL query logging
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `false`
- **Example**: `DB_ECHO=false`

### Redis Configuration

#### REDIS_URL
- **Description**: Redis connection string
- **Format**: `redis://host:port/database`
- **Required**: Yes
- **Security**: Medium
- **Example**: `REDIS_URL=redis://localhost:6379/0`

#### REDIS_CACHE_TTL
- **Description**: Default cache time-to-live in seconds
- **Values**: Integer (recommended: 60-3600)
- **Required**: No
- **Default**: `300`
- **Example**: `REDIS_CACHE_TTL=300`

#### REDIS_MAX_CONNECTIONS
- **Description**: Maximum Redis connections
- **Values**: Integer (recommended: 10-50)
- **Required**: No
- **Default**: `20`
- **Example**: `REDIS_MAX_CONNECTIONS=20`

#### REDIS_CONNECTION_TIMEOUT
- **Description**: Redis connection timeout in seconds
- **Values**: Integer (recommended: 2-10)
- **Required**: No
- **Default**: `5`
- **Example**: `REDIS_CONNECTION_TIMEOUT=5`

## Authentication & Security

### JWT Configuration

#### SECRET_KEY
- **Description**: Application secret key for cryptographic operations
- **Format**: 256-bit random string
- **Required**: Yes
- **Security**: Critical
- **Example**: `SECRET_KEY=your-256-bit-secret-key-here`
- **Generation**: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

#### JWT_SECRET
- **Description**: JSON Web Token signing secret
- **Format**: 256-bit random string (can be same as SECRET_KEY)
- **Required**: Yes
- **Security**: Critical
- **Example**: `JWT_SECRET=your-jwt-secret-key-here`

#### JWT_ALGORITHM
- **Description**: JWT signing algorithm
- **Values**: `HS256`, `RS256`, `ES256`
- **Required**: No
- **Default**: `HS256`
- **Example**: `JWT_ALGORITHM=HS256`

#### JWT_ACCESS_TOKEN_EXPIRE_MINUTES
- **Description**: Access token lifetime in minutes
- **Values**: Integer (recommended: 15-120)
- **Required**: No
- **Default**: `60`
- **Example**: `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60`

#### JWT_REFRESH_TOKEN_EXPIRE_DAYS
- **Description**: Refresh token lifetime in days
- **Values**: Integer (recommended: 7-90)
- **Required**: No
- **Default**: `30`
- **Example**: `JWT_REFRESH_TOKEN_EXPIRE_DAYS=30`

### Supabase Configuration

#### SUPABASE_URL
- **Description**: Supabase project URL
- **Format**: `https://your-project-id.supabase.co`
- **Required**: Yes
- **Security**: Low (public URL)
- **Example**: `SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co`

#### SUPABASE_ANON_KEY
- **Description**: Supabase anonymous/public key
- **Format**: JWT token string
- **Required**: Yes (Frontend)
- **Security**: Low (public key)
- **Example**: `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### SUPABASE_SERVICE_KEY
- **Description**: Supabase service role key (full access)
- **Format**: JWT token string
- **Required**: Yes (Backend)
- **Security**: Critical
- **Example**: `SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### CORS Configuration

#### ALLOWED_ORIGINS
- **Description**: Allowed CORS origins (JSON array)
- **Format**: `["url1","url2"]`
- **Required**: Yes
- **Security**: Medium
- **Example**: `ALLOWED_ORIGINS=["https://war-room-oa9t.onrender.com"]`

#### ALLOW_CREDENTIALS
- **Description**: Allow credentials in CORS requests
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ALLOW_CREDENTIALS=true`

## External API Integrations

### OpenAI Configuration

#### OPENAI_API_KEY
- **Description**: OpenAI API key for AI features
- **Format**: `sk-...` string
- **Required**: Yes (if AI features enabled)
- **Security**: High
- **Example**: `OPENAI_API_KEY=sk-your-openai-api-key-here`

#### OPENAI_MODEL_EMBEDDING
- **Description**: Default embedding model
- **Values**: `text-embedding-ada-002`, `text-embedding-3-small`
- **Required**: No
- **Default**: `text-embedding-ada-002`
- **Example**: `OPENAI_MODEL_EMBEDDING=text-embedding-ada-002`

#### OPENAI_MODEL_CHAT
- **Description**: Default chat completion model
- **Values**: `gpt-4-turbo-preview`, `gpt-3.5-turbo`, `gpt-4`
- **Required**: No
- **Default**: `gpt-4-turbo-preview`
- **Example**: `OPENAI_MODEL_CHAT=gpt-4-turbo-preview`

#### OPENAI_MAX_TOKENS
- **Description**: Maximum tokens per request
- **Values**: Integer (recommended: 1000-8000)
- **Required**: No
- **Default**: `4000`
- **Example**: `OPENAI_MAX_TOKENS=4000`

#### OPENAI_TEMPERATURE
- **Description**: Model temperature (creativity/randomness)
- **Values**: Float 0.0-2.0 (recommended: 0.0-0.3)
- **Required**: No
- **Default**: `0.1`
- **Example**: `OPENAI_TEMPERATURE=0.1`

### Pinecone Configuration

#### PINECONE_API_KEY
- **Description**: Pinecone API key for vector database
- **Format**: Alphanumeric string
- **Required**: Yes (if vector features enabled)
- **Security**: High
- **Example**: `PINECONE_API_KEY=your-pinecone-api-key-here`

#### PINECONE_ENVIRONMENT
- **Description**: Pinecone environment/region
- **Values**: `us-east-1`, `us-west-2`, `eu-west-1`, etc.
- **Required**: Yes (if Pinecone enabled)
- **Security**: Low
- **Example**: `PINECONE_ENVIRONMENT=us-east-1`

#### PINECONE_INDEX_NAME
- **Description**: Pinecone index name for documents
- **Format**: Lowercase alphanumeric with hyphens
- **Required**: Yes (if Pinecone enabled)
- **Security**: Low
- **Example**: `PINECONE_INDEX_NAME=warroom-documents`

#### PINECONE_NAMESPACE
- **Description**: Pinecone namespace for multi-tenancy
- **Format**: String (environment-specific)
- **Required**: No
- **Default**: `default`
- **Example**: `PINECONE_NAMESPACE=production`

### Meta Business API Configuration

#### META_APP_ID
- **Description**: Meta/Facebook App ID
- **Format**: Numeric string
- **Required**: Yes (if Meta integration enabled)
- **Security**: Medium
- **Example**: `META_APP_ID=1234567890123456`

#### META_APP_SECRET
- **Description**: Meta/Facebook App Secret
- **Format**: Alphanumeric string
- **Required**: Yes (if Meta integration enabled)
- **Security**: Critical
- **Example**: `META_APP_SECRET=your-meta-app-secret-here`

#### META_BUSINESS_ACCOUNT_ID
- **Description**: Meta Business Account ID
- **Format**: Numeric string (act_)
- **Required**: Yes (if Meta ads enabled)
- **Security**: Medium
- **Example**: `META_BUSINESS_ACCOUNT_ID=act_1234567890`

#### META_ACCESS_TOKEN
- **Description**: Long-lived Meta access token
- **Format**: Long string
- **Required**: Yes (if Meta integration enabled)
- **Security**: High
- **Example**: `META_ACCESS_TOKEN=your-long-lived-access-token`

### Google Ads API Configuration

#### GOOGLE_ADS_DEVELOPER_TOKEN
- **Description**: Google Ads API developer token
- **Format**: Alphanumeric string
- **Required**: Yes (if Google Ads enabled)
- **Security**: High
- **Example**: `GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token`

#### GOOGLE_ADS_CLIENT_ID
- **Description**: OAuth 2.0 client ID
- **Format**: String ending in .googleusercontent.com
- **Required**: Yes (if Google Ads enabled)
- **Security**: Medium
- **Example**: `GOOGLE_ADS_CLIENT_ID=your-client-id.googleusercontent.com`

#### GOOGLE_ADS_CLIENT_SECRET
- **Description**: OAuth 2.0 client secret
- **Format**: Alphanumeric string
- **Required**: Yes (if Google Ads enabled)
- **Security**: Critical
- **Example**: `GOOGLE_ADS_CLIENT_SECRET=your-client-secret`

#### GOOGLE_ADS_REFRESH_TOKEN
- **Description**: OAuth 2.0 refresh token
- **Format**: Long alphanumeric string
- **Required**: Yes (if Google Ads enabled)
- **Security**: High
- **Example**: `GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token`

## Monitoring & Analytics

### Sentry Configuration

#### SENTRY_DSN
- **Description**: Sentry Data Source Name for error tracking
- **Format**: `https://public@sentry.io/project-id`
- **Required**: No (recommended for production)
- **Security**: Medium
- **Example**: `SENTRY_DSN=https://your-dsn@sentry.io/project-id`

#### SENTRY_ENVIRONMENT
- **Description**: Environment name for Sentry
- **Values**: `production`, `staging`, `development`
- **Required**: No
- **Default**: Uses RENDER_ENV or ENVIRONMENT
- **Example**: `SENTRY_ENVIRONMENT=production`

#### SENTRY_RELEASE
- **Description**: Release version for Sentry
- **Format**: Version string (e.g., v1.0.0)
- **Required**: No
- **Default**: Uses git commit hash
- **Example**: `SENTRY_RELEASE=v1.0.0`

#### SENTRY_SAMPLE_RATE
- **Description**: Error sampling rate (0.0-1.0)
- **Values**: Float (recommended: 0.1-1.0)
- **Required**: No
- **Default**: `1.0`
- **Example**: `SENTRY_SAMPLE_RATE=1.0`

### PostHog Configuration

#### POSTHOG_API_KEY
- **Description**: PostHog API key for analytics
- **Format**: `phc_` prefixed string
- **Required**: No (recommended for analytics)
- **Security**: Medium
- **Example**: `POSTHOG_API_KEY=phc_your_posthog_key_here`

#### POSTHOG_HOST
- **Description**: PostHog instance URL
- **Format**: HTTPS URL
- **Required**: No
- **Default**: `https://app.posthog.com`
- **Example**: `POSTHOG_HOST=https://app.posthog.com`

#### POSTHOG_FEATURE_FLAGS
- **Description**: Enable PostHog feature flags
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `POSTHOG_FEATURE_FLAGS=true`

### LangChain Configuration

#### LANGCHAIN_TRACING_V2
- **Description**: Enable LangChain tracing
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `false`
- **Example**: `LANGCHAIN_TRACING_V2=true`

#### LANGCHAIN_API_KEY
- **Description**: LangChain API key for tracing
- **Format**: Alphanumeric string
- **Required**: No (if tracing enabled)
- **Security**: Medium
- **Example**: `LANGCHAIN_API_KEY=your-langchain-api-key`

#### LANGCHAIN_PROJECT
- **Description**: LangChain project name
- **Format**: String (environment-specific)
- **Required**: No
- **Default**: `war-room-default`
- **Example**: `LANGCHAIN_PROJECT=war-room-production`

## Feature Flags

### Core Feature Flags

#### ENABLE_ADVANCED_ANALYTICS
- **Description**: Enable advanced analytics features
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_ADVANCED_ANALYTICS=true`

#### ENABLE_EXPORT_FEATURES
- **Description**: Enable data export functionality
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_EXPORT_FEATURES=true`

#### ENABLE_CRISIS_DETECTION
- **Description**: Enable crisis monitoring and detection
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_CRISIS_DETECTION=true`

#### ENABLE_PERFORMANCE_MONITORING
- **Description**: Enable performance monitoring
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_PERFORMANCE_MONITORING=true`

### Integration Feature Flags

#### ENABLE_META_INTEGRATION
- **Description**: Enable Meta/Facebook API integration
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_META_INTEGRATION=true`

#### ENABLE_GOOGLE_ADS_INTEGRATION
- **Description**: Enable Google Ads API integration
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_GOOGLE_ADS_INTEGRATION=true`

#### ENABLE_EMAIL_AUTOMATION
- **Description**: Enable email automation features
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_EMAIL_AUTOMATION=true`

#### ENABLE_SMS_INTEGRATION
- **Description**: Enable SMS messaging integration
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `false`
- **Example**: `ENABLE_SMS_INTEGRATION=false`

### AI/ML Feature Flags

#### ENABLE_DOCUMENT_INTELLIGENCE
- **Description**: Enable AI document processing
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_DOCUMENT_INTELLIGENCE=true`

#### ENABLE_SEMANTIC_SEARCH
- **Description**: Enable vector-based semantic search
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_SEMANTIC_SEARCH=true`

#### ENABLE_SENTIMENT_ANALYSIS
- **Description**: Enable sentiment analysis features
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_SENTIMENT_ANALYSIS=true`

### Sub-Agent Feature Flags

#### ENABLE_SUB_AGENTS
- **Description**: Enable sub-agent system
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_SUB_AGENTS=true`

#### ENABLE_AUTOMATED_REFACTORING
- **Description**: Enable AMP refactoring specialist agent
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_AUTOMATED_REFACTORING=true`

#### ENABLE_CODE_REVIEW_AUTOMATION
- **Description**: Enable CodeRabbit integration agent
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_CODE_REVIEW_AUTOMATION=true`

#### ENABLE_KNOWLEDGE_MANAGEMENT
- **Description**: Enable Pieces knowledge manager agent
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_KNOWLEDGE_MANAGEMENT=true`

#### ENABLE_HEALTH_MONITORING_AGENT
- **Description**: Enable enhanced health monitoring agent
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_HEALTH_MONITORING_AGENT=true`

#### ENABLE_DOCUMENTATION_AGENT
- **Description**: Enable documentation management agent
- **Values**: `true`, `false`
- **Required**: No
- **Default**: `true`
- **Example**: `ENABLE_DOCUMENTATION_AGENT=true`

## Performance Configuration

### Rate Limiting Configuration

#### RATE_LIMIT_PER_MINUTE
- **Description**: Requests per minute per user
- **Values**: Integer (recommended: 60-500)
- **Required**: No
- **Default**: `100`
- **Example**: `RATE_LIMIT_PER_MINUTE=100`

#### RATE_LIMIT_BURST
- **Description**: Burst allowance for rate limiting
- **Values**: Integer (recommended: 10-50)
- **Required**: No
- **Default**: `20`
- **Example**: `RATE_LIMIT_BURST=20`

#### RATE_LIMIT_STORAGE
- **Description**: Storage backend for rate limiting
- **Values**: `redis`, `memory`
- **Required**: No
- **Default**: `redis`
- **Example**: `RATE_LIMIT_STORAGE=redis`

### WebSocket Configuration

#### WS_MAX_CONNECTIONS
- **Description**: Maximum WebSocket connections
- **Values**: Integer (recommended: 100-5000)
- **Required**: No
- **Default**: `1000`
- **Example**: `WS_MAX_CONNECTIONS=1000`

#### WS_PING_INTERVAL
- **Description**: WebSocket ping interval in seconds
- **Values**: Integer (recommended: 15-60)
- **Required**: No
- **Default**: `25`
- **Example**: `WS_PING_INTERVAL=25`

#### WS_PING_TIMEOUT
- **Description**: WebSocket ping timeout in seconds
- **Values**: Integer (recommended: 3-15)
- **Required**: No
- **Default**: `5`
- **Example**: `WS_PING_TIMEOUT=5`

## Development Variables

### Development-Only Configuration

#### USE_MOCK_APIS
- **Description**: Use mock APIs instead of real services
- **Values**: `true`, `false`
- **Required**: No (development only)
- **Default**: `false`
- **Example**: `USE_MOCK_APIS=true`

#### ENABLE_DEBUG_LOGGING
- **Description**: Enable verbose debug logging
- **Values**: `true`, `false`
- **Required**: No (development only)
- **Default**: `false`
- **Example**: `ENABLE_DEBUG_LOGGING=true`

#### DISABLE_RATE_LIMITING
- **Description**: Disable rate limiting for development
- **Values**: `true`, `false`
- **Required**: No (development only)
- **Default**: `false`
- **Example**: `DISABLE_RATE_LIMITING=true`

#### ENABLE_API_PLAYGROUND
- **Description**: Enable API playground interface
- **Values**: `true`, `false`
- **Required**: No (development only)
- **Default**: `false`
- **Example**: `ENABLE_API_PLAYGROUND=true`

### Testing Configuration

#### TEST_DATABASE_URL
- **Description**: Test database connection string
- **Format**: PostgreSQL connection string
- **Required**: No (testing only)
- **Security**: Low (test data only)
- **Example**: `TEST_DATABASE_URL=postgresql://test:test@localhost:5432/warroom_test`

#### TEST_REDIS_URL
- **Description**: Test Redis connection string
- **Format**: Redis connection string
- **Required**: No (testing only)
- **Security**: Low
- **Example**: `TEST_REDIS_URL=redis://localhost:6379/1`

#### SKIP_INTEGRATION_TESTS
- **Description**: Skip integration tests requiring external services
- **Values**: `true`, `false`
- **Required**: No (testing only)
- **Default**: `false`
- **Example**: `SKIP_INTEGRATION_TESTS=true`

## Deployment-Specific Variables

### Render.com Specific

#### RENDER_SERVICE_NAME
- **Description**: Render service name (auto-set)
- **Format**: String
- **Required**: No (auto-generated)
- **Security**: Low
- **Example**: `RENDER_SERVICE_NAME=war-room-fullstack`

#### RENDER_GIT_COMMIT
- **Description**: Git commit hash (auto-set)
- **Format**: Git commit hash
- **Required**: No (auto-generated)
- **Security**: Low
- **Example**: `RENDER_GIT_COMMIT=a1b2c3d4e5f6`

#### RENDER_GIT_BRANCH
- **Description**: Git branch name (auto-set)
- **Format**: Git branch name
- **Required**: No (auto-generated)
- **Security**: Low
- **Example**: `RENDER_GIT_BRANCH=main`

### Health Check Configuration

#### HEALTH_CHECK_PATH
- **Description**: Health check endpoint path
- **Format**: URL path
- **Required**: No
- **Default**: `/health`
- **Example**: `HEALTH_CHECK_PATH=/health`

#### HEALTH_CHECK_INTERVAL
- **Description**: Health check interval in seconds
- **Values**: Integer (recommended: 10-120)
- **Required**: No
- **Default**: `30`
- **Example**: `HEALTH_CHECK_INTERVAL=30`

#### HEALTH_CHECK_TIMEOUT
- **Description**: Health check timeout in seconds
- **Values**: Integer (recommended: 3-30)
- **Required**: No
- **Default**: `5`
- **Example**: `HEALTH_CHECK_TIMEOUT=5`

## Validation & Testing

### Environment Variable Validation Script

```python
#!/usr/bin/env python3
"""
Environment variable validation script for War Room platform.
"""

import os
import sys
from typing import Dict, List, Optional, Union

class EnvValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        
    def check_required(self, var_name: str, description: str = "") -> Optional[str]:
        """Check if required environment variable is set."""
        value = os.getenv(var_name)
        if not value:
            self.errors.append(f"Required variable {var_name} is not set. {description}")
            return None
        return value
    
    def check_url_format(self, var_name: str, value: str) -> bool:
        """Validate URL format."""
        if not value.startswith(('http://', 'https://')):
            self.errors.append(f"{var_name} must start with http:// or https://")
            return False
        return True
    
    def check_integer_range(self, var_name: str, value: str, min_val: int, max_val: int) -> bool:
        """Validate integer is within range."""
        try:
            int_val = int(value)
            if not (min_val <= int_val <= max_val):
                self.errors.append(f"{var_name} must be between {min_val} and {max_val}")
                return False
        except ValueError:
            self.errors.append(f"{var_name} must be a valid integer")
            return False
        return True
    
    def validate_production_env(self) -> bool:
        """Validate production environment variables."""
        print("🔍 Validating production environment variables...")
        
        # Core application variables
        self.check_required("RENDER_ENV", "Must be 'production' for production deployment")
        self.check_required("PYTHON_VERSION", "Python runtime version (e.g., '3.11')")
        self.check_required("NODE_VERSION", "Node.js runtime version (e.g., '20.11.1')")
        
        # Database configuration
        db_url = self.check_required("DATABASE_URL", "PostgreSQL connection string")
        if db_url and not db_url.startswith("postgresql://"):
            self.errors.append("DATABASE_URL must start with postgresql://")
        
        # Redis configuration
        redis_url = self.check_required("REDIS_URL", "Redis connection string")
        if redis_url and not redis_url.startswith("redis://"):
            self.errors.append("REDIS_URL must start with redis://")
        
        # Security configuration
        secret_key = self.check_required("SECRET_KEY", "Application secret key (256-bit)")
        if secret_key and len(secret_key) < 32:
            self.warnings.append("SECRET_KEY should be at least 32 characters long")
        
        jwt_secret = self.check_required("JWT_SECRET", "JWT signing secret")
        if jwt_secret and len(jwt_secret) < 32:
            self.warnings.append("JWT_SECRET should be at least 32 characters long")
        
        # Supabase configuration
        supabase_url = self.check_required("SUPABASE_URL", "Supabase project URL")
        if supabase_url:
            self.check_url_format("SUPABASE_URL", supabase_url)
        
        self.check_required("SUPABASE_SERVICE_KEY", "Supabase service role key")
        
        # Optional but recommended
        sentry_dsn = os.getenv("SENTRY_DSN")
        if not sentry_dsn:
            self.warnings.append("SENTRY_DSN not set - error tracking disabled")
        
        # Performance configuration validation
        rate_limit = os.getenv("RATE_LIMIT_PER_MINUTE", "100")
        self.check_integer_range("RATE_LIMIT_PER_MINUTE", rate_limit, 10, 1000)
        
        return len(self.errors) == 0
    
    def validate_development_env(self) -> bool:
        """Validate development environment variables."""
        print("🔍 Validating development environment variables...")
        
        # Development can be more relaxed
        db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/warroom_dev")
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        # Check if using local development services
        if "localhost" in db_url:
            self.warnings.append("Using localhost database - ensure PostgreSQL is running")
        
        if "localhost" in redis_url:
            self.warnings.append("Using localhost Redis - ensure Redis is running")
        
        return True
    
    def print_results(self):
        """Print validation results."""
        if self.errors:
            print("\n❌ Environment Variable Errors:")
            for error in self.errors:
                print(f"  • {error}")
        
        if self.warnings:
            print("\n⚠️  Environment Variable Warnings:")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        if not self.errors and not self.warnings:
            print("\n✅ All environment variables are properly configured!")
        
        return len(self.errors) == 0

def main():
    """Main validation function."""
    validator = EnvValidator()
    
    environment = os.getenv("RENDER_ENV", os.getenv("ENVIRONMENT", "development"))
    
    if environment == "production":
        success = validator.validate_production_env()
    else:
        success = validator.validate_development_env()
    
    validator.print_results()
    
    if not success:
        print(f"\n💥 Environment validation failed! Fix the errors above.")
        sys.exit(1)
    else:
        print(f"\n🎉 Environment validation successful for {environment} environment!")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

### Usage Example

```bash
# Save the validation script
# Make it executable
chmod +x validate_env.py

# Run validation
python validate_env.py

# Or as part of deployment
./scripts/validate-environment.sh
```

### Environment Testing Checklist

#### Pre-Deployment Validation
- [ ] All required variables are set and non-empty
- [ ] Database connection string is valid and accessible
- [ ] Redis connection string is valid and accessible
- [ ] External API keys are valid and have proper permissions
- [ ] URL formats are correct (http/https)
- [ ] Integer values are within acceptable ranges
- [ ] Secret keys are sufficiently long and random
- [ ] CORS origins match deployment URLs

#### Post-Deployment Validation
- [ ] Health check endpoint returns 200 OK
- [ ] Database connectivity confirmed
- [ ] Redis connectivity confirmed
- [ ] External API integrations working
- [ ] Authentication flow functional
- [ ] WebSocket connections established
- [ ] Rate limiting active
- [ ] Error tracking operational
- [ ] Analytics data flowing

## Security Considerations

### Secret Management Best Practices

#### Never Commit Secrets
- Use `.env.example` files with placeholder values
- Add actual `.env` files to `.gitignore`
- Use secure secret management services in production
- Rotate secrets regularly (quarterly or after incidents)

#### Environment-Specific Security

##### Development
- Use test/development keys where possible
- Keep secrets separate from production
- Use local services to minimize external dependencies

##### Production
- Use managed secret services (Render environment variables)
- Enable secret rotation
- Monitor for secret leakage in logs/errors
- Use least-privilege principles for API keys

### Access Control

#### API Key Permissions
- Meta API: Limit to specific ad account permissions
- Google Ads: Use read-only keys where possible
- OpenAI: Set usage limits and monitor consumption
- Database: Use application-specific user accounts

#### Secret Rotation Schedule
- **Weekly**: Development and staging secrets
- **Monthly**: Production API keys (if supported)
- **Quarterly**: Database credentials and master secrets
- **Immediately**: After any suspected compromise

### Monitoring & Auditing

#### Secret Usage Monitoring
- Track API key usage patterns
- Monitor for unusual access patterns
- Set up alerts for authentication failures
- Log secret rotation events

#### Security Incident Response
1. **Immediate**: Rotate compromised secrets
2. **Assessment**: Determine scope of potential access
3. **Notification**: Inform relevant stakeholders
4. **Investigation**: Analyze logs for unauthorized access
5. **Prevention**: Update security measures to prevent recurrence

---

## Conclusion

This comprehensive environment variables guide ensures proper configuration of the War Room platform across all deployment environments. Regular validation and security practices help maintain a secure and reliable deployment.

For additional support or questions about environment configuration, please refer to the [Deployment Guide](./DEPLOYMENT.md) or contact the development team.

---

*Environment Variables Guide v1.0 | Last Updated: August 2025 | For War Room Platform*