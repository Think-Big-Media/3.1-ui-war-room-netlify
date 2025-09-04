# RENDER IS BROKEN - CTO INSTRUCTIONS

## THE PROBLEM
Render is serving code from WEEKS AGO. Not updating at all.
- Evidence: Old logo, no OAuth, no diagnostics, same JS hash for hours

## THE SOLUTION - DO THIS NOW

### Option 1: Force Render to Reconnect (Try First)
1. Go to Render Dashboard
2. Go to Settings > Build & Deploy
3. **CHECK THE BRANCH** - It should be `main` not `feature/automation-engine`
4. If wrong branch, change to `main`
5. **CHECK THE REPO** - Should be `Think-Big-Media/1.0-war-room`
6. Go to Manual Deploy
7. Click "Clear build cache & deploy"

### Option 2: Nuclear Option (If Option 1 Fails)
1. Create a NEW Render service
2. Name it `war-room-v2` or similar
3. Connect to GitHub repo `Think-Big-Media/1.0-war-room`
4. Select `main` branch
5. Set build command:
   ```
   cd src/backend && pip install -r requirements.txt && cd ../.. && npm ci && npm run build
   ```
6. Set start command:
   ```
   cd src/backend && python3 serve_bulletproof.py
   ```
7. Deploy
8. Update DNS to point to new service

## WHY THIS HAPPENED
- Render got stuck on old deployment
- Possibly deploying from wrong branch
- Or build cache corrupted
- Or GitHub webhook broken

## VERIFICATION
After deploy, check:
1. Logo should be glassmorphic "WR" not image
2. OAuth section should appear (or show diagnostic errors)
3. `/health` should return deploy_hash

## DO NOT
- Add more code
- Add more diagnostics  
- Keep debugging the symptoms

Just fix the deployment pipeline or create a new one.