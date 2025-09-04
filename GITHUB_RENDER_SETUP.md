# GitHub to Render Deployment Setup

## Overview
This guide explains how to configure GitHub Actions to deploy to the existing Render service `war-room-oa9t`.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. Get Your Render Deploy Hook URL (Recommended)

1. **Login to Render Dashboard**
2. **Navigate to your service:** war-room-oa9t
3. **Go to Settings tab**
4. **Find "Deploy Hook" section**
5. **Copy the Deploy Hook URL**

### 2. Add Secrets to GitHub

1. **Go to your GitHub repository**
2. **Navigate to Settings → Secrets and variables → Actions**
3. **Add the following secrets:**

#### Required Secret:
```
RENDER_DEPLOY_HOOK_URL = <Your Deploy Hook URL from Render>
```

#### Optional (for API-based deployment):
```
RENDER_API_KEY = <Your Render API Key>
```

To get your Render API Key:
1. Go to Render Dashboard → Account Settings
2. Navigate to API Keys
3. Create a new API key or use existing one
4. Copy and add to GitHub Secrets

## How It Works

### Automatic Deployment (Current Setup)
- Render is already configured to auto-deploy when you push to the main branch
- The service `war-room-oa9t` monitors the GitHub repository
- Any push to `main` triggers automatic deployment

### Manual Deployment via GitHub Actions
- The workflow `deploy-render.yml` can trigger deployments manually
- Uses the Deploy Hook URL to trigger Render deployment
- Monitors deployment status and reports success/failure

### CI/CD Pipeline
- The main `ci-cd.yml` workflow runs tests and validations
- On successful push to `main`, it triggers deployment to war-room-oa9t
- Uses either Deploy Hook or Git integration for deployment

## Verifying the Setup

### 0. Deployment Targets (Authoritative)
- **Service ID (Render)**: `srv-d1ub5iumcj7s73ebrpo0`
- **Service Name (Render)**: `war-room-oa9t`
- **Production URL**: `https://war-room-oa9t.onrender.com`
- These identifiers are used by workflows and scripts to ensure deployments hit the correct service.

### 1. Check Current Service
Confirm your local configs and workflows point to the correct service:
- **Service ID:** `srv-d1ub5iumcj7s73ebrpo0`
- **Service Name:** `war-room-oa9t`
- **URL:** `https://war-room-oa9t.onrender.com`

### 2. Test Deployment
After setting up secrets, test the deployment:

```bash
# Make a small change
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: verify Render deployment"
git push origin main
```

### 3. Monitor Deployment
- Check GitHub Actions tab for workflow status
- Monitor Render dashboard for deployment progress
- Verify site is live at https://war-room-oa9t.onrender.com

## Troubleshooting

### Verify you are on the correct Render account
- In the Render dashboard, check the account/org at the top-right avatar. Ensure it matches the owner of `war-room-oa9t`.
- If using API-based deploys, verify the API key belongs to that same account:
  ```bash
  curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services/srv-d1ub5iumcj7s73ebrpo0" | jq '.id,.name'
  # Expect: the ID above and a name containing "war-room"
  ```

### Issue: Deployment not triggering
- **Solution:** Ensure Render service has GitHub integration enabled
- Check Render Dashboard → Settings → GitHub Connection

### Issue: GitHub Actions failing
- **Solution:** Verify RENDER_DEPLOY_HOOK_URL secret is set correctly
- Check workflow logs in GitHub Actions tab

### Issue: Wrong service being deployed
- **Solution:** Workflows are hardcoded to use `war-room-oa9t`
- No configuration changes needed

### Issue: Service not found (404 or empty list)
- **Likely causes:**
  - The API key belongs to a different Render account/organization
  - The service ID is incorrect or from another environment
  - Using name-based lookup returned nothing (insufficient permissions)
- **Resolutions:**
  1. Validate API key ownership:
     ```bash
     curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
       "https://api.render.com/v1/services/srv-d1ub5iumcj7s73ebrpo0" | jq '.id,.name,.serviceDetails'
     ```
     Expect a 200 status and the matching ID.
  2. List services and search explicitly:
     ```bash
     curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
       "https://api.render.com/v1/services?limit=100" | jq -r '.[] | "\(.id) \(.name)"' | grep -i "war-room"
     ```
  3. Ensure workflows/env include the correct ID:
     - `RENDER_SERVICE_ID=srv-d1ub5iumcj7s73ebrpo0`
     - `RENDER_DEPLOY_HOOK_URL=<from Render service Settings>`
  4. If still failing, re-check that you’re in the correct Render org and have access to the service.

## Current Configuration

The following files are configured for war-room-oa9t deployment:

1. **`.github/workflows/deploy-render.yml`**
   - Manual deployment workflow
   - Targets war-room-oa9t specifically

2. **`.github/workflows/ci-cd.yml`**
   - Main CI/CD pipeline
   - Deploys to war-room-oa9t on push to main

3. **`.github/workflows/keep-warm.yml`**
   - Keeps the service warm
   - Pings war-room-oa9t.onrender.com every 10 minutes

## Important Notes

- **Service ID is hardcoded:** The workflows specifically target `war-room-oa9t`
- **No account switching:** The deployment uses the existing service
- **Auto-deploy enabled:** Render automatically deploys on push to main
- **Keep-warm active:** GitHub Actions prevents cold starts

## Next Steps

1. **Add RENDER_DEPLOY_HOOK_URL to GitHub Secrets**
2. **Test deployment with a commit to main**
3. **Monitor Render dashboard for deployment status**
4. **Verify live site at https://war-room-oa9t.onrender.com**