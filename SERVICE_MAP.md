# War Room Service Map - UPDATED Aug 15, 2025

## ✅ ACTIVE PRODUCTION SERVICE
- **Service ID**: srv-d2csi9juibrs738r02rg
- **Service Name**: war-room-2025
- **URL**: https://war-room-app-2025.onrender.com
- **Status**: LIVE ✅ (Latest deployment: Aug 15, 2025)
- **Branch**: production
- **Purpose**: Live production environment
- **Last Verified**: Aug 15, 2025 - Slate gradients + 95% UI improvements deployed

## ✅ ACTIVE STAGING SERVICE
- **Service ID**: srv-d2eb2k0dl3ps73a2tc30  
- **Service Name**: one-0-war-room
- **URL**: https://one-0-war-room.onrender.com
- **Status**: LIVE ✅
- **Branch**: staging
- **Purpose**: Testing and user approval before production

## ❌ RETIRED SERVICES (DO NOT USE)
- **Service ID**: srv-d2epsjvdiees7384uf10
- **Service Name**: wr-staging (OLD)
- **URL**: https://one-0-war-room-ibqc.onrender.com
- **Status**: DECOMMISSIONED
- **Reason**: Service confusion led to deployment failures

## 🚨 DEPLOYMENT WORKFLOW
1. **Development**: Local testing at http://localhost:5173
2. **Staging**: Deploy to srv-d2eb2k0dl3ps73a2tc30 for user approval
3. **Production**: Deploy to srv-d2csi9juibrs738r02rg after staging approval

## Build Configuration 

### Production Service (srv-d2csi9juibrs738r02rg)
```bash
# Build Command
pip install -r requirements.txt && npm install && npm run build

# Start Command  
cd src/backend && python serve_bulletproof.py
```

### Staging Service (srv-d2eb2k0dl3ps73a2tc30)
```bash
# Build Command
pip install -r requirements.txt && rm -rf node_modules package-lock.json && npm install && npm run build

# Start Command  
cd src/backend && python serve_bulletproof.py
```

## Required Environment Variables
```
PYTHON_VERSION=3.11.9
NODE_VERSION=20.11.1
RENDER_ENV=staging
SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Quick Status Check Commands
```bash
# Check production deployment status
RENDER_API_KEY="rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K" ./scripts/render-api.sh get-deployments srv-d2csi9juibrs738r02rg

# Check staging deployment status  
RENDER_API_KEY="rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K" ./scripts/render-api.sh get-deployments srv-d2eb2k0dl3ps73a2tc30

# Verify visual deployment
./scripts/verify-visual-deployment.sh https://war-room-app-2025.onrender.com
```

## Dashboard Links
- **Production Service**: https://dashboard.render.com/web/srv-d2csi9juibrs738r02rg  
- **Staging Service**: https://dashboard.render.com/web/srv-d2eb2k0dl3ps73a2tc30
- **OLD Service (ignore)**: https://dashboard.render.com/web/srv-d2epsjvdiees7384uf10

## Emergency Contacts & Procedures
- **Visual Issues**: Run `./scripts/verify-visual-deployment.sh [URL]` 
- **Deployment Failures**: Check render logs via dashboard or API
- **CSS Problems**: Run `./scripts/check-css-safety.sh` before deployment
- **Rollback**: Use git reset or Render dashboard rollback feature
