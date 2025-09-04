# URGENT: War Room Live API Setup Instructions

## Current Status
✅ Code fixes deployed to GitHub
⏳ Render deployment in progress (takes 5-10 minutes)
🔧 API credentials need to be configured

## Immediate Actions Required

### 1. Check Deployment Status
Visit: https://war-room-oa9t.onrender.com/health
- Should show: `{"status":"healthy"...}`
- If not responding, wait 2-3 more minutes for Render to wake up

### 2. Configure API Credentials in Render Dashboard

1. **Login to Render.com**
2. **Navigate to your War Room service**
3. **Go to Environment tab**
4. **Add these environment variables:**

#### For Google Ads:
```
VITE_GOOGLE_ADS_CLIENT_ID=your-actual-client-id
VITE_GOOGLE_ADS_CLIENT_SECRET=your-actual-client-secret
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=your-actual-developer-token
```

#### For Meta Business:
```
VITE_META_APP_ID=your-actual-app-id
VITE_META_APP_SECRET=your-actual-app-secret
VITE_META_ACCESS_TOKEN=your-actual-access-token
```

#### To Disable Mock Mode:
```
VITE_FORCE_MOCK_MODE=false
```

5. **Click "Save Changes"**
6. **Render will automatically redeploy** (takes 5-10 minutes)

## Testing Live Data

### Check API Status:
```bash
# Google Ads status
curl https://war-room-oa9t.onrender.com/api/v1/auth/google-ads/status

# Meta status
curl https://war-room-oa9t.onrender.com/api/v1/auth/meta/status
```

### View Campaign Data:
```bash
# Google Ads campaigns
curl https://war-room-oa9t.onrender.com/api/v1/google-ads/campaigns

# Meta campaigns
curl https://war-room-oa9t.onrender.com/api/v1/meta/campaigns
```

## What Was Fixed

1. **Removed duplicate frontend** structure that was causing confusion
2. **Fixed hardcoded mock mode** in googleAdsService.ts
3. **Added API endpoints** to backend for serving real data
4. **Created configuration system** that automatically uses real data when credentials are present

## Current Limitations

The backend currently returns **mock data** until you add real API credentials. Once credentials are configured in Render:
1. The frontend will attempt to use real APIs
2. The backend endpoints will serve as a proxy (currently mock, but ready for real implementation)

## Next Steps for Full Integration

1. **Add OAuth2 flow** for user authentication with Google/Meta
2. **Implement backend API clients** to fetch real data from Google Ads and Meta APIs
3. **Store tokens securely** in database for persistent authentication
4. **Add data caching** to reduce API calls and improve performance

## Troubleshooting

### If site shows "Service Waking Up":
- This is normal for Render free tier
- Wait 30 seconds and refresh
- Consider upgrading to paid tier to eliminate cold starts

### If you still see mock data after adding credentials:
1. Check environment variables are saved in Render
2. Wait for full redeployment (check Render dashboard for status)
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for any errors

### To verify credentials are loaded:
Visit: https://war-room-oa9t.onrender.com/api/v1/debug
- Check `env_vars` section for VITE_ variables
- Credentials should be present (values will be hidden)

## Support

For immediate assistance:
1. Check Render deployment logs for errors
2. Verify all environment variables are set correctly
3. Ensure API credentials are valid and not expired

The platform is now ready to display real data once credentials are configured!