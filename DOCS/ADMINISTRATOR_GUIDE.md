# War Room Administrator Guide

## Table of Contents

1. [System Overview](#system-overview)
2. [Production Deployment](#production-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Database Management](#database-management)
5. [Security & Hardening](#security--hardening)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance Procedures](#maintenance-procedures)
10. [Scaling & Performance](#scaling--performance)

---

## System Overview

### Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│   React + Vite  │◄──►│   FastAPI        │◄──►│   PostgreSQL    │
│   (Static)      │    │   Python 3.11    │    │   (Supabase)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CDN           │    │   Redis Cache    │    │   File Storage  │
│   (Render)      │    │   (Upstash)      │    │   (Future: S3)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 4.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Redux Toolkit
- **Testing**: Jest + React Testing Library

#### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11
- **ORM**: SQLAlchemy 2.x + SQLModel
- **Authentication**: JWT with httpOnly cookies
- **Validation**: Pydantic v2

#### Infrastructure
- **Hosting**: Render.com (unified deployment)
- **Database**: PostgreSQL 15+ (Supabase managed)
- **Cache**: Redis (Upstash managed)
- **CDN**: Render's integrated CDN
- **Monitoring**: Built-in + Sentry integration

### Current Production Status

- **URL**: https://war-room-oa9t.onrender.com
- **Status**: Live in production
- **Uptime**: 99.9% target
- **Response Time**: <3s target (current: ~185ms avg)
- **Security**: Hardened with recent security fixes
- **Coverage**: 48% test coverage (growing)

---

## Production Deployment

### Deployment Architecture

The application uses a unified deployment model on Render.com:

#### Service Configuration
```yaml
# render.yaml (in root directory)
services:
  - type: web
    name: war-room-fullstack
    runtime: python
    buildCommand: cd src/frontend && npm install && npm run build
    startCommand: cd src/backend && python serve_bulletproof.py
    envVars:
      - key: PYTHON_VERSION
        value: '3.11'
      - key: NODE_VERSION
        value: '20.11.1'
```

#### Build Process Flow
1. **Frontend Build**: 
   - `cd src/frontend && npm install`
   - `npm run build` (creates `dist/` folder)
   
2. **Backend Startup**: 
   - `cd src/backend`
   - `python serve_bulletproof.py` (serves both API and static files)

3. **Health Verification**: 
   - `/health` endpoint validation
   - Database connectivity check
   - Redis cache verification

### Deployment Methods

#### 1. Git-Based Deployment (Recommended)
```bash
# Trigger deployment by pushing to main branch
git add .
git commit -m "Deploy updates"
git push origin main

# Render automatically deploys from GitHub webhook
```

#### 2. Manual Deployment via Render Dashboard
1. Navigate to Render Dashboard
2. Select "war-room-fullstack" service
3. Click "Manual Deploy" → "Deploy Latest Commit"

#### 3. Rollback Procedures
```bash
# Via Render Dashboard:
# 1. Go to Deployments tab
# 2. Select previous successful deployment
# 3. Click "Redeploy"

# Via Git (emergency rollback):
git revert HEAD~1
git push origin main
```

### Deployment Scripts

#### Pre-Deployment Validation
```bash
# Run before any deployment
./scripts/test-deployment-readiness.sh

# Includes:
# - Frontend build test
# - Backend startup verification
# - Database migration check
# - Environment variable validation
```

#### Post-Deployment Verification
```bash
# Verify deployment success
./scripts/validate-render-deployment-simple.sh

# Monitors:
# - Health endpoint response
# - API functionality
# - Frontend loading
# - Database connectivity
```

---

## Environment Configuration

### Required Environment Variables

#### Core Application
```bash
# Security
SECRET_KEY=your-256-bit-secret-key
JWT_SECRET=same-as-secret-key-for-backward-compatibility
JWT_ALGORITHM=HS256
CSRF_SECRET_KEY=separate-csrf-key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/warroom
SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# Cache
REDIS_URL=redis://default:password@host:port

# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

#### External Services
```bash
# AI Services
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=warroom-documents

# Analytics & Monitoring
POSTHOG_KEY=phc_your-posthog-key
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Communication Services
SENDGRID_API_KEY=SG.your-sendgrid-key
TWILIO_ACCOUNT_SID=AC-your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

#### Feature Flags
```bash
# Analytics Features
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_EXPORT_FEATURES=true
ENABLE_REAL_TIME_METRICS=true

# Integration Features
ENABLE_META_INTEGRATION=true
ENABLE_GOOGLE_ADS_INTEGRATION=true
ENABLE_DOCUMENT_INTELLIGENCE=true

# Security Features
ENABLE_RATE_LIMITING=true
ENABLE_CSRF_PROTECTION=true
ENABLE_REQUEST_TIMEOUTS=true
```

### Configuration Validation

#### Environment Check Script
```python
# src/backend/scripts/validate_config.py
import os
from core.config import settings

def validate_production_config():
    """Validate all required environment variables are set"""
    required_vars = [
        'DATABASE_URL', 'REDIS_URL', 'SECRET_KEY',
        'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        raise ValueError(f"Missing required environment variables: {missing}")
    
    print("✅ All required environment variables are set")

if __name__ == "__main__":
    validate_production_config()
```

#### Security Configuration Checklist
- [ ] **SECRET_KEY**: 256-bit random key, never reused
- [ ] **Database credentials**: Strong passwords, limited access
- [ ] **API keys**: Rotated regularly, stored securely
- [ ] **CORS origins**: Limited to production domains
- [ ] **Debug mode**: Disabled in production
- [ ] **Error reporting**: Sensitive data sanitized

---

## Database Management

### Database Architecture

#### PostgreSQL Configuration (Supabase)
- **Version**: PostgreSQL 15+
- **Connection Pooling**: PgBouncer (handled by Supabase)
- **Backup**: Daily automated backups
- **Read Replicas**: Available for scaling
- **SSL**: Enforced for all connections

#### Connection Management
```python
# src/backend/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Connection pooling configuration
engine = create_engine(
    DATABASE_URL,
    pool_size=20,           # Base connection pool
    max_overflow=30,        # Additional connections under load
    pool_timeout=30,        # Wait time for connection
    pool_recycle=3600,      # Recycle connections hourly
    pool_pre_ping=True      # Validate connections before use
)
```

### Migration Management

#### Using Alembic for Database Migrations

#### Creating Migrations
```bash
# Navigate to backend directory
cd src/backend

# Create new migration
alembic revision --autogenerate -m "Add user preferences table"

# Review generated migration file before applying
# File location: alembic/versions/xxx_add_user_preferences_table.py
```

#### Applying Migrations
```bash
# Development
alembic upgrade head

# Production (via Render shell)
# 1. Access Render dashboard
# 2. Open shell for war-room-fullstack service
# 3. Run: cd src/backend && alembic upgrade head
```

#### Migration Best Practices
1. **Always review** auto-generated migrations before applying
2. **Test migrations** in development first
3. **Backup database** before major schema changes
4. **Use transactions** for complex migrations
5. **Plan rollback strategy** for each migration

#### Common Migration Commands
```bash
# Check current migration status
alembic current

# View migration history
alembic history

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Apply specific migration
alembic upgrade <revision_id>
```

### Database Monitoring

#### Key Metrics to Monitor
- **Connection Pool Usage**: Should stay below 80%
- **Query Performance**: Slow queries > 1 second
- **Lock Contention**: Long-running locks
- **Cache Hit Ratio**: Should be > 95%
- **Database Size Growth**: Monitor for unusual spikes

#### Query Performance Monitoring
```sql
-- Find slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 1000  -- queries taking > 1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Check connection usage
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Monitor database size
SELECT pg_size_pretty(pg_database_size('warroom')) as database_size;
```

### Backup & Restore Procedures

#### Automated Backups (Supabase)
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days for standard plan
- **Location**: Multiple geographic regions
- **Encryption**: AES-256 encryption at rest

#### Manual Backup
```bash
# Create manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_20240115_140000.sql
```

#### Point-in-Time Recovery
Supabase provides point-in-time recovery for the last 7 days:
1. Access Supabase Dashboard
2. Navigate to Settings → Database
3. Select "Point in time recovery"
4. Choose recovery timestamp
5. Create new database from backup

---

## Security & Hardening

### Recently Implemented Security Measures

#### Authentication Security
- **httpOnly Cookies**: JWT tokens stored in secure cookies
- **CSRF Protection**: All state-changing operations require CSRF token
- **Password Hashing**: bcrypt with salt rounds = 12
- **Session Management**: Automatic logout after inactivity

#### Request Security
- **Rate Limiting**: 100 requests/minute per endpoint
- **Request Timeouts**: Hierarchical timeout system
- **Input Validation**: Comprehensive sanitization
- **Error Sanitization**: Sensitive data removed from responses

#### Network Security
- **HTTPS Enforced**: All communication encrypted
- **HSTS Headers**: HTTP Strict Transport Security enabled
- **CORS Configuration**: Limited to production domains
- **Security Headers**: Content Security Policy, X-Frame-Options

### Security Configuration

#### CORS Configuration
```python
# src/backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://war-room-oa9t.onrender.com",
        "http://localhost:5173"  # Development only
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### Rate Limiting Configuration
```python
# src/backend/core/rate_limiting.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=REDIS_URL
)

# Apply to sensitive endpoints
@limiter.limit("10/minute")
async def login_endpoint():
    pass
```

#### Security Headers
```python
# src/backend/middleware/security.py
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

### Security Monitoring

#### Failed Authentication Attempts
```python
# Monitor and alert on suspicious login activity
async def monitor_failed_logins():
    failed_attempts = await get_failed_login_count(last_hour=True)
    if failed_attempts > 50:  # Threshold
        await send_security_alert(
            "High number of failed login attempts detected"
        )
```

#### Security Audit Logging
```python
# Log all security-relevant events
async def audit_log(user_id: str, action: str, resource: str):
    await create_audit_entry({
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "timestamp": datetime.utcnow(),
        "ip_address": get_client_ip(),
        "user_agent": get_user_agent()
    })
```

### Vulnerability Management

#### Security Scanning
```bash
# Run Semgrep security scan
semgrep --config=auto src/

# Check for dependency vulnerabilities
cd src/frontend && npm audit
cd src/backend && pip-audit
```

#### Security Update Process
1. **Weekly Security Reviews**: Check for new vulnerabilities
2. **Dependency Updates**: Monthly update cycle for non-critical
3. **Emergency Updates**: Immediate for critical security issues
4. **Testing Protocol**: All security updates tested in staging first

---

## Monitoring & Alerting

### Built-in Monitoring System

#### Health Check Endpoints
```bash
# Basic health check
GET /health
Response: {"status": "healthy", "timestamp": "..."}

# Detailed system health
GET /api/v1/monitoring/health
Response: {
  "status": "healthy",
  "services": {
    "database": {"status": "healthy", "response_time": 12},
    "cache": {"status": "healthy", "hit_rate": 89.2},
    "external_apis": {"meta": "healthy", "openai": "degraded"}
  }
}

# Performance metrics
GET /api/v1/monitoring/metrics
Response: {
  "system": {"cpu_usage": 45.2, "memory_usage": 67.8},
  "application": {"active_connections": 125, "avg_response_time": 185}
}
```

#### Automated Health Monitoring
```bash
# Playwright health check script (runs every 5 minutes)
./tests/monitoring/run-health-check.sh

# Monitors:
# - Page loading time
# - API response validation
# - Database connectivity
# - External service availability
```

### External Monitoring Integration

#### Sentry Configuration
```python
# src/backend/core/monitoring.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=SENTRY_DSN,
    environment=ENVIRONMENT,
    traces_sample_rate=0.1,  # 10% of transactions
    integrations=[FastApiIntegration()]
)
```

#### Custom Metrics Collection
```python
# Performance tracking
async def track_response_time(endpoint: str, duration: float):
    await redis_client.lpush(
        f"metrics:response_time:{endpoint}",
        json.dumps({"timestamp": time.time(), "duration": duration})
    )

# Error rate tracking
async def track_error(error_type: str, endpoint: str):
    await redis_client.incr(f"metrics:errors:{error_type}:{endpoint}")
```

### Alert Configuration

#### Alert Types and Thresholds
```python
ALERT_THRESHOLDS = {
    "response_time": {
        "warning": 2.0,    # 2 seconds
        "critical": 5.0    # 5 seconds
    },
    "error_rate": {
        "warning": 0.01,   # 1%
        "critical": 0.05   # 5%
    },
    "memory_usage": {
        "warning": 0.80,   # 80%
        "critical": 0.90   # 90%
    },
    "database_connections": {
        "warning": 40,     # 80% of pool
        "critical": 45     # 90% of pool
    }
}
```

#### Alert Notification Channels
- **Email**: Critical alerts to ops team
- **Slack**: All alerts to #alerts channel
- **SMS**: Critical production issues only
- **PagerDuty**: Escalation for unresolved critical alerts

### Performance Monitoring

#### Key Performance Indicators (KPIs)
- **Uptime**: Target 99.9% (43 minutes downtime/month)
- **Response Time**: Target <3s (current average: 185ms)
- **Error Rate**: Target <1% (current: 0.02%)
- **Cache Hit Rate**: Target >80% (current: 89.2%)

#### Performance Optimization Monitoring
```python
# Database query performance
async def monitor_slow_queries():
    slow_queries = await get_slow_queries(threshold=1.0)  # >1 second
    if slow_queries:
        await log_performance_warning({
            "type": "slow_queries",
            "count": len(slow_queries),
            "queries": slow_queries
        })

# Memory usage tracking
async def monitor_memory_usage():
    memory_usage = psutil.virtual_memory().percent
    if memory_usage > 80:
        await send_performance_alert(f"High memory usage: {memory_usage}%")
```

---

## Backup & Recovery

### Automated Backup Strategy

#### Database Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 
  - Daily backups: 30 days
  - Weekly backups: 12 weeks
  - Monthly backups: 12 months
- **Storage**: Encrypted, geographically distributed
- **Verification**: Automatic backup integrity checks

#### Application Backups
```bash
# Complete application backup script
#!/bin/bash
# scripts/backup.sh

# Database backup
pg_dump $DATABASE_URL > "backups/db_$(date +%Y%m%d_%H%M%S).sql"

# Configuration backup
tar -czf "backups/config_$(date +%Y%m%d_%H%M%S).tar.gz" \
    src/backend/core/config.py \
    src/backend/alembic.ini \
    render.yaml

# User uploaded files (when implemented)
# aws s3 sync s3://war-room-uploads backups/uploads/

# Retention management (keep 30 days)
find backups/ -name "*.sql" -mtime +30 -delete
find backups/ -name "*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery Procedures

#### Recovery Time Objectives (RTO)
- **Database Corruption**: 2 hours
- **Application Failure**: 30 minutes
- **Full System Outage**: 4 hours
- **Data Loss**: Maximum 24 hours (daily backup frequency)

#### Recovery Procedures

#### 1. Database Recovery
```bash
# Scenario: Database corruption or data loss

# Step 1: Identify the latest good backup
ls -la backups/db_*.sql | tail -5

# Step 2: Create new database (if needed)
createdb warroom_recovery

# Step 3: Restore from backup
psql warroom_recovery < backups/db_20240115_020000.sql

# Step 4: Update DATABASE_URL to point to recovered database
# Step 5: Run application health checks
```

#### 2. Application Recovery
```bash
# Scenario: Application deployment failure

# Step 1: Rollback to previous deployment
git log --oneline -10  # Find last good commit
git revert HEAD~1      # Revert problematic commit
git push origin main   # Trigger automatic redeployment

# Step 2: Monitor deployment progress
# Step 3: Verify all services are healthy
./scripts/validate-render-deployment-simple.sh
```

#### 3. Complete System Recovery
```bash
# Scenario: Total system failure (rare)

# Step 1: Deploy to new Render service
# - Create new web service in Render dashboard
# - Connect GitHub repository
# - Configure environment variables
# - Deploy from main branch

# Step 2: Restore database
# - Create new PostgreSQL database
# - Restore from latest backup
# - Update DATABASE_URL in Render

# Step 3: Update DNS (if using custom domain)
# Step 4: Comprehensive system testing
```

### Backup Verification

#### Automated Backup Testing
```python
# scripts/test_backup.py
import subprocess
import tempfile
import os

async def test_database_backup():
    """Test that database backup can be restored successfully"""
    
    # Create temporary database
    temp_db = f"test_restore_{int(time.time())}"
    subprocess.run(["createdb", temp_db])
    
    try:
        # Restore latest backup
        latest_backup = get_latest_backup_file()
        subprocess.run(["psql", temp_db], input=open(latest_backup).read())
        
        # Test basic queries
        result = await test_database_queries(temp_db)
        
        if result["status"] == "success":
            print("✅ Backup restoration test passed")
        else:
            print(f"❌ Backup test failed: {result['error']}")
            
    finally:
        # Cleanup
        subprocess.run(["dropdb", temp_db])
```

---

## Troubleshooting

### Common Issues & Solutions

#### Application Won't Start

**Symptoms**: Service fails to start, 503 errors
**Diagnostic Steps**:
```bash
# Check Render deployment logs
# 1. Access Render dashboard
# 2. Select war-room-fullstack service
# 3. View "Logs" tab for startup errors

# Common issues and fixes:
```

**Issue**: Missing environment variables
```bash
# Solution: Verify all required environment variables
python src/backend/scripts/validate_config.py
```

**Issue**: Database connection failure
```bash
# Solution: Check DATABASE_URL and database accessibility
python -c "
import psycopg2
conn = psycopg2.connect('$DATABASE_URL')
print('Database connection successful')
conn.close()
"
```

**Issue**: Node.js build failure
```bash
# Solution: Check Node.js version and dependencies
cd src/frontend
node --version  # Should be 20.11.1+
npm install
npm run build
```

#### Database Issues

**Issue**: Database connection pool exhausted
**Symptoms**: "Connection pool is exhausted" errors
**Solution**:
```python
# Increase connection pool size in database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=30,      # Increased from 20
    max_overflow=50    # Increased from 30
)
```

**Issue**: Slow database queries
**Diagnostic**:
```sql
-- Find slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;
```

**Solution**:
```sql
-- Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_events_date ON events(event_date);
```

#### Memory Issues

**Issue**: Out of memory errors
**Symptoms**: Application crashes, 502 errors
**Diagnostic**:
```bash
# Check memory usage
free -h
ps aux | grep python | awk '{print $4}' | awk '{sum+=$1} END {print "Total memory usage: " sum "%"}'
```

**Solution**:
```python
# Optimize memory usage in application
# 1. Add pagination to large queries
# 2. Implement result streaming for exports
# 3. Clear unused objects explicitly
# 4. Monitor for memory leaks
```

#### Performance Issues

**Issue**: High response times
**Diagnostic Steps**:
```bash
# Check system resources
curl https://war-room-oa9t.onrender.com/api/v1/monitoring/metrics

# Check database performance
curl https://war-room-oa9t.onrender.com/api/v1/monitoring/health

# Check external service latency
# - Monitor Pinecone response times
# - Check OpenAI API latency
# - Verify Redis cache performance
```

**Solutions**:
1. **Database Optimization**: Add indexes, optimize queries
2. **Caching**: Implement Redis caching for expensive operations
3. **Code Optimization**: Profile and optimize bottleneck functions
4. **Resource Scaling**: Upgrade Render service plan if needed

### Debugging Tools

#### Application Debugging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Access Python shell in production
# Via Render dashboard: Services → Shell tab
python
>>> from core.database import get_db
>>> # Interactive debugging
```

#### Database Debugging
```sql
-- Monitor active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check database locks
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.transactionid = blocked_locks.transactionid
JOIN pg_catalog.pg_stat_activity blocking_activity
  ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

#### Network Debugging
```bash
# Test external API connectivity
curl -I https://api.openai.com/v1/models
curl -I https://api.pinecone.io/v1/indexes

# Test database connectivity
pg_isready -h hostname -p port -U username

# Check DNS resolution
nslookup war-room-oa9t.onrender.com
```

---

## Maintenance Procedures

### Routine Maintenance Schedule

#### Daily Tasks (Automated)
- **Health Checks**: Automated system health monitoring
- **Log Rotation**: Archive old application logs
- **Backup Verification**: Confirm daily backup completion
- **Security Monitoring**: Check for suspicious activity

#### Weekly Tasks
- **Dependency Updates**: Check for security updates
- **Performance Review**: Analyze response times and error rates
- **Capacity Planning**: Monitor resource usage trends
- **Backup Testing**: Verify backup restoration procedures

#### Monthly Tasks
- **Security Audit**: Review access logs and permissions
- **Performance Optimization**: Identify and fix bottlenecks
- **Documentation Updates**: Keep technical docs current
- **Disaster Recovery Test**: Full recovery procedure testing

### Maintenance Scripts

#### System Maintenance
```bash
#!/bin/bash
# scripts/maintenance.sh

echo "Starting system maintenance..."

# Clean old logs (keep 30 days)
find logs/ -name "*.log" -mtime +30 -delete

# Update system packages (development environment)
if [ "$ENVIRONMENT" = "development" ]; then
    apt update && apt upgrade -y
fi

# Database maintenance
python scripts/db_maintenance.py

# Clear cache (Redis)
redis-cli FLUSHDB

# Generate maintenance report
python scripts/generate_maintenance_report.py

echo "Maintenance completed successfully"
```

#### Database Maintenance
```python
# scripts/db_maintenance.py
import asyncio
from core.database import get_db
from sqlalchemy import text

async def database_maintenance():
    """Perform routine database maintenance"""
    
    db = next(get_db())
    
    try:
        # Update table statistics
        await db.execute(text("ANALYZE;"))
        print("✅ Database statistics updated")
        
        # Vacuum tables to reclaim space
        await db.execute(text("VACUUM;"))
        print("✅ Database vacuumed")
        
        # Reindex to optimize queries
        await db.execute(text("REINDEX DATABASE warroom;"))
        print("✅ Database reindexed")
        
        # Clean up expired sessions
        await db.execute(text("""
            DELETE FROM user_sessions 
            WHERE expires_at < NOW() - INTERVAL '7 days'
        """))
        print("✅ Expired sessions cleaned up")
        
    except Exception as e:
        print(f"❌ Database maintenance error: {e}")
    
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(database_maintenance())
```

### Update Procedures

#### Application Updates
```bash
# Standard update procedure
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test
# ... development work ...

# 3. Run tests
cd src/frontend && npm test
cd ../backend && pytest

# 4. Update documentation
# ... update relevant docs ...

# 5. Create pull request
# 6. After review and approval, merge to main
# 7. Monitor deployment automatically triggered by merge
```

#### Dependency Updates
```bash
# Frontend dependencies
cd src/frontend
npm outdated                    # Check for updates
npm update                      # Update to compatible versions
npm audit fix                   # Fix security vulnerabilities

# Backend dependencies
cd src/backend
pip list --outdated            # Check for updates
pip install -U package-name    # Update specific packages
pip-audit                      # Check for security issues

# Update requirements.txt
pip freeze > requirements.txt
```

#### Security Updates (Emergency)
```bash
# Emergency security update procedure
# 1. Identify vulnerable dependency
# 2. Test update in development
# 3. Create hotfix branch
git checkout -b hotfix/security-update

# 4. Apply minimal fix
# 5. Fast-track testing
# 6. Deploy immediately
git push origin hotfix/security-update
# Create PR and merge immediately after review

# 7. Monitor deployment closely
```

---

## Scaling & Performance

### Current Performance Metrics

#### Response Time Targets
- **Health endpoints**: <100ms
- **Authentication**: <500ms
- **Dashboard loading**: <2s
- **Complex reports**: <30s
- **File uploads**: <60s

#### Resource Utilization
- **CPU Usage**: Average 45%, Peak 70%
- **Memory Usage**: Average 65%, Peak 85%
- **Database Connections**: Average 12/50
- **Redis Memory**: Average 120MB

### Horizontal Scaling Strategy

#### Database Scaling
```sql
-- Read replica setup (Supabase provides this)
-- Primary: Write operations
-- Replica: Read operations for reporting

-- Connection routing in application
async def get_read_db():
    """Use read replica for read-only operations"""
    return create_connection(READ_REPLICA_URL)

async def get_write_db():
    """Use primary database for write operations"""
    return create_connection(DATABASE_URL)
```

#### Caching Strategy
```python
# Multi-tier caching implementation
from redis import Redis
from functools import wraps

# Application-level cache
app_cache = {}

# Redis distributed cache
redis_cache = Redis.from_url(REDIS_URL)

def cached(ttl=300):
    """Multi-tier caching decorator"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args)+str(kwargs))}"
            
            # Check application cache first
            if cache_key in app_cache:
                return app_cache[cache_key]
            
            # Check Redis cache
            cached_result = redis_cache.get(cache_key)
            if cached_result:
                result = json.loads(cached_result)
                app_cache[cache_key] = result  # Populate app cache
                return result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            redis_cache.setex(cache_key, ttl, json.dumps(result))
            app_cache[cache_key] = result
            
            return result
        return wrapper
    return decorator
```

### Vertical Scaling (Render Service Plans)

#### Current Plan: Starter ($7/month)
- **RAM**: 512 MB
- **CPU**: Shared
- **Bandwidth**: 100 GB/month

#### Scaling Options
1. **Hobby ($25/month)**
   - RAM: 1 GB
   - CPU: Shared
   - Bandwidth: 1 TB/month

2. **Standard ($85/month)**
   - RAM: 4 GB
   - CPU: 1 vCPU
   - Bandwidth: 1 TB/month

3. **Pro ($200/month)**
   - RAM: 8 GB
   - CPU: 2 vCPU
   - Bandwidth: 1 TB/month

### Performance Optimization

#### Database Optimization
```sql
-- Index optimization based on query patterns
CREATE INDEX CONCURRENTLY idx_events_org_date 
ON events(organization_id, event_date);

CREATE INDEX CONCURRENTLY idx_volunteers_org_status 
ON volunteers(organization_id, status);

CREATE INDEX CONCURRENTLY idx_documents_vector_search 
ON documents USING gin(search_vector);

-- Query optimization examples
-- Before: Full table scan
SELECT * FROM events WHERE organization_id = 'org123' ORDER BY event_date;

-- After: Index usage
EXPLAIN ANALYZE SELECT * FROM events 
WHERE organization_id = 'org123' 
ORDER BY event_date;
-- Should show "Index Scan using idx_events_org_date"
```

#### Application Optimization
```python
# Async optimization for concurrent operations
import asyncio
import aiohttp

async def fetch_multiple_metrics(organization_id: str):
    """Fetch multiple metrics concurrently"""
    
    async def fetch_volunteers():
        return await get_volunteer_metrics(organization_id)
    
    async def fetch_events():
        return await get_event_metrics(organization_id)
    
    async def fetch_donations():
        return await get_donation_metrics(organization_id)
    
    # Execute all queries concurrently
    volunteers, events, donations = await asyncio.gather(
        fetch_volunteers(),
        fetch_events(), 
        fetch_donations()
    )
    
    return {
        "volunteers": volunteers,
        "events": events,
        "donations": donations
    }
```

### Load Testing

#### Testing Strategy
```bash
# Install load testing tools
pip install locust

# Create load test scenarios
# tests/load/locustfile.py
from locust import HttpUser, task, between

class WarRoomUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before testing"""
        self.client.post("/api/v1/auth/login", {
            "email": "test@example.com",
            "password": "testpass123"
        })
    
    @task(3)
    def view_dashboard(self):
        self.client.get("/api/v1/analytics/dashboard")
    
    @task(2)
    def view_events(self):
        self.client.get("/api/v1/events")
    
    @task(1)
    def view_volunteers(self):
        self.client.get("/api/v1/volunteers")

# Run load tests
locust -f tests/load/locustfile.py --host https://war-room-oa9t.onrender.com
```

#### Performance Baselines
- **Concurrent Users**: 50 users (current capacity)
- **Response Time**: 95th percentile < 3 seconds
- **Error Rate**: < 1% under normal load
- **Throughput**: 100 requests/minute sustained

---

## Emergency Procedures

### Incident Response Plan

#### Severity Levels

#### P0 - Critical (Response: Immediate)
- Complete system outage
- Data breach or security incident
- Database corruption
- Payment system failure

#### P1 - High (Response: 1 hour)
- Partial system outage
- Performance degradation >50%
- Authentication system failure
- External integration failures

#### P2 - Medium (Response: 4 hours)
- Minor feature failures
- Performance degradation <50%
- Non-critical bug reports

#### P3 - Low (Response: 24 hours)
- Feature requests
- Documentation updates
- Minor UI issues

### Emergency Contacts

#### Technical Team
- **Primary On-Call**: [System Administrator]
- **Secondary On-Call**: [Lead Developer]
- **Database Expert**: [Database Administrator]
- **Security Contact**: [Security Officer]

#### External Support
- **Render Support**: support@render.com
- **Supabase Support**: Via dashboard support widget
- **Sentry Support**: Via dashboard for error tracking

### Emergency Recovery Commands

```bash
# Quick system health check
curl -I https://war-room-oa9t.onrender.com/health

# Emergency database backup
pg_dump $DATABASE_URL > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Emergency rollback (last good deployment)
git log --oneline -5  # Find last good commit
git revert HEAD~1     # Revert problematic changes
git push origin main  # Trigger redeployment

# Clear all caches (if caching issues)
redis-cli -u $REDIS_URL FLUSHALL

# Restart specific service (if needed)
# Via Render dashboard: Manual Deploy → Deploy Latest Commit
```

---

## Appendices

### A. Configuration File Templates

#### Environment File Template
```bash
# Copy to .env and fill in values
# src/backend/.env

# Security
SECRET_KEY=generate-with-openssl-rand-hex-32
JWT_SECRET=same-as-secret-key
CSRF_SECRET_KEY=different-secret-key

# Database  
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# Cache
REDIS_URL=redis://default:password@host:port

# External Services
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-east-1
SENDGRID_API_KEY=SG.your-sendgrid-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
POSTHOG_KEY=phc_your-posthog-key

# Feature Flags
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_DOCUMENT_INTELLIGENCE=true
ENABLE_CRISIS_MONITORING=true
```

### B. Monitoring Checklist

#### Daily Monitoring Tasks
- [ ] Check system health endpoints
- [ ] Review error rates and response times
- [ ] Verify backup completion
- [ ] Monitor database performance
- [ ] Check external service status

#### Weekly Monitoring Tasks
- [ ] Review security logs
- [ ] Analyze performance trends
- [ ] Check resource utilization
- [ ] Update monitoring thresholds
- [ ] Test alert notifications

### C. Emergency Runbook

#### System Down Emergency Response
1. **Immediate Response** (0-5 minutes)
   - Check system status page
   - Verify Render service status
   - Check external service dependencies
   
2. **Assessment** (5-15 minutes)
   - Review error logs in Render dashboard
   - Check database connectivity
   - Verify DNS resolution
   
3. **Resolution** (15-60 minutes)
   - Apply appropriate fix based on root cause
   - Monitor system recovery
   - Notify stakeholders of status

4. **Post-Incident** (After resolution)
   - Document incident and resolution
   - Update monitoring if needed
   - Schedule post-mortem meeting

---

*War Room Administrator Guide v1.0*  
*Last updated: January 2025*