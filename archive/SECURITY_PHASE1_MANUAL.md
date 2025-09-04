# Security Phase 1: Manual Configuration Guide

## ✅ Completed
- [x] SECRET_KEY updated and deployed

## 🔧 Manual Environment Variable Updates

### Backend Service (war-room)
Go to: https://dashboard.render.com/web/srv-d1ub5iumcj7s73ebrpo0/env

Add these environment variables:

```bash
# Rate Limiting (HIGH PRIORITY)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# CORS Security (HIGH PRIORITY)
BACKEND_CORS_ORIGINS=https://war-room-frontend-tzuk.onrender.com

# Security Headers
SECURE_HEADERS_ENABLED=true
ALLOWED_HOSTS=war-room-oa9t.onrender.com

# Session Security
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict

# Logging
LOG_LEVEL=WARNING
LOG_SENSITIVE_DATA=false

# Database
DATABASE_SSL_MODE=require
```

### Frontend Service (war-room-frontend)
Go to: https://dashboard.render.com/static/srv-d1ubheer433s73eipllg/env

Update/Add these:

```bash
# API Configuration
VITE_API_URL=https://war-room-oa9t.onrender.com
VITE_API_TIMEOUT=30000

# Security
VITE_ENABLE_SECURITY_HEADERS=true
```

## 🚀 Deployment Steps

1. **Backend First**:
   - Add all backend environment variables
   - Click "Save Changes"
   - Manual deploy will start automatically

2. **Frontend Second**:
   - Add frontend environment variables
   - Click "Save Changes"
   - Manual deploy will start

3. **Verification** (after both deployments complete):
   ```bash
   # Test rate limiting
   for i in {1..110}; do 
     curl -s https://war-room-oa9t.onrender.com/health
   done
   # Should see rate limit errors after 100 requests
   
   # Test CORS
   curl -H "Origin: https://example.com" \
        -I https://war-room-oa9t.onrender.com/health
   # Should NOT see Access-Control-Allow-Origin header
   ```

## 📊 Quick Monitoring Setup

### Option 1: Sentry (Recommended)
1. Sign up at https://sentry.io
2. Create new project (Python for backend, React for frontend)
3. Add to backend env: `SENTRY_DSN=your-dsn-here`
4. Add to frontend env: `VITE_SENTRY_DSN=your-frontend-dsn`

### Option 2: Basic Uptime Monitoring
- Use Render's built-in health checks
- Or sign up for free tier at:
  - UptimeRobot.com
  - Pingdom.com
  - StatusCake.com

## ⏱️ Time Estimate
- Environment variable updates: 5 minutes
- Deployments: 10 minutes
- Verification: 5 minutes
- **Total: ~20 minutes**

## 🎯 Success Criteria
- [ ] Rate limiting returns 429 after limit
- [ ] CORS blocks unauthorized origins
- [ ] HTTPS enforced on all endpoints
- [ ] Logs don't contain sensitive data
- [ ] Health checks still passing

## 🚨 If Something Goes Wrong
1. Remove problematic environment variables
2. Redeploy
3. Check logs for specific errors
4. Rollback to previous deployment if needed

---

**Next**: After Phase 1 is complete, move to Phase 2 (CSP headers, Sentry, audit logging)