# Google Ads Integration Test Guide

## ✅ Frontend-Backend Connection Complete!

The Google Ads integration is now fully connected between frontend and backend.

## 🎯 Test Steps

### 1. Setup Environment Variables
Add these to your `.env` file in the backend:
```bash
# Required for OAuth2 to work
GOOGLE_ADS_CLIENT_ID=your-client-id-from-google-cloud-console
GOOGLE_ADS_CLIENT_SECRET=your-client-secret-from-google-cloud-console
GOOGLE_ADS_REDIRECT_URI=http://localhost:5173/auth/google-ads/callback

# Optional - for API access
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your-login-customer-id
```

### 2. Run Database Migration
```bash
cd src/backend
source venv/bin/activate  # or your virtual environment
alembic upgrade head
```

### 3. Start Backend Server
```bash
cd src/backend
uvicorn main:app --reload --port 8000
```

### 4. Start Frontend Server
```bash
cd src/frontend
npm run dev
```

### 5. Test OAuth2 Flow
1. Navigate to http://localhost:5173/settings
2. Scroll down to "Platform Integrations"
3. Click "Connect to Google Ads" button
4. You'll be redirected to Google OAuth2 consent screen
5. Authorize the application
6. You'll be redirected back to /auth/google-ads/callback
7. Then automatically redirected to Settings page
8. The Google Ads card should now show "Connected"

## 🔧 What's Connected

### Frontend Components:
- ✅ `GoogleAdsIntegration.tsx` - Main UI component with real API calls
- ✅ `GoogleAdsCallback.tsx` - OAuth callback handler page
- ✅ `googleAdsAuthService.ts` - Service for auth API calls
- ✅ `googleAdsService.ts` - Service for data API calls
- ✅ Route added to `App.tsx` for callback

### Backend Endpoints:
- ✅ `POST /api/v1/auth/google-ads/redirect` - Get OAuth URL
- ✅ `GET /api/v1/auth/google-ads/callback` - Handle OAuth callback
- ✅ `GET /api/v1/auth/google-ads/status` - Check auth status
- ✅ `POST /api/v1/auth/google-ads/refresh` - Refresh tokens
- ✅ `POST /api/v1/auth/google-ads/revoke` - Revoke access

### Security Features:
- 🔐 Tokens encrypted with Fernet/AES-256
- 🔐 PBKDF2 key derivation
- 🔐 Organization-level isolation
- 🔐 Automatic token refresh

## 🚨 Troubleshooting

### If OAuth redirect fails:
1. Check that `GOOGLE_ADS_REDIRECT_URI` matches exactly in:
   - Google Cloud Console OAuth2 settings
   - Backend .env file
   - Must be: `http://localhost:5173/auth/google-ads/callback`

### If "Connect" button doesn't work:
1. Check browser console for errors
2. Verify backend is running on port 8000
3. Check that frontend proxy is configured for API calls

### If connection shows but no data:
1. You need a Google Ads Developer Token
2. You need access to at least one Google Ads account
3. Check backend logs for API errors

## 📊 Success Indicators

When properly connected, you'll see:
- ✅ Green "Active" status on Google Ads card
- ✅ "Account successfully connected" message
- ✅ List of accessible Google Ads customers (if API access is configured)
- ✅ Campaign data displayed (if customers exist)

## 🎉 Integration Complete!

The Google Ads OAuth2 integration is now fully functional with:
- Real OAuth2 authentication flow
- Secure token storage
- Automatic token refresh
- Frontend-backend connection
- Error handling throughout