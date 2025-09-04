# 🎯 WAR ROOM DEPLOYMENT SERVICE MAP

**CRITICAL**: This is the single source of truth for all deployments.

## ACTIVE PRODUCTION SERVICES

### PRIMARY PRODUCTION SERVICE
- **Service Name**: `war-room-production`
- **Service ID**: `srv-d2csi9juibrs738r02rg`
- **URL**: `https://war-room-app-2025.onrender.com`
- **Branch**: `production`
- **Status**: ACTIVE
- **Purpose**: Main production deployment

### STAGING SERVICE  
- **Service Name**: `staging`
- **Service ID**: `srv-d2eb2k0dl3ps73a2tc30`
- **URL**: `https://one-0-war-room.onrender.com`
- **Branch**: `staging`
- **Status**: ACTIVE
- **Purpose**: Testing before production

## SUSPENDED/LEGACY SERVICES
- `war-room-2025` (srv-d2dm57mmcj7s73c76dh0) → SUSPENDED
- `war-room` (srv-d1ub5iumcj7s73ebrpo0) → SUSPENDED  
- `defunkt` (srv-d2eamb8dl3ps73a2ddk0) → SUSPENDED

## DEPLOYMENT COMMANDS

### Deploy to Production
```bash
# ALWAYS use this for production deployments
RENDER_API_KEY="rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K" ./scripts/render-api.sh trigger-deploy srv-d2csi9juibrs738r02rg
```

### Deploy to Staging
```bash
# Use this for testing
RENDER_API_KEY="rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K" ./scripts/render-api.sh trigger-deploy srv-d2eb2k0dl3ps73a2tc30
```

## DEPLOYMENT CHECKLIST

### BEFORE EVERY DEPLOYMENT:
1. ✅ Confirm target service ID
2. ✅ Verify correct branch (production/staging)
3. ✅ Check service is not suspended
4. ✅ Confirm URL matches expectation

### REQUIRED FIXES APPLIED:
- ✅ runtime.txt: `3.11.0` (not `python-3.11`)
- ✅ Build command: `pip install -r src/backend/requirements.txt && npm install && npm run build`
- ✅ CSS: slate gradients (not purple)
- ✅ No debug console logs

## VERIFICATION URLS

After deployment, verify these URLs show War Room interface:
- **Production**: https://war-room-app-2025.onrender.com
- **Staging**: https://one-0-war-room.onrender.com

## ERROR PREVENTION

❌ **NEVER deploy to suspended services**
❌ **NEVER guess service IDs** 
❌ **ALWAYS verify URL after deployment**
✅ **ALWAYS use this document as reference**