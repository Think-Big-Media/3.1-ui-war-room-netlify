# Production Deployment Checklist for Meta App Review

This checklist ensures War Room is production-ready for Meta Business API app review.

## Pre-Deployment Checklist

### 📋 **Documentation Requirements**
- [ ] Privacy Policy deployed and accessible at `/privacy`
- [ ] Terms of Service deployed and accessible at `/terms`  
- [ ] All external links in documents work correctly
- [ ] Contact information is accurate and responsive
- [ ] Legal documents include effective dates

### 🔐 **Security Configuration**
- [ ] HTTPS/TLS enforced on all endpoints
- [ ] SSL certificates valid and not expiring soon (>30 days)
- [ ] Security headers properly configured (HSTS, CSP, etc.)
- [ ] No HTTP redirects in OAuth flow
- [ ] All sensitive data encrypted at rest
- [ ] Rate limiting configured and tested
- [ ] Input validation on all endpoints
- [ ] CORS properly configured for production domains

### 🌐 **Environment Variables**
```bash
# Production environment variables checklist
META_APP_ID=                    # ✅ Set
META_APP_SECRET=               # ✅ Set  
META_API_VERSION=v18.0         # ✅ Set
API_BASE_URL=                  # ✅ Set to production URL
ENVIRONMENT=production         # ✅ Set
DATABASE_URL=                  # ✅ Production database
REDIS_URL=                     # ✅ Production Redis
SECRET_KEY=                    # ✅ Strong production secret
```

### 🔗 **URL Configuration**
- [ ] Production domain configured: `war-room-oa9t.onrender.com`
- [ ] OAuth redirect URI: `https://war-room-oa9t.onrender.com/api/v1/meta/auth/callback`
- [ ] Privacy Policy URL: `https://war-room-oa9t.onrender.com/privacy`
- [ ] Terms of Service URL: `https://war-room-oa9t.onrender.com/terms`
- [ ] All URLs use HTTPS (no HTTP)

## Meta App Configuration

### 📱 **Meta Developer Console Settings**

#### Basic App Settings:
- [ ] App Name: "War Room Analytics"
- [ ] App Contact Email: `admin@warroom.app`
- [ ] Privacy Policy URL configured and accessible
- [ ] Terms of Service URL configured and accessible
- [ ] App Icon uploaded (1024x1024 PNG)
- [ ] App Category: "Business"
- [ ] App Description completed

#### App Domains:
```
war-room-oa9t.onrender.com
```

#### OAuth Redirect URIs:
```
https://war-room-oa9t.onrender.com/api/v1/meta/auth/callback
```

#### App Mode:
- [ ] Switched from "Development" to "Live" mode
- [ ] All localhost URLs removed from production app
- [ ] Test users configured if needed

### 🔑 **Permissions Configuration**
- [ ] `ads_read` - Standard Access requested
- [ ] `business_management` - Standard Access requested  
- [ ] `pages_read_engagement` - Standard Access requested
- [ ] App Review submission completed with use case explanations
- [ ] Demo video uploaded showing OAuth flow

## Database & Storage

### 🗄️ **Database Readiness**
- [ ] Production database provisioned and accessible
- [ ] All migrations applied successfully
- [ ] Database connection pooling configured
- [ ] Database backups configured
- [ ] Connection strings use SSL/TLS
- [ ] Database user has minimum required permissions

```sql
-- Verify Meta auth table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'google_ads_auth';

-- Check index performance
EXPLAIN ANALYZE SELECT * FROM google_ads_auth WHERE org_id = 'test';
```

### 📦 **Redis Configuration**
- [ ] Production Redis instance configured
- [ ] Redis password authentication enabled
- [ ] SSL/TLS connection to Redis
- [ ] Appropriate memory limits set
- [ ] Redis persistence configured (if required)
- [ ] Connection pool limits configured

```bash
# Test Redis connection
redis-cli -h your-redis-host -p 6379 -a your-password --tls ping
```

## Application Deployment

### 🚀 **Deployment Verification**

#### Application Health:
```bash
# Health check endpoint
curl -f https://war-room-oa9t.onrender.com/health
# Expected: {"status": "healthy"}

# API version endpoint  
curl -f https://war-room-oa9t.onrender.com/
# Expected: {"name": "War Room API", "version": "1.0.0"}
```

#### OAuth Flow Test:
```bash
# Test OAuth redirect endpoint
curl -f https://war-room-oa9t.onrender.com/api/v1/meta/auth/redirect \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer valid_jwt_token" \
  -d '{"state": "test"}'

# Expected: {"authorization_url": "https://www.facebook.com/..."}
```

### 🔍 **Performance Verification**
- [ ] Application starts up within 30 seconds
- [ ] OAuth flow completes within 10 seconds
- [ ] API endpoints respond within 2 seconds
- [ ] Memory usage under 512MB
- [ ] CPU usage under 80% during normal load
- [ ] No memory leaks during extended operation

### 📊 **Monitoring Setup**
- [ ] Application logs properly configured
- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set for critical metrics
- [ ] Dashboard access configured for support team

## Security Audit

### 🛡️ **Security Checklist**

#### Network Security:
- [ ] Web Application Firewall (WAF) enabled
- [ ] DDoS protection configured
- [ ] IP allowlisting for admin endpoints (if applicable)
- [ ] Network access logs enabled

#### Application Security:
```bash
# Test security headers
curl -I https://war-room-oa9t.onrender.com/

# Should include:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: default-src 'self'
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

#### Data Security:
- [ ] All PII encrypted at rest
- [ ] Database connections use SSL
- [ ] API tokens encrypted in storage
- [ ] No sensitive data in application logs
- [ ] Proper key rotation schedule established

### 🔐 **Authentication Security**
- [ ] JWT tokens use strong signing algorithm (RS256/ES256)
- [ ] Token expiration properly configured (< 1 hour)
- [ ] Refresh token rotation implemented
- [ ] Session management secure
- [ ] Multi-factor authentication available for admins

## Privacy Compliance

### 📋 **GDPR/CCPA Compliance**
- [ ] Privacy Policy includes all required disclosures
- [ ] Data subject rights implemented:
  - [ ] Right to access (data export)
  - [ ] Right to rectification (account updates)  
  - [ ] Right to erasure (account deletion)
  - [ ] Right to portability (data export)
- [ ] Consent management implemented
- [ ] Data retention policies enforced
- [ ] Data Processing Agreements with third parties

### 🔍 **Data Handling Verification**
```bash
# Test data export functionality
curl -X GET https://war-room-oa9t.onrender.com/api/v1/user/export \
  -H "Authorization: Bearer valid_jwt_token"

# Test account deletion
curl -X DELETE https://war-room-oa9t.onrender.com/api/v1/meta/auth/disconnect \
  -H "Authorization: Bearer valid_jwt_token"
```

## Load Testing

### 📈 **Performance Under Load**

#### Concurrent User Test:
```bash
# Apache Bench load test
ab -n 1000 -c 10 -H "Authorization: Bearer test_token" \
  https://war-room-oa9t.onrender.com/api/v1/meta/accounts

# Expected: 99% requests < 2 seconds
```

#### OAuth Flow Load Test:
```python
import asyncio
import aiohttp
import time

async def load_test_oauth():
    """Load test OAuth callback endpoint."""
    
    async def oauth_request(session):
        async with session.post(
            "https://war-room-oa9t.onrender.com/api/v1/meta/auth/callback",
            json={
                "code": "test_code",
                "redirect_uri": "https://war-room-oa9t.onrender.com/callback"
            },
            headers={"Authorization": "Bearer test_token"}
        ) as response:
            return response.status == 200
    
    # Test 100 concurrent OAuth requests
    async with aiohttp.ClientSession() as session:
        start_time = time.time()
        tasks = [oauth_request(session) for _ in range(100)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        success_rate = sum(1 for r in results if r is True) / len(results)
        duration = end_time - start_time
        
        print(f"Success rate: {success_rate:.2%}")
        print(f"Duration: {duration:.2f} seconds")
        
        return success_rate > 0.95  # 95% success rate required

# Run test
asyncio.run(load_test_oauth())
```

### 📊 **Performance Benchmarks**
- [ ] OAuth flow handles 100 concurrent requests with >95% success
- [ ] API endpoints handle 1000 requests/minute
- [ ] Database queries execute in <100ms
- [ ] Memory usage remains stable under load
- [ ] No memory leaks after 1 hour of load testing

## User Experience

### 🖥️ **Frontend Integration**
- [ ] OAuth connection flow works smoothly
- [ ] Error messages are user-friendly
- [ ] Loading states properly displayed
- [ ] Success confirmations clear
- [ ] Account disconnection works properly

### 📱 **Cross-Platform Testing**
- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)  
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)
- [ ] Mobile responsive design
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome

### ♿ **Accessibility Compliance**
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards
- [ ] Alt text for images
- [ ] Proper heading structure

## Business Verification

### 🏢 **Company Documentation**
- [ ] Business registration certificate uploaded
- [ ] Tax ID/EIN documentation verified
- [ ] Business address verification completed
- [ ] Bank account verification (if required)
- [ ] Domain ownership verification completed

### 📋 **App Store Listing** (if applicable)
- [ ] App description accurate and complete
- [ ] Screenshots current and representative
- [ ] Privacy policy link included
- [ ] Contact information current
- [ ] App category appropriate

## Final Pre-Launch Verification

### ✅ **End-to-End Testing**

#### Complete User Journey:
1. **User Registration**:
   ```bash
   curl -X POST https://war-room-oa9t.onrender.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "Test123!", "full_name": "Test User"}'
   ```

2. **User Login**:
   ```bash  
   curl -X POST https://war-room-oa9t.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "Test123!"}'
   ```

3. **Meta Connection**:
   - Generate OAuth URL
   - Complete Facebook authorization
   - Verify callback success
   - Check token storage

4. **Data Retrieval**:
   - Fetch ad accounts
   - Retrieve campaign data
   - Generate reports
   - Export data

5. **Account Management**:
   - Update preferences
   - Disconnect Meta account
   - Delete account and data

### 🔄 **Backup and Recovery**
- [ ] Database backup strategy tested
- [ ] Application deployment rollback tested
- [ ] Configuration backup verified
- [ ] Recovery time objectives (RTO) met (<1 hour)
- [ ] Recovery point objectives (RPO) met (<15 minutes)

### 📞 **Support Readiness**
- [ ] Support team trained on Meta integration
- [ ] Documentation wiki updated
- [ ] Troubleshooting runbooks created
- [ ] Escalation procedures defined
- [ ] 24/7 support availability confirmed (if required)

## Go-Live Checklist

### 🚀 **Final Deployment Steps**

1. **Pre-deployment**:
   - [ ] All tests passing
   - [ ] Code review completed
   - [ ] Security scan completed
   - [ ] Performance benchmarks met

2. **Deployment**:
   - [ ] Deploy to production
   - [ ] Verify deployment success
   - [ ] Run smoke tests
   - [ ] Monitor for errors

3. **Post-deployment**:
   - [ ] Verify all endpoints working
   - [ ] Check error rates
   - [ ] Monitor performance metrics
   - [ ] Validate Meta app connectivity

4. **Meta App Review**:
   - [ ] Switch Meta app to "Live" mode
   - [ ] Submit app for review
   - [ ] Monitor review status
   - [ ] Respond to reviewer questions promptly

### 📊 **Success Criteria**
- [ ] Application uptime > 99.9%
- [ ] OAuth success rate > 95%
- [ ] API response time < 2 seconds (95th percentile)
- [ ] Zero security vulnerabilities
- [ ] Privacy compliance verified
- [ ] User experience testing passed
- [ ] Meta app review submission accepted

## Post-Launch Monitoring

### 📈 **Key Metrics to Monitor**

#### Application Performance:
- Uptime percentage
- Response time percentiles
- Error rate by endpoint
- Memory and CPU utilization

#### OAuth Flow Metrics:
- OAuth initiation rate
- OAuth success/failure rate
- Token refresh success rate
- User dropout points in flow

#### Business Metrics:
- New user registrations
- Meta account connections
- Data retrieval usage
- User retention rates

### 🚨 **Alert Thresholds**
- [ ] Application downtime (immediate alert)
- [ ] Error rate > 1% (5-minute alert)
- [ ] Response time > 5 seconds (10-minute alert)
- [ ] OAuth failure rate > 10% (immediate alert)
- [ ] Memory usage > 90% (immediate alert)

### 📋 **Weekly Review Process**
- [ ] Review application performance metrics
- [ ] Analyze user feedback and issues
- [ ] Check security logs for anomalies
- [ ] Validate backup and monitoring systems
- [ ] Update documentation as needed

---

## Sign-off

### ✍️ **Deployment Approval**

**Technical Lead**: _________________ Date: _______  
**Security Officer**: _________________ Date: _______  
**Product Manager**: _________________ Date: _______  
**CEO/CTO**: _________________ Date: _______  

### 📞 **Emergency Contacts**
- **Primary**: Roderick Andrews - +1 (813) 965-2725
- **Technical**: dev@wethinkbig.io
- **Security**: security@warroom.app
- **Business**: admin@warroom.app

---

**Deployment Date**: _______________  
**Meta App Review Submission**: _______________  
**Go-Live Date**: _______________

**Document Version**: 1.0  
**Last Updated**: August 7, 2024