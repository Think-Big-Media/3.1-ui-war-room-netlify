# Render.com Deployment Guide for War Room

## Prerequisites
1. GitHub account (you have this ✓)
2. Render.com account (free to create)

## Step 1: Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account (recommended for easy integration)

## Step 2: Connect GitHub Repository
1. In Render Dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Select repository: `Think-Big-Media/1.0-war-room`
5. Select branch: `feature/automation-engine`

## Step 3: Configure Service
Render should auto-detect the `render.yaml` file. If not, use these settings:

- **Name**: war-room (or your preferred name)
- **Region**: Oregon (US West)
- **Branch**: feature/automation-engine
- **Root Directory**: Leave blank (it will find 1.0-war-room)
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python render_app.py`

## Step 4: Deploy
1. Click "Create Web Service"
2. Render will start building your app
3. Watch the logs for any errors
4. Once deployed, you'll get a URL like: `https://war-room.onrender.com`

## Step 5: Add Databases (Optional for now)
After the web service is running:
1. Go to Dashboard → "New +" → "PostgreSQL"
2. Create with free tier settings
3. Note the connection string for later use

## Step 6: Verify Deployment
Visit these endpoints:
- `https://your-app.onrender.com/` - Should show success message
- `https://your-app.onrender.com/health` - Should return healthy status
- `https://your-app.onrender.com/api/v1/status` - API status check

## Troubleshooting

### If build fails:
1. Check build logs for missing dependencies
2. Ensure requirements.txt is in the repository
3. Verify Python version compatibility

### If deploy succeeds but app doesn't work:
1. Check deploy logs for startup errors
2. Verify PORT environment variable is being used
3. Check health endpoint

## Environment Variables
Add these in Render dashboard → Environment:
```
PYTHON_VERSION=3.11.0
RENDER_ENV=production
# Add other secrets as needed later
```

## Next Steps
Once basic deployment works:
1. Add PostgreSQL database
2. Add Redis cache
3. Configure custom domain
4. Set up environment variables for API keys
5. Enable auto-deploy from GitHub

## Free Tier Limitations
- App sleeps after 15 min inactivity (spins up in ~30s)
- Limited to 512MB RAM
- No custom domain on free tier
- Manual deploys only (can enable auto-deploy)

## Support
- Render Status: https://status.render.com
- Render Docs: https://render.com/docs
- Community Forum: https://community.render.com