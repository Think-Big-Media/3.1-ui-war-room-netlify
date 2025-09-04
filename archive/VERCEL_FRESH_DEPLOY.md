# Vercel Fresh Deployment Instructions

## Quick Fix Commands (if you have Vercel CLI)
```bash
vercel --force
vercel --prod --force
```

## Manual Dashboard Steps

### 1. Delete Current Project
- Go to https://vercel.com/dashboard
- Find "1-0-war-room" project
- Go to Settings → Delete Project
- Confirm deletion

### 2. Re-import from GitHub
- Click "Add New..." → "Project"
- Select GitHub repository: Think-Big-Media/1.0-war-room
- Configure with these EXACT settings:

**Framework Preset:** Vite

**Build & Development Settings:**
- Root Directory: `.` (leave empty)
- Build Command: `cd src/frontend && npm install && npm run build`
- Output Directory: `src/frontend/dist`
- Install Command: `cd src/frontend && npm install`

**Node.js Version:** 22.x

**Environment Variables:** (if needed)
```
VITE_API_URL=https://your-render-backend.onrender.com
VITE_BRAND_BOS=true
```

### 3. Deploy
- Click "Deploy"
- Wait for build to complete
- Your Brand BOS dashboard will be at: https://[project-name].vercel.app

## Why This Will Work
1. Clean slate - no cached configurations
2. Correct build paths for nested frontend
3. Node.js 22.x to avoid deprecation
4. Proper Vite framework detection

## Verification
After deployment, you should see:
- Purple/blue gradient Brand BOS dashboard
- Top navigation bar
- Ticker tape at bottom
- Floating chat interface
- All 8 dashboard pages

## If Still Having Issues
Create a new file in root: `vercel.json`
```json
{
  "buildCommand": "cd src/frontend && npm install && npm run build",
  "outputDirectory": "src/frontend/dist",
  "installCommand": "cd src/frontend && npm install",
  "framework": "vite"
}
```