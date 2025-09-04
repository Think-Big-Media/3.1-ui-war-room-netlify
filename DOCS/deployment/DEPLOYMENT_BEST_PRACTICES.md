# War Room Deployment Best Practices

## 🚀 Deployment Health Checks

### After Every Deploy

1. **Run the validation script:**
   ```bash
   ./scripts/validate-render-deployment-simple.sh
   ```

2. **Check key endpoints manually:**
   - Frontend: https://war-room-oa9t.onrender.com/
   - Health: https://war-room-oa9t.onrender.com/health
   - API Docs: https://war-room-oa9t.onrender.com/docs

3. **Monitor deployment logs:**
   - Check Render dashboard for build/deploy logs
   - Look for any error patterns or warnings

## 🛡️ Bulletproof Server Strategy

### Why serve_bulletproof.py?

The bulletproof server (`src/backend/serve_bulletproof.py`) is our fallback strategy that:
- Bypasses complex import chains that can fail in production
- Provides minimal but essential functionality
- Ensures the site stays up even if main app has issues
- Serves both frontend and basic API endpoints

### When to Use It

- **Primary deployment method** - Currently active
- **Fallback option** - If main.py encounters import issues
- **Quick recovery** - Faster startup, fewer dependencies

## 📁 Configuration Best Practices

### render.yaml Guidelines

1. **Keep it minimal** - Only essential configuration
2. **No rootDir** - Avoid path resolution issues
3. **Clear build commands** - Explicit directory changes
4. **Environment variables** - Use Render dashboard for secrets

### Essential Environment Variables

```yaml
# Required for all deployments
PYTHON_VERSION: "3.11.0"
NODE_VERSION: "18.17.0"
RENDER_ENV: "production"
SECRET_KEY: (auto-generated)

# Feature flags - adjust as needed
ENABLE_ANALYTICS: "true"
ENABLE_AUTOMATION: "true"
ENABLE_DOCUMENT_INTELLIGENCE: "false"
```

## 🔍 Monitoring & Logging

### Deployment Logs Structure

```
/logs/
├── deployments/
│   ├── 2025-08-04-deployment.log
│   └── 2025-08-04-validation.log
├── errors/
│   └── 2025-08-04-errors.log
└── performance/
    └── 2025-08-04-metrics.log
```

### What to Monitor

1. **Build Times** - Should be < 5 minutes
2. **Startup Time** - Should be < 30 seconds
3. **Health Check Response** - Should be < 1 second
4. **Memory Usage** - Should stay under limit
5. **Error Rates** - Should be < 1%

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

1. **Import Errors**
   - Switch to serve_bulletproof.py
   - Check PYTHONPATH in logs
   - Verify all dependencies installed

2. **Frontend Not Loading**
   - Check if dist/ was built
   - Verify static file serving
   - Check browser console for errors

3. **Slow Response Times**
   - Check Render metrics dashboard
   - Look for memory pressure
   - Consider upgrading plan

4. **Build Failures**
   - Check Node/Python versions
   - Verify package.json/requirements.txt
   - Look for disk space issues

## ✅ Deployment Checklist

Before deploying:
- [ ] Run tests locally
- [ ] Check for security vulnerabilities
- [ ] Update environment variables if needed
- [ ] Review render.yaml for accuracy
- [ ] Backup database if applicable

After deploying:
- [ ] Run validation script
- [ ] Check all endpoints
- [ ] Monitor logs for 5 minutes
- [ ] Test critical user flows
- [ ] Update deployment documentation

## 🔄 Continuous Improvement

### Regular Maintenance

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Update dependencies

2. **Monthly**
   - Security audit
   - Performance optimization
   - Documentation updates

3. **Quarterly**
   - Architecture review
   - Cost optimization
   - Disaster recovery test

## 📞 Emergency Contacts

- **Render Status**: https://status.render.com/
- **Render Support**: support@render.com
- **Project Repository**: https://github.com/Think-Big-Media/1.0-war-room

---

Last Updated: August 4, 2025