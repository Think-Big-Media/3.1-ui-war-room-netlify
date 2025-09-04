# War Room Deployment Checklist

## Overview

This comprehensive checklist ensures reliable, repeatable deployments of the War Room platform to Render.com. Follow each step in order and verify completion before proceeding to the next phase.

## Table of Contents

- [Pre-Deployment Phase](#pre-deployment-phase)
- [Code Preparation Phase](#code-preparation-phase)
- [Environment Configuration Phase](#environment-configuration-phase)
- [Git Operations Phase](#git-operations-phase)
- [Render Deployment Phase](#render-deployment-phase)
- [Post-Deployment Testing Phase](#post-deployment-testing-phase)
- [Monitoring and Verification Phase](#monitoring-and-verification-phase)
- [Emergency Rollback Procedures](#emergency-rollback-procedures)

---

## Pre-Deployment Phase

### Development Environment Verification

- [ ] **Local Build Test**
  ```bash
  # Test frontend build
  cd src/frontend
  npm install
  npm run build
  
  # Test backend setup
  cd ../backend
  pip install -r requirements.txt
  python serve_bulletproof.py
  ```

- [ ] **Frontend Structure Verification** *(Critical - Recent Fix)*
  - [ ] Verify integrations are consolidated to single location
  - [ ] Check for duplicate component structures
  - [ ] Confirm import paths are correct and unified
  - [ ] No duplicate directories (e.g., multiple integrations folders)

- [ ] **Test Suite Execution**
  - [ ] Frontend tests pass: `npm test`
  - [ ] Backend tests pass: `pytest`
  - [ ] Integration tests pass
  - [ ] No critical test failures

- [ ] **Code Quality Checks**
  - [ ] ESLint passes: `npm run lint`
  - [ ] TypeScript compilation: `npm run type-check`
  - [ ] Python linting passes
  - [ ] No security vulnerabilities in dependencies

- [ ] **Database Migration Readiness**
  - [ ] All migrations tested locally
  - [ ] Migration scripts are idempotent
  - [ ] Backup procedures documented
  - [ ] Rollback migrations prepared

### Environment and Dependencies

- [ ] **Node.js and Python Versions**
  - [ ] Node.js version matches production (20.11.1+)
  - [ ] Python version matches production (3.11+)
  - [ ] Package versions locked in package-lock.json and requirements.txt

- [ ] **Environment Variables Documentation**
  - [ ] All required environment variables documented
  - [ ] Production values prepared (but not committed to git)
  - [ ] Sensitive data stored securely
  - [ ] Environment variable validation script tested

---

## Code Preparation Phase

### Code Quality and Structure

- [ ] **Code Review Complete**
  - [ ] All changes peer-reviewed
  - [ ] No TODO/FIXME comments in critical code
  - [ ] Code follows established patterns
  - [ ] Frontend consolidation verified

- [ ] **Import Path Consolidation** *(Critical - Recent Fix)*
  - [ ] All integration imports use single unified path
  - [ ] No broken import references
  - [ ] Components properly exported from index files
  - [ ] No circular dependencies

- [ ] **Documentation Updates**
  - [ ] README.md updated with latest changes
  - [ ] API documentation current
  - [ ] CHANGELOG.md updated
  - [ ] Deployment notes documented

- [ ] **Security Review**
  - [ ] No hardcoded credentials or secrets
  - [ ] API keys properly managed
  - [ ] Authentication flows tested
  - [ ] CORS settings configured correctly

### Performance Optimization

- [ ] **Bundle Size Optimization**
  - [ ] Webpack bundle analysis completed
  - [ ] Large dependencies identified and optimized
  - [ ] Code splitting implemented where beneficial
  - [ ] Assets optimized (images, fonts, etc.)

- [ ] **Database Optimization**
  - [ ] Query performance analyzed
  - [ ] Indexes added where necessary
  - [ ] Connection pooling configured
  - [ ] Slow query monitoring enabled

---

## Environment Configuration Phase

### Render.com Service Configuration

- [ ] **Service Settings Verified**
  - [ ] Runtime: Python 3.11
  - [ ] Build command correct
  - [ ] Start command: `cd src/backend && python serve_bulletproof.py`
  - [ ] Health check path: `/health`
  - [ ] Auto-deploy enabled on main branch

- [ ] **Environment Variables Set**
  
  **Core Variables:**
  - [ ] `PYTHON_VERSION=3.11`
  - [ ] `NODE_VERSION=20.11.1`
  - [ ] `RENDER_ENV=production`
  - [ ] `DATABASE_URL` (Supabase PostgreSQL)
  - [ ] `REDIS_URL` (Redis cache)
  - [ ] `JWT_SECRET` (256-bit secret)

  **Authentication & Security:**
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `SUPABASE_ANON_KEY`

  **Optional but Recommended:**
  - [ ] `SENTRY_DSN` (Error tracking)
  - [ ] `POSTHOG_API_KEY` (Analytics)
  - [ ] `OPENAI_API_KEY` (AI features)
  - [ ] `PINECONE_API_KEY` (Vector database)

  **External Integrations:**
  - [ ] `META_APP_ID` and `META_APP_SECRET`
  - [ ] `GOOGLE_ADS_DEVELOPER_TOKEN`

### External Services Verification

- [ ] **Database (Supabase)**
  - [ ] Connection string tested
  - [ ] Database accessible from Render
  - [ ] SSL configuration correct
  - [ ] Backup schedule verified

- [ ] **Redis Cache**
  - [ ] Redis instance provisioned
  - [ ] Connection URL configured
  - [ ] Cache policies set
  - [ ] Memory limits configured

- [ ] **External APIs**
  - [ ] All API keys valid and active
  - [ ] Rate limits understood and configured
  - [ ] Authentication flows tested
  - [ ] Fallback mechanisms in place

---

## Git Operations Phase

### Repository Preparation

- [ ] **Branch Management**
  - [ ] Working on correct branch (main/production)
  - [ ] All feature branches merged
  - [ ] No uncommitted changes
  - [ ] Local branch up to date with remote

- [ ] **Commit and Push**
  ```bash
  # Verify git status
  git status
  
  # Add all changes
  git add .
  
  # Commit with descriptive message
  git commit -m "Deploy: [Brief description of changes]
  
  Key changes:
  - Fixed frontend consolidation issue
  - Updated import paths
  - [Other significant changes]
  
  Deployment ready: All tests passing, environment configured"
  
  # Push to main branch
  git push origin main
  ```

- [ ] **Version Tagging**
  ```bash
  # Create version tag
  git tag -a v1.0.x -m "Production deployment v1.0.x"
  git push origin v1.0.x
  ```

### Pre-Deploy Verification

- [ ] **Repository State**
  - [ ] No build artifacts committed
  - [ ] .gitignore properly configured
  - [ ] No sensitive data in repository
  - [ ] All necessary files included

---

## Render Deployment Phase

### Deployment Initiation

- [ ] **Manual Deployment Trigger** (if auto-deploy disabled)
  1. Go to Render Dashboard
  2. Select War Room service
  3. Click "Manual Deploy"
  4. Select main branch
  5. Confirm deployment

- [ ] **Build Monitoring**
  - [ ] Monitor build logs in real-time
  - [ ] Verify frontend build completes successfully
  - [ ] Verify backend dependencies install
  - [ ] No build errors or warnings

### Build Process Verification

- [ ] **Frontend Build Phase**
  ```
  Expected Log Output:
  ✓ npm install completed
  ✓ npm run build completed
  ✓ Build artifacts in dist/ folder
  ✓ Asset optimization completed
  ```

- [ ] **Backend Setup Phase**
  ```
  Expected Log Output:
  ✓ Python dependencies installed
  ✓ Environment variables loaded
  ✓ Database connection verified
  ✓ Server starting on port 5000
  ```

- [ ] **Health Check Success**
  ```
  Expected Log Output:
  ✓ Health check endpoint responding
  ✓ Service marked as healthy
  ✓ Deployment status: Live
  ```

### Deployment Timeline Expectations

- [ ] **Build Phase: 3-8 minutes**
  - Frontend build: 2-4 minutes
  - Backend setup: 1-3 minutes
  - Asset processing: 1-2 minutes

- [ ] **Start Phase: 30-60 seconds**
  - Server initialization
  - Database connection
  - Health check response

- [ ] **Go-Live: Total 5-10 minutes**

---

## Post-Deployment Testing Phase

### Basic Functionality Tests

- [ ] **Service Health Verification**
  ```bash
  # Basic health check
  curl https://war-room-oa9t.onrender.com/health
  # Expected: {"status": "healthy", "timestamp": "..."}
  
  # API health check
  curl https://war-room-oa9t.onrender.com/api/v1/health
  # Expected: {"status": "healthy", "version": "1.0", "database": "connected"}
  ```

- [ ] **Frontend Accessibility**
  ```bash
  # Test homepage
  curl -I https://war-room-oa9t.onrender.com/
  # Expected: 200 OK
  
  # Test static assets
  curl -I https://war-room-oa9t.onrender.com/assets/index.css
  # Expected: 200 OK
  ```

### Critical User Flows

- [ ] **Authentication Flow**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Password reset works
  - [ ] JWT tokens properly issued
  - [ ] Session persistence works

- [ ] **Core Features** *(Verify Recent Frontend Fixes)*
  - [ ] Dashboard loads without errors
  - [ ] Campaign control accessible
  - [ ] Analytics data displays
  - [ ] Real-time monitoring functions
  - [ ] Integration components load properly

- [ ] **API Endpoints**
  - [ ] GET /api/v1/campaigns (200 response)
  - [ ] POST /api/v1/campaigns (with auth)
  - [ ] WebSocket connections establish
  - [ ] Real-time updates function

### Performance Testing

- [ ] **Response Time Verification**
  ```bash
  # Measure response times
  curl -w "%{time_total}\n" -s -o /dev/null https://war-room-oa9t.onrender.com/
  # Expected: < 3 seconds
  
  curl -w "%{time_total}\n" -s -o /dev/null https://war-room-oa9t.onrender.com/api/v1/health
  # Expected: < 1 second
  ```

- [ ] **Load Testing** (Optional for production)
  - [ ] Multiple concurrent users supported
  - [ ] No memory leaks under load
  - [ ] Graceful degradation under stress

---

## Monitoring and Verification Phase

### Error Tracking and Monitoring

- [ ] **Sentry Configuration**
  - [ ] Error tracking active
  - [ ] No critical errors reported
  - [ ] Performance monitoring enabled
  - [ ] Alert notifications configured

- [ ] **Application Logs**
  - [ ] Application logs clean
  - [ ] No recurring errors
  - [ ] Database queries performing well
  - [ ] External API calls succeeding

### Real-time Monitoring

- [ ] **Service Metrics** (In Render Dashboard)
  - [ ] CPU usage normal (< 80%)
  - [ ] Memory usage normal (< 80%)
  - [ ] Response times acceptable (< 3s)
  - [ ] Error rate low (< 1%)

- [ ] **External Service Health**
  - [ ] Supabase database responsive
  - [ ] Redis cache operational
  - [ ] External APIs responding
  - [ ] CDN/asset delivery working

### User Acceptance Testing

- [ ] **Stakeholder Verification**
  - [ ] Key stakeholders notified of deployment
  - [ ] Core functionality demonstrated
  - [ ] No user-reported issues
  - [ ] Performance meets expectations

---

## Emergency Rollback Procedures

### Immediate Rollback Triggers

Initiate rollback if any of these conditions occur:

- [ ] Service health check fails consistently (> 3 minutes)
- [ ] Critical functionality broken (auth, core features)
- [ ] Database connectivity issues
- [ ] Performance degradation > 50%
- [ ] Security vulnerabilities exposed

### Rollback Process

- [ ] **Option 1: Render Dashboard Rollback**
  1. Go to Render Dashboard → Service → Deployments
  2. Find last successful deployment
  3. Click "Redeploy" on stable version
  4. Monitor deployment completion
  5. Verify service restoration

- [ ] **Option 2: Git Revert and Redeploy**
  ```bash
  # Identify last working commit
  git log --oneline -5
  
  # Revert to stable commit
  git revert --no-commit HEAD~1..HEAD
  git commit -m "EMERGENCY ROLLBACK: Revert to stable version"
  
  # Push to trigger auto-deployment
  git push origin main
  ```

### Post-Rollback Actions

- [ ] **Immediate Verification**
  - [ ] Service health restored
  - [ ] Core functionality working
  - [ ] Users can access system
  - [ ] No data loss occurred

- [ ] **Communication**
  - [ ] Notify stakeholders of rollback
  - [ ] Document incident details
  - [ ] Schedule post-mortem meeting
  - [ ] Update status page if applicable

- [ ] **Investigation**
  - [ ] Analyze deployment logs
  - [ ] Identify root cause
  - [ ] Plan corrective measures
  - [ ] Update deployment procedures

---

## Deployment Success Criteria

### Technical Success Indicators

- [ ] All health checks passing consistently for 15+ minutes
- [ ] Response times within acceptable limits (< 3 seconds)
- [ ] Error rate below 1%
- [ ] No memory leaks or resource exhaustion
- [ ] All external integrations functioning

### Business Success Indicators

- [ ] Core user workflows functional
- [ ] No user-reported critical issues
- [ ] Performance meets or exceeds previous version
- [ ] All critical features accessible
- [ ] Data integrity maintained

### Monitoring Setup Complete

- [ ] Automated health monitoring active
- [ ] Alert notifications configured
- [ ] Performance tracking enabled
- [ ] Error reporting functional
- [ ] Backup procedures verified

---

## Post-Deployment Activities

### Documentation Updates

- [ ] **Deployment Log**
  - [ ] Record deployment timestamp
  - [ ] Note any issues encountered
  - [ ] Document resolution steps
  - [ ] Update lessons learned

- [ ] **System Documentation**
  - [ ] Update API documentation if changed
  - [ ] Record configuration changes
  - [ ] Update troubleshooting guides
  - [ ] Document new features deployed

### Team Communication

- [ ] **Deployment Notification**
  - [ ] Notify development team
  - [ ] Inform stakeholders of completion
  - [ ] Update project management tools
  - [ ] Schedule post-deployment review

### Continuous Improvement

- [ ] **Process Evaluation**
  - [ ] Review deployment process effectiveness
  - [ ] Identify areas for improvement
  - [ ] Update checklist if needed
  - [ ] Plan automation opportunities

---

## Quick Reference Commands

### Essential Health Checks
```bash
# Service health
curl https://war-room-oa9t.onrender.com/health

# API health
curl https://war-room-oa9t.onrender.com/api/v1/health

# Response time test
curl -w "%{time_total}\n" -s -o /dev/null https://war-room-oa9t.onrender.com/
```

### Emergency Contacts

- **Development Team Lead**: [Contact Info]
- **DevOps/Infrastructure**: [Contact Info]
- **Product Owner**: [Contact Info]
- **Emergency Hotline**: [Contact Info]

### Useful Links

- **Render Dashboard**: https://dashboard.render.com/
- **Service URL**: https://war-room-oa9t.onrender.com/
- **GitHub Repository**: [Repository URL]
- **Error Tracking (Sentry)**: [Sentry URL]
- **Analytics (PostHog)**: [PostHog URL]

---

## Checklist Summary

**Phase 1 - Pre-Deployment:** ☐ Complete
**Phase 2 - Code Preparation:** ☐ Complete  
**Phase 3 - Environment Config:** ☐ Complete
**Phase 4 - Git Operations:** ☐ Complete
**Phase 5 - Render Deployment:** ☐ Complete
**Phase 6 - Post-Deployment Testing:** ☐ Complete
**Phase 7 - Monitoring & Verification:** ☐ Complete

**Deployment Status:** ☐ Successful ☐ Rollback Required

**Deployment Sign-off:**
- Technical Lead: _________________ Date: _______
- Product Owner: _________________ Date: _______
- DevOps Engineer: _______________ Date: _______

---

*Deployment Checklist v1.0 | Last Updated: August 2025 | War Room Platform*
*Critical: This checklist includes recent frontend consolidation fixes*