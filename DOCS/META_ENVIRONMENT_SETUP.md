# Meta Business API Environment Setup Guide

This guide walks you through setting up Meta Business API credentials and configuring War Room for Meta integration.

## Prerequisites

- [ ] Active Meta Business account
- [ ] Facebook Developer account
- [ ] War Room development or production environment
- [ ] Domain verification for your application

## Step 1: Create Meta App

### 1.1 Access Facebook Developers

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name**: `War Room Analytics`
   - **App Contact Email**: `admin@warroom.app`
   - **Business Account**: Select your business account

### 1.2 Configure Basic Settings

1. Navigate to **App Settings** → **Basic**
2. Complete the following fields:

```
App Name: War Room Analytics
App Contact Email: admin@warroom.app
Privacy Policy URL: https://war-room-oa9t.onrender.com/privacy
Terms of Service URL: https://war-room-oa9t.onrender.com/terms
App Icon: Upload War Room logo (1024x1024 PNG)
Category: Business
```

### 1.3 Add App Domains

In **App Domains** section:
```
war-room-oa9t.onrender.com
war-room.app (if using custom domain)
localhost (for development only)
```

## Step 2: Configure Facebook Login

### 2.1 Add Facebook Login Product

1. Go to **Products** → **Add a Product**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Select **"Web"** as the platform

### 2.2 Configure OAuth Settings

Navigate to **Facebook Login** → **Settings**:

**Valid OAuth Redirect URIs**:
```
https://war-room-oa9t.onrender.com/api/v1/meta/auth/callback
http://localhost:8000/api/v1/meta/auth/callback (development only)
```

**Client OAuth Settings**:
- ✅ Web OAuth Login
- ✅ Force Web OAuth Reauthentication
- ❌ Embedded Browser OAuth Login
- ✅ Use Strict Mode for Redirect URIs

## Step 3: Add Marketing API Access

### 3.1 Add Marketing API Product

1. Go to **Products** → **Add a Product**
2. Find **"Marketing API"** and click **"Set Up"**

### 3.2 Request Permissions

In **Marketing API** → **Tools**:

**Standard Access Permissions** (Request these):
- `ads_read` - Read advertising insights
- `business_management` - Access business accounts
- `pages_read_engagement` - Read page engagement metrics

**Advanced Access** (Request after standard approval):
- `ads_management` - Manage advertising campaigns (future feature)

## Step 4: App Review Preparation

### 4.1 Business Verification

1. Go to **App Review** → **Business Verification**
2. Submit required documents:
   - Business registration certificate
   - Tax ID documentation
   - Proof of business address
   - Bank account verification

### 4.2 Privacy Policy and Terms

Ensure these pages are accessible:
- https://war-room-oa9t.onrender.com/privacy
- https://war-room-oa9t.onrender.com/terms

### 4.3 App Review Submission

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `ads_read`
   - `business_management` 
   - `pages_read_engagement`
3. Provide detailed use case explanations (see META_APP_REQUIREMENTS.md)

## Step 5: Configure Environment Variables

### 5.1 Get App Credentials

From **App Settings** → **Basic**:
- Copy **App ID**
- Copy **App Secret** (click Show)

### 5.2 Development Environment

Create/update `.env` file:
```bash
# Meta Business API Configuration
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_API_VERSION=v18.0

# Redirect URLs
API_BASE_URL=http://localhost:8000
FRONTEND_BASE_URL=http://localhost:5173

# Environment
ENVIRONMENT=development
```

### 5.3 Production Environment

Set environment variables in Render.com dashboard:
```bash
META_APP_ID=your_production_app_id
META_APP_SECRET=your_production_app_secret
META_API_VERSION=v18.0
API_BASE_URL=https://war-room-oa9t.onrender.com
ENVIRONMENT=production
```

## Step 6: Configure Webhooks (Optional)

### 6.1 Add Webhooks Product

1. Go to **Products** → **Add a Product**
2. Find **"Webhooks"** and click **"Set Up"**

### 6.2 Configure Deauthorization Webhook

In **Webhooks** → **Configuration**:

**Callback URL**:
```
https://war-room-oa9t.onrender.com/api/v1/webhooks/meta/deauth
```

**Verify Token**: Generate secure random string
```bash
openssl rand -hex 32
```

**Subscription Fields**:
- ✅ User deauthorizations

### 6.3 Update Environment Variables

Add webhook configuration:
```bash
META_WEBHOOK_VERIFY_TOKEN=your_generated_verify_token
```

## Step 7: Testing Configuration

### 7.1 Test App Basic Setup

```bash
# Check app is accessible
curl "https://graph.facebook.com/v18.0/{APP_ID}" \
  -G \
  -d "access_token={APP_ID}|{APP_SECRET}"
```

Expected response:
```json
{
  "id": "your_app_id",
  "name": "War Room Analytics",
  "category": "Business"
}
```

### 7.2 Test OAuth Flow

1. Start your local development server
2. Navigate to the OAuth URL:
```
https://www.facebook.com/v18.0/dialog/oauth?
client_id={APP_ID}&
redirect_uri=http://localhost:8000/api/v1/meta/auth/callback&
scope=ads_read,business_management&
response_type=code&
state=test_state
```

3. Authorize the app and verify the callback works

### 7.3 Test API Access

Use the test token to verify API access:
```bash
# Test ads read permission
curl "https://graph.facebook.com/v18.0/me/adaccounts" \
  -G \
  -d "access_token={USER_ACCESS_TOKEN}" \
  -d "fields=id,name,account_status"
```

## Step 8: Production Deployment

### 8.1 Update OAuth Redirect URIs

Remove localhost URIs from production app:
```
https://war-room-oa9t.onrender.com/api/v1/meta/auth/callback
```

### 8.2 Switch to Live Mode

1. Go to **App Settings** → **Basic**
2. Turn **"App Mode"** from **Development** to **Live**
3. Verify all required fields are completed

### 8.3 Monitor App Performance

Set up monitoring for:
- OAuth success/failure rates
- API call volume and errors
- Rate limiting issues
- User deauthorizations

## Troubleshooting

### Common Issues

#### "App Not Set Up" Error
- Verify all required fields in Basic Settings
- Ensure Privacy Policy and Terms are accessible
- Check app domains configuration

#### "Invalid Redirect URI" Error
- Verify redirect URI exactly matches configured URI
- Check for trailing slashes or typos
- Ensure HTTPS in production

#### "Insufficient Permissions" Error
- Verify requested permissions are approved
- Check if app is in development or live mode
- Ensure user has granted required permissions

#### "Rate Limit Exceeded" Error
- Implement proper rate limiting in your application
- Use batch requests when possible
- Monitor usage in App Dashboard

### Debug Tools

#### Facebook Debugger
Use [Facebook Debugger](https://developers.facebook.com/tools/debug/) to:
- Validate OAuth URLs
- Check app permissions
- Debug API responses

#### Access Token Debugger
Use [Access Token Tool](https://developers.facebook.com/tools/accesstoken/) to:
- Inspect token permissions
- Check token expiration
- Validate token scopes

### API Testing

#### Test in Graph API Explorer
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Generate user access token with required permissions
4. Test API endpoints before implementation

## Security Best Practices

### Credential Management

1. **Never commit secrets to version control**
2. **Use different credentials for dev/staging/production**
3. **Rotate app secrets regularly**
4. **Monitor for unauthorized access**

### Token Security

1. **Store tokens encrypted in database**
2. **Use HTTPS for all token exchanges**
3. **Implement token refresh logic**
4. **Log all token usage for audit trails**

### API Security

1. **Validate all API responses**
2. **Implement proper error handling**
3. **Use rate limiting to stay within quotas**
4. **Monitor API usage and unusual patterns**

## Support Resources

### Meta Documentation
- [Marketing API Reference](https://developers.facebook.com/docs/marketing-api/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review/)

### War Room Resources
- Technical specification: `META_API_TECHNICAL_SPEC.md`
- App requirements: `META_APP_REQUIREMENTS.md`
- Review checklist: `META_APP_REVIEW_CHECKLIST.md`

### Contact Support
- **Meta Support**: [Developer Support](https://developers.facebook.com/support/)
- **War Room Support**: dev@wethinkbig.io
- **Emergency Contact**: +1 (813) 965-2725

---

**Next Steps**: After completing this setup, proceed to `META_APP_REQUIREMENTS.md` for app review preparation.

**Last Updated**: August 7, 2024  
**Meta API Version**: v18.0