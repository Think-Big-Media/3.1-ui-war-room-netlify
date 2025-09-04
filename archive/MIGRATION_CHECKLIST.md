# Migration Checklist - Render.com Deployment

## Overview

This comprehensive checklist ensures a smooth migration and deployment process for the War Room platform on Render.com. Follow each step carefully to ensure all components are properly configured and validated.

## Pre-Migration Preparation

### 1. Code Repository Preparation
- [ ] **All changes committed and pushed to main branch**
- [ ] **No uncommitted changes in working directory**
- [ ] **Git repository clean and synchronized**
- [ ] **All merge conflicts resolved**
- [ ] **Feature branches merged or properly tracked**

### 2. Environment Configuration Validation
- [ ] **All required environment variables documented**
- [ ] **Render.yaml file present and configured**
- [ ] **Build and start commands verified**
- [ ] **Python and Node.js versions specified**
- [ ] **Health check endpoint configured**

### 3. Dependencies Verification
- [ ] **Frontend package.json dependencies up to date**
- [ ] **Backend requirements.txt dependencies verified**
- [ ] **No security vulnerabilities in dependencies**
- [ ] **All dependencies compatible with deployment environment**
- [ ] **Build scripts tested locally**

### 4. External Services Setup

#### Required Services (Must be configured)
- [ ] **Supabase Authentication & Database** (see SUPABASE_SETUP_GUIDE.md)
  - [ ] Project created at supabase.com
  - [ ] SUPABASE_URL and SUPABASE_ANON_KEY obtained
  - [ ] Authentication configured (email/password enabled)
  - [ ] Row Level Security policies set up
  - [ ] Database schema created
  - [ ] Connection tested successfully

- [ ] **PostHog Analytics** (see POSTHOG_SETUP_GUIDE.md)
  - [ ] Project created at posthog.com
  - [ ] POSTHOG_KEY and POSTHOG_API_KEY obtained
  - [ ] Event tracking configured
  - [ ] Person profiles set to "identified_only"
  - [ ] Data retention configured
  - [ ] Integration tested successfully

- [ ] **Sentry Error Tracking** (see SENTRY_SETUP_GUIDE.md)
  - [ ] Projects created at sentry.io (frontend + backend)
  - [ ] SENTRY_DSN obtained for both projects
  - [ ] Sample rates configured for cost control
  - [ ] Alert rules set up
  - [ ] Team notifications configured
  - [ ] Error reporting tested successfully

#### Optional Services (Enable when ready)
- [ ] **Meta Business API** (for Facebook/Instagram ads)
  - [ ] Meta for Developers app created
  - [ ] App review completed (if needed)
  - [ ] VITE_META_APP_ID and VITE_META_APP_SECRET obtained
  - [ ] Access token generated and tested

- [ ] **Google Ads API** (for Google advertising)
  - [ ] Google Ads API access enabled
  - [ ] GOOGLE_ADS_DEVELOPER_TOKEN obtained
  - [ ] OAuth credentials configured
  - [ ] API connection tested

- [ ] **AI Services** (for document intelligence)
  - [ ] OpenAI API key configured (OPENAI_API_KEY)
  - [ ] Pinecone vector database set up (PINECONE_API_KEY)
  - [ ] Document processing pipeline tested

- [ ] **Communication Services**
  - [ ] SendGrid configured for email (SENDGRID_API_KEY)
  - [ ] Twilio configured for SMS (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

### 5. Security Configuration & Hardening Review
- [ ] **Environment variables contain no hardcoded secrets**
- [ ] **JWT secrets are properly generated**
- [ ] **API keys have appropriate permissions**
- [ ] **CORS settings configured for production domains only**
- [ ] **Rate limiting configuration reviewed**

#### Security Headers Implementation (Automatic)
- [ ] **Security middleware integrated in serve_bulletproof.py**
- [ ] **Content-Security-Policy header configured**
- [ ] **X-Frame-Options set to DENY (clickjacking protection)**
- [ ] **X-Content-Type-Options set to nosniff**
- [ ] **Strict-Transport-Security configured (HTTPS enforcement)**
- [ ] **Referrer-Policy set to strict-origin-when-cross-origin**
- [ ] **Permissions-Policy configured to limit browser permissions**

#### Security Testing
- [ ] **Security headers tested with online tools (securityheaders.com)**
- [ ] **HTTPS redirection working properly**
- [ ] **No sensitive data in client-side code**
- [ ] **Error messages don't expose system information**
- [ ] **API endpoints require proper authentication**

## Render.com Platform Setup

### 1. Account and Service Setup
- [ ] **Render.com account created and verified**
- [ ] **GitHub repository connected to Render**
- [ ] **Web service created with correct settings**
- [ ] **Service plan selected (Free/Starter/Standard)**
- [ ] **Service region selected (US West recommended)**

### 2. Build Configuration
- [ ] **Build command configured**: `cd src/frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
- [ ] **Start command configured**: `cd src/backend && python serve_bulletproof.py`
- [ ] **Root directory left blank (auto-detection)**
- [ ] **Branch set to main**
- [ ] **Auto-deploy enabled**

### 3. Environment Variables Setup
- [ ] **RENDER_ENV=production**
- [ ] **PYTHON_VERSION=3.11**
- [ ] **NODE_VERSION=20.11.1**
- [ ] **DATABASE_URL configured with Supabase connection string**
- [ ] **REDIS_URL configured**
- [ ] **SECRET_KEY and JWT_SECRET set**
- [ ] **SUPABASE_URL and SUPABASE_SERVICE_KEY configured**
- [ ] **All external API keys configured**

### 4. Database Configuration
- [ ] **Supabase project created and configured**
- [ ] **Database schema up to date**
- [ ] **Connection pooling configured**
- [ ] **Database migrations prepared**
- [ ] **Backup strategy confirmed**

### 5. Redis Cache Setup
- [ ] **Render Redis service created (if using Render Redis)**
- [ ] **Redis connection URL configured**
- [ ] **Cache policies defined**
- [ ] **Redis connection tested**

## Migration Execution

### 1. Initial Deployment
- [ ] **Service deployed successfully**
- [ ] **Build process completed without errors**
- [ ] **Service started successfully**
- [ ] **Health check endpoint responding**
- [ ] **Service URL accessible**

### 2. Service Validation
- [ ] **Basic health endpoint**: `GET /health` returns 200
- [ ] **API health endpoint**: `GET /api/v1/health` returns healthy status
- [ ] **Frontend loads correctly at service URL**
- [ ] **Static assets loading properly**
- [ ] **No 404 errors for critical resources**

### 3. Database Migration and Validation
- [ ] **Database connection established**
- [ ] **Database migrations executed successfully**
- [ ] **All tables created properly**
- [ ] **Indexes created and optimized**
- [ ] **Sample data insert/query test successful**

### 4. Authentication System Validation
- [ ] **Supabase authentication working**
- [ ] **JWT token generation functional**
- [ ] **Login/logout process working**
- [ ] **Session management operational**
- [ ] **Password reset functionality tested**

### 5. External API Integration Testing
- [ ] **Meta Business API connection verified**
- [ ] **Google Ads API connection verified**
- [ ] **OpenAI API calls working**
- [ ] **Pinecone vector database accessible**
- [ ] **Email service functional (if configured)**

## Post-Migration Validation

### 1. Functional Testing
- [ ] **User registration process working**
- [ ] **User login and authentication working**
- [ ] **Dashboard loading with correct data**
- [ ] **Analytics endpoints returning data**
- [ ] **Campaign creation and management working**
- [ ] **Real-time features operational**

### 2. Performance Validation
- [ ] **Page load times under 3 seconds**
- [ ] **API response times under 2 seconds**
- [ ] **Database query performance acceptable**
- [ ] **Cache hit rates above 80%**
- [ ] **Memory usage within limits (512MB for free tier)**

### 3. Security Validation
- [ ] **HTTPS enforced on all endpoints**
- [ ] **Security headers present in responses**
- [ ] **CORS policy working correctly**
- [ ] **Rate limiting functional**
- [ ] **No sensitive data exposed in logs**

### 4. Monitoring Setup
- [ ] **Sentry error tracking configured**
- [ ] **PostHog analytics configured**
- [ ] **Health monitoring operational**
- [ ] **Performance metrics collecting**
- [ ] **Alert notifications configured**

### 5. Sub-Agent System Validation
- [ ] **AMP Refactoring Specialist agent operational**
- [ ] **CodeRabbit Integration agent functional**
- [ ] **Pieces Knowledge Manager agent working**
- [ ] **Health Monitor agent active**
- [ ] **Documentation Agent operational**

## WebSocket and Real-time Features

### 1. WebSocket Connection Testing
- [ ] **WebSocket endpoint accessible**
- [ ] **Connection establishment successful**
- [ ] **Message broadcasting working**
- [ ] **Connection persistence maintained**
- [ ] **Reconnection logic functional**

### 2. Real-time Data Validation
- [ ] **Dashboard live updates working**
- [ ] **Alert notifications real-time**
- [ ] **Campaign metrics updating live**
- [ ] **User activity tracking functional**
- [ ] **System health updates real-time**

## API Endpoints Validation

### 1. Authentication Endpoints
- [ ] **POST /api/v1/auth/login** - Working correctly
- [ ] **POST /api/v1/auth/register** - User creation functional
- [ ] **POST /api/v1/auth/refresh** - Token refresh working
- [ ] **GET /api/v1/auth/me** - User profile retrieval working
- [ ] **POST /api/v1/auth/logout** - Session termination working

### 2. Analytics Endpoints
- [ ] **GET /api/v1/analytics/dashboard** - Dashboard data loading
- [ ] **GET /api/v1/analytics/campaigns** - Campaign metrics available
- [ ] **POST /api/v1/analytics/export** - Export functionality working
- [ ] **GET /api/v1/analytics/geographic** - Geographic data available

### 3. Campaign Management
- [ ] **GET /api/v1/campaigns** - Campaign listing working
- [ ] **POST /api/v1/campaigns** - Campaign creation functional
- [ ] **GET /api/v1/campaigns/{id}** - Campaign details retrieval
- [ ] **PUT /api/v1/campaigns/{id}** - Campaign updates working
- [ ] **DELETE /api/v1/campaigns/{id}** - Campaign deletion working

### 4. Monitoring Endpoints
- [ ] **GET /api/v1/monitoring/health** - System health data
- [ ] **GET /api/v1/monitoring/alerts** - Alert system working
- [ ] **GET /api/v1/monitoring/crisis-alerts** - Crisis detection active

### 5. Admin Endpoints (if applicable)
- [ ] **GET /api/v1/platform/admin/users** - User management working
- [ ] **GET /api/v1/platform/admin/organizations** - Org management functional
- [ ] **GET /api/v1/platform/admin/metrics** - Platform metrics available

## Error Handling and Edge Cases

### 1. Error Response Validation
- [ ] **404 errors return proper JSON responses**
- [ ] **500 errors handled gracefully**
- [ ] **401/403 errors return appropriate messages**
- [ ] **Rate limit errors (429) handled correctly**
- [ ] **Validation errors (422) include field details**

### 2. Edge Case Testing
- [ ] **Large payload handling**
- [ ] **Concurrent request handling**
- [ ] **Database connection failure handling**
- [ ] **External API failure handling**
- [ ] **Cache failure fallback working**

### 3. Service Reliability
- [ ] **Service restart after crash**
- [ ] **Database connection retry logic**
- [ ] **External service timeout handling**
- [ ] **Memory leak prevention validated**
- [ ] **Long-running request timeout handling**

## Documentation and Maintenance

### 1. Documentation Updates
- [ ] **README.md updated with current deployment info**
- [ ] **API_DOCS.md reflects current endpoints**
- [ ] **Environment variables documented**
- [ ] **Deployment guide updated**
- [ ] **Troubleshooting guide available**

### 2. Maintenance Procedures
- [ ] **Backup and recovery procedures tested**
- [ ] **Update and rollback procedures documented**
- [ ] **Monitoring and alerting configured**
- [ ] **Support contact information updated**
- [ ] **Incident response plan documented**

## Final Production Readiness Checklist

### 1. Performance Benchmarks
- [ ] **Average response time < 2 seconds**
- [ ] **95th percentile response time < 5 seconds**
- [ ] **Error rate < 1%**
- [ ] **Uptime target 99.5%+**
- [ ] **Cache hit rate > 80%**

### 2. Security Compliance
- [ ] **All security headers implemented**
- [ ] **No secrets in logs or error messages**
- [ ] **Input validation on all endpoints**
- [ ] **Authentication required where appropriate**
- [ ] **Rate limiting protecting against abuse**

### 3. Scalability Preparation
- [ ] **Database queries optimized**
- [ ] **Indexes created for frequently accessed data**
- [ ] **Caching strategy implemented**
- [ ] **Horizontal scaling considerations documented**
- [ ] **Resource monitoring configured**

### 4. Business Continuity
- [ ] **Automated backups configured**
- [ ] **Disaster recovery plan documented**
- [ ] **Rollback procedures tested**
- [ ] **Contact escalation paths established**
- [ ] **Service status page configured**

## Rollback Procedures

### 1. Immediate Rollback (Critical Issues)
- [ ] **Rollback procedure**: Redeploy previous successful commit
- [ ] **Database rollback**: Restore from backup if schema changes
- [ ] **External service rollback**: Revert API configurations
- [ ] **Cache clearing**: Clear corrupted cache data
- [ ] **Monitoring reset**: Reset monitoring baselines

### 2. Rollback Validation
- [ ] **Service functionality restored**
- [ ] **All critical features working**
- [ ] **Performance benchmarks met**
- [ ] **No data corruption detected**
- [ ] **User experience fully restored**

## Post-Migration Monitoring

### 1. Initial 24-Hour Monitoring
- [ ] **Continuous service monitoring**
- [ ] **Performance metrics tracking**
- [ ] **Error rate monitoring**
- [ ] **User activity monitoring**
- [ ] **Resource usage monitoring**

### 2. Week 1 Validation
- [ ] **Service stability confirmed**
- [ ] **Performance benchmarks consistently met**
- [ ] **No critical issues reported**
- [ ] **User feedback positive**
- [ ] **All systems operating normally**

### 3. Long-term Success Metrics
- [ ] **Uptime SLA met (99.5%+)**
- [ ] **Response time SLA met (<2s average)**
- [ ] **Error rate below threshold (<1%)**
- [ ] **User satisfaction maintained**
- [ ] **Feature functionality complete**

## Sign-off Requirements

### Technical Sign-off
- [ ] **Lead Developer approval**
- [ ] **All technical validation completed**
- [ ] **Performance benchmarks met**
- [ ] **Security requirements satisfied**

### Business Sign-off
- [ ] **Product Owner approval**
- [ ] **All business requirements met**
- [ ] **User acceptance testing passed**
- [ ] **Stakeholder approval obtained**

### Operational Sign-off
- [ ] **DevOps/Infrastructure approval**
- [ ] **Monitoring and alerting configured**
- [ ] **Support procedures documented**
- [ ] **Backup and recovery verified**

---

## Migration Completion Certificate

**Migration Details:**
- **Date**: _________________
- **Version**: War Room v1.0
- **Platform**: Render.com
- **Service URL**: https://war-room-oa9t.onrender.com
- **Database**: Supabase PostgreSQL
- **Cache**: Render Redis

**Validation Summary:**
- **Total Checklist Items**: 150+
- **Items Completed**: ___/150+
- **Critical Issues**: ___
- **Performance Score**: ___/100
- **Security Score**: ___/100

**Sign-offs:**
- **Technical Lead**: _________________ Date: _________
- **Product Owner**: _________________ Date: _________
- **DevOps Engineer**: _________________ Date: _________

---

## Emergency Contacts

**Technical Issues:**
- **Primary**: Development Team Lead
- **Secondary**: Senior Backend Engineer
- **Escalation**: Technical Director

**Infrastructure Issues:**
- **Primary**: DevOps Engineer
- **Secondary**: Platform Administrator
- **Escalation**: Infrastructure Manager

**Business Issues:**
- **Primary**: Product Owner
- **Secondary**: Project Manager
- **Escalation**: Business Stakeholder

---

*Migration Checklist v1.0 | Last Updated: August 2025 | For War Room Platform*