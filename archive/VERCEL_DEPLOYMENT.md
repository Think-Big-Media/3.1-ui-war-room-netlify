# Vercel Frontend Deployment Guide

## Prerequisites

1. Vercel account (free tier works)
2. GitHub repository connected
3. Backend deployed on Render.com

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository: `Think-Big-Media/1.0-war-room`
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `src/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2. Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```bash
# Backend API (Render)
VITE_API_URL=https://war-room.onrender.com

# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# PostHog (optional)
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://app.posthog.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AUTOMATION=true
VITE_ENABLE_DOCUMENT_INTELLIGENCE=true
```

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your frontend will be available at: `https://your-project.vercel.app`

## Important Configuration

### CORS Settings

Ensure your backend (Render) allows your Vercel domain:

In `src/backend/core/config.py`:
```python
BACKEND_CORS_ORIGINS = [
    "https://your-project.vercel.app",
    "https://your-custom-domain.com",  # If using custom domain
    "http://localhost:5173",  # For local development
]
```

### API Integration

The frontend uses these endpoints:
- API Base: `https://war-room.onrender.com/api/v1`
- WebSocket: `wss://war-room.onrender.com/ws`
- Health Check: `https://war-room.onrender.com/health`

## Troubleshooting

### Build Fails
- Check Node version (should be 18+)
- Verify all dependencies in package.json
- Check build logs in Vercel dashboard

### API Connection Issues
- Verify VITE_API_URL is set correctly
- Check CORS configuration on backend
- Ensure backend is deployed and running

### Environment Variables Not Working
- Variables must start with `VITE_`
- Redeploy after adding/changing variables
- Check browser console for errors

## Custom Domain

1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS:
   - CNAME: `cname.vercel-dns.com`
   - Or A records to Vercel IPs

## Automatic Deployments

By default, Vercel will:
- Deploy on every push to main branch
- Create preview deployments for PRs
- You can configure branch deployments in settings

## Performance Optimization

The build is already optimized with:
- Code splitting
- Tree shaking
- Minification
- Compression
- Vendor chunk separation

## Monitoring

- Check Vercel Analytics for performance metrics
- Use PostHog for user analytics
- Monitor errors in browser console
- Check Network tab for API calls