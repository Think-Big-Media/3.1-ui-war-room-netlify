# War Room Platform - Render.com Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Creating New Render.com Account](#creating-new-rendercom-account)
4. [Service Configuration](#service-configuration)
5. [Database Setup](#database-setup)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Custom Domain Setup](#custom-domain-setup)
8. [Auto-Deploy Configuration](#auto-deploy-configuration)
9. [Monitoring and Alerts](#monitoring-and-alerts)
10. [Testing and Validation](#testing-and-validation)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides detailed instructions for migrating the War Room Analytics Platform to a new Render.com account. The migration includes setting up web services, databases, environment configuration, and custom domains.

**Current Architecture:**
- **Frontend**: React/Vite application
- **Backend**: Python/FastAPI application  
- **Database**: PostgreSQL with Redis cache
- **Authentication**: Supabase
- **Monitoring**: PostHog + Sentry
- **Deployment**: Single web service on Render.com

---

## Prerequisites

### Required Accounts & Access
- [x] Active Render.com account with billing configured
- [x] GitHub repository access (owner or admin permissions)
- [x] Domain registrar access (for custom domain setup)
- [x] Supabase project with admin access
- [x] PostHog account for analytics
- [x] Sentry account for error tracking

### Required Files
- [x] Repository source code
- [x] Environment variables documentation
- [x] Database backup (if migrating data)
- [x] SSL certificates (if using custom domain)

---

## Creating New Render.com Account

### 1. Account Setup
```bash
# Visit https://render.com and sign up
# Choose appropriate plan (Starter recommended for production)
# Connect GitHub account for repository access
```

### 2. Billing Configuration
- **Starter Plan**: $7/month for web services
- **Database Plans**: $7/month for PostgreSQL, $10/month for Redis
- **Custom Domains**: Free with paid plans
- **SSL Certificates**: Free and automatic

### 3. Team Management (Optional)
```bash
# Invite team members if needed
# Set appropriate permissions (Admin, Developer, Viewer)
# Configure notifications for deployments and alerts
```

---

## Service Configuration

### 1. Create Web Service

#### Step 1: New Web Service
1. Go to Render Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure basic settings:

```yaml
Name: war-room
Environment: Python
Region: Oregon (US-West)
Branch: main
Root Directory: . (leave blank if repository root)
```

#### Step 2: Build Configuration
```yaml
Build Command: |
  echo "🚀 Starting War Room Analytics build process..."
  echo "Current directory: $(pwd)"
  echo "Available files:"
  ls -la
  
  # Install backend dependencies
  echo "📦 Installing backend dependencies..."
  cd src/backend && pip install -r requirements.txt
  
  # Install frontend dependencies and build
  echo "🎨 Building frontend application..."
  cd ../frontend
  echo "Frontend directory: $(pwd)"
  ls -la
  
  # Install with legacy peer deps for better compatibility
  npm install --legacy-peer-deps
  
  # Optimize Node.js memory for build
  export NODE_OPTIONS="--max-old-space-size=1024"
  
  # Build frontend for production
  npm run build
  
  # Verify build output
  echo "✅ Build complete. Checking dist directory:"
  ls -la dist/ || echo "No dist directory found"
  
  echo "🎯 Build process completed successfully!"
```

#### Step 3: Runtime Configuration
```yaml
Start Command: cd src/backend && python serve_bulletproof.py
Health Check Path: /health
Auto-Deploy: false  # Enable after initial setup complete
```

### 2. Advanced Settings

#### Disk Storage (Optional)
```yaml
Disk Name: war-room-disk
Mount Path: /opt/render/project/src/backend/storage
Size: 1 GB
Purpose: Temporary files, logs, uploaded documents
```

#### Scaling Configuration
```yaml
Plan: Starter ($7/month)
Instances: 1 (can scale up later)
CPU: 0.5 vCPU
Memory: 512 MB RAM
```

---

## Database Setup

### 1. PostgreSQL Database

#### Create Database Service
1. Go to Dashboard → **"New +"** → **"PostgreSQL"**
2. Configure settings:

```yaml
Name: war-room-db
Database Name: warroom
User: warroom
Region: Oregon (same as web service)
Plan: Starter ($7/month - 256MB, 1M rows, daily backups)
Version: 15 (latest stable)
```

#### Connection Details
```bash
# Render provides these automatically:
# - Connection String (internal and external)
# - Host, Port, Database, User, Password
# - SSL enabled by default
```

### 2. Redis Cache

#### Create Redis Service
1. Go to Dashboard → **"New +"** → **"Redis"**
2. Configure settings:

```yaml
Name: war-room-redis
Region: Oregon (same as web service)
Plan: Starter ($10/month - 25MB with persistence)
Version: 7 (latest stable)
Maxmemory Policy: allkeys-lru
```

#### Redis Configuration
```bash
# Automatic configuration:
# - Connection string provided
# - SSL/TLS enabled
# - Persistence enabled on Starter plan
# - Automatic failover
```

### 3. Database Security

#### SSL Configuration
```yaml
# Automatic SSL for both PostgreSQL and Redis
# No additional configuration required
# Certificates managed by Render
```

#### Backup Configuration
```yaml
PostgreSQL Backups:
  - Daily automatic backups (Starter plan)
  - 7-day retention
  - Point-in-time recovery available
  - Manual backups available via dashboard

Redis Persistence:
  - RDB snapshots
  - AOF logging (if configured)
  - Data durability guaranteed
```

---

## Environment Variables Configuration

### 1. Required Variables

Copy these from your `.env.render.template` file and configure in Render Dashboard:

#### Core Application
```bash
APP_NAME="War Room Analytics"
APP_VERSION="1.0.0"
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

#### Database Connections
```bash
# PostgreSQL (use Render's database reference)
DATABASE_URL=${war-room-db.connectionString}
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true

# Redis (use Render's Redis reference)
REDIS_URL=${war-room-redis.connectionString}
REDIS_POOL_MIN_SIZE=10
REDIS_POOL_MAX_SIZE=20
```

#### Security Settings
```bash
# These should use Render's "Generate Value" feature
SECRET_KEY=[GENERATE_SECURE_KEY]
JWT_SECRET=[GENERATE_SECURE_KEY]
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 2. External Service Configuration

#### Supabase (REQUIRED)
```bash
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
REACT_APP_SUPABASE_URL=https://[your-project].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]
```

#### PostHog Analytics (REQUIRED)
```bash
POSTHOG_KEY=[your-posthog-key]
POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_KEY=[your-posthog-key]
VITE_POSTHOG_HOST=https://app.posthog.com
```

#### Sentry Error Tracking (REQUIRED)
```bash
SENTRY_DSN=https://[your-dsn]@sentry.io/[project-id]
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 3. Optional Integrations

#### Meta Business API
```bash
META_APP_ID=[your-meta-app-id]
META_APP_SECRET=[your-meta-app-secret]
VITE_META_APP_ID=[your-meta-app-id]
VITE_META_REDIRECT_URI=https://[your-domain]/auth/meta/callback
```

#### Google Ads API
```bash
GOOGLE_ADS_DEVELOPER_TOKEN=[your-developer-token]
GOOGLE_ADS_CLIENT_ID=[your-client-id]
GOOGLE_ADS_CLIENT_SECRET=[your-client-secret]
VITE_GOOGLE_ADS_CLIENT_ID=[your-client-id]
```

### 4. CORS and Domain Configuration

```bash
# Update these with your actual domain
BACKEND_CORS_ORIGINS=https://your-domain.com
VITE_API_URL=https://your-domain.com
VITE_API_BASE_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com
```

---

## Custom Domain Setup

### 1. Add Domain in Render

#### Dashboard Configuration
1. Go to your Web Service → **"Settings"** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Enter your domain: `your-domain.com`
4. Note the CNAME target provided by Render

#### DNS Configuration
```bash
# At your domain registrar, add:
Type: CNAME
Name: @ (or your subdomain)
Value: [render-provided-cname-target]
TTL: 3600 (1 hour)
```

### 2. SSL Certificate

#### Automatic SSL
```bash
# Render automatically provisions SSL certificates
# Usually takes 5-10 minutes after DNS propagation
# Certificates auto-renew before expiration
```

#### Verification
```bash
# Check SSL status in Render dashboard
# Test with: https://your-domain.com/health
# Verify certificate details in browser
```

### 3. Domain Validation

#### DNS Propagation Check
```bash
# Use tools like:
# - https://dnschecker.org
# - nslookup your-domain.com
# - dig your-domain.com

# Expected result should show Render's IP addresses
```

---

## Auto-Deploy Configuration

### 1. GitHub Integration

#### Repository Connection
```bash
# Ensure Render has access to your repository
# Configure branch: main (recommended)
# Set auto-deploy: true (after initial testing)
```

#### Deploy Hooks (Optional)
```bash
# Configure deploy notifications:
# - Slack webhook
# - Email notifications
# - Discord webhook
```

### 2. Deployment Settings

#### Build Configuration
```yaml
Build Command: [see service configuration section]
Start Command: cd src/backend && python serve_bulletproof.py
Auto Deploy: true
Pre-Deploy Commands: |
  echo "Running pre-deploy checks..."
  # Add any migration commands here
  # cd src/backend && python run_migrations.py
```

#### Environment Handling
```yaml
# Different environment configs:
Production: master/main branch
Staging: develop branch (if needed)
Review Apps: Pull requests (optional)
```

---

## Monitoring and Alerts

### 1. Render Built-in Monitoring

#### Service Health
```bash
# Available metrics:
# - Response times
# - Error rates
# - Memory usage
# - CPU usage
# - Request volume
```

#### Log Management
```bash
# Access logs via:
# - Render Dashboard → Service → Logs
# - Real-time log streaming
# - Log search and filtering
# - Log exports available
```

### 2. External Monitoring Setup

#### PostHog Dashboard
```javascript
// Configure in your frontend:
posthog.init(process.env.VITE_POSTHOG_KEY, {
  api_host: process.env.VITE_POSTHOG_HOST,
  // Add custom events for monitoring
});
```

#### Sentry Error Tracking
```python
# Backend configuration:
import sentry_sdk
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("SENTRY_ENVIRONMENT"),
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", 0.1)),
)
```

### 3. Custom Alerts

#### Health Check Monitoring
```bash
# Set up external monitoring:
# - UptimeRobot
# - Pingdom  
# - StatusCake
# - Monitor: https://your-domain.com/health
```

#### Database Monitoring
```bash
# Monitor PostgreSQL:
# - Connection pool status
# - Query performance
# - Disk usage
# - Backup success

# Monitor Redis:
# - Memory usage
# - Cache hit rates
# - Connection counts
```

---

## Testing and Validation

### 1. Pre-Go-Live Testing

#### Health Checks
```bash
# Test core endpoints:
curl https://your-domain.com/health
curl https://your-domain.com/api/v1/auth/health
curl https://your-domain.com/api/v1/analytics/health
```

#### Authentication Flow
```bash
# Test Supabase integration:
# 1. User registration
# 2. User login
# 3. Token refresh
# 4. Protected route access
```

#### Database Connectivity
```python
# Test database operations:
# 1. Connection establishment
# 2. Read operations
# 3. Write operations
# 4. Migration status
```

### 2. Performance Testing

#### Load Testing
```bash
# Use tools like:
# - Apache Bench (ab)
# - wrk
# - Artillery

# Example with ab:
ab -n 1000 -c 10 https://your-domain.com/
```

#### Database Performance
```sql
-- Check query performance:
EXPLAIN ANALYZE SELECT * FROM users LIMIT 100;
EXPLAIN ANALYZE SELECT * FROM analytics_data WHERE created_at > NOW() - INTERVAL '7 days';
```

### 3. Integration Testing

#### External Services
```bash
# Test all integrations:
# - Supabase authentication
# - PostHog events
# - Sentry error capture
# - Meta API (if configured)
# - Google Ads API (if configured)
```

---

## Troubleshooting

### Common Issues and Solutions

#### Build Failures
```bash
# Issue: npm install fails
# Solution: Use --legacy-peer-deps flag
npm install --legacy-peer-deps

# Issue: Python dependencies fail
# Solution: Check requirements.txt and Python version
pip install -r requirements.txt --no-cache-dir

# Issue: Memory issues during build
# Solution: Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
```

#### Runtime Errors
```bash
# Issue: Database connection fails
# Check: DATABASE_URL environment variable
# Check: Database service status
# Check: Network connectivity

# Issue: Redis connection fails
# Check: REDIS_URL environment variable
# Check: Redis service status
# Check: Connection pool configuration
```

#### DNS and SSL Issues
```bash
# Issue: Domain not resolving
# Check: DNS propagation status
# Check: CNAME configuration
# Wait: Up to 48 hours for full propagation

# Issue: SSL certificate not working
# Check: Domain validation completed
# Check: Certificate provisioning status
# Wait: 5-10 minutes after DNS propagation
```

#### Performance Issues
```bash
# Issue: Slow response times
# Check: Database query performance
# Check: Redis cache hit rates
# Check: Service resource usage
# Consider: Upgrading service plan

# Issue: Memory errors
# Check: Memory usage patterns
# Check: Memory leaks in application
# Consider: Upgrading to higher memory plan
```

### Getting Help

#### Render Support
- **Documentation**: https://render.com/docs
- **Support**: https://render.com/docs/support
- **Status Page**: https://status.render.com
- **Community**: https://community.render.com

#### Service Provider Support
- **Supabase**: https://supabase.com/docs/support
- **PostHog**: https://posthog.com/docs/support
- **Sentry**: https://sentry.io/support/

### Emergency Procedures

#### Rollback Process
1. **Revert DNS**: Point domain back to original deployment
2. **Communicate**: Notify stakeholders immediately
3. **Investigate**: Identify and document issues
4. **Fix**: Resolve problems before retry
5. **Re-deploy**: Follow migration process again

#### Data Recovery
1. **Database Backup**: Use automated backups
2. **Point-in-Time Recovery**: Available for PostgreSQL
3. **Redis Recovery**: From persistence files
4. **File Recovery**: From disk snapshots

---

## Success Checklist

- [ ] Web service deployed successfully
- [ ] Database connections working
- [ ] Environment variables configured
- [ ] Custom domain active with SSL
- [ ] Auto-deploy functioning
- [ ] Monitoring and alerts active
- [ ] Performance meets requirements
- [ ] All integrations working
- [ ] Team access configured
- [ ] Documentation updated

---

## Post-Migration Steps

1. **Update Documentation**: Reflect new URLs and configurations
2. **Monitor Performance**: Watch for issues over 48 hours
3. **Team Training**: Ensure client team understands new environment
4. **Backup Strategy**: Confirm automated backups are working
5. **Security Review**: Verify all security measures are active
6. **Performance Baseline**: Establish new performance metrics

---

*This guide should be used in conjunction with the Migration Checklist and other migration documentation for a complete migration process.*