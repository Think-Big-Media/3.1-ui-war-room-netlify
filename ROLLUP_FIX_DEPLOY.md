# Rollup Fix Deployment

## Build Command (Copy this to Render):
```
cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install --verbose --omit=optional && rm -rf node_modules/rollup/dist/native.js && npm run build
```

## Environment Variable Required:
- ROLLUP_SKIP_NODE_BUILD = true

## Deployment Triggered: 
Mon Aug 11 17:19:39 CEST 2025
