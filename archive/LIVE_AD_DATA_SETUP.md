# Live Ad Data Pipeline Setup Guide

## 🚀 Implementation Complete ✅

The live ad data pipeline is now fully implemented with:

- ✅ **Meta Business API OAuth** - Complete authentication flow
- ✅ **Google Ads API OAuth2** - Complete authentication flow  
- ✅ **Unified Campaign Insights API** - `/api/v1/ad-insights/campaigns`
- ✅ **Real-time Spend Tracking** - WebSocket monitoring with alerts
- ✅ **Rate Limiting & Circuit Breakers** - Production-ready API protection
- ✅ **Live Dashboard Integration** - React components connected to APIs

## 🔧 Production Deployment Requirements

To activate live ad data, add these credentials to your production environment:

### Meta Business API Credentials

```bash
# Required for Meta Business API
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_ACCESS_TOKEN=your_meta_access_token_here
META_DEFAULT_ACCOUNT_ID=act_your_account_id_here
META_REDIRECT_URI=https://war-room-oa9t.onrender.com/auth/meta/callback
```

**How to get Meta credentials:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add "Marketing API" product
4. Generate App ID and App Secret
5. Get access token through OAuth flow or Graph API Explorer
6. Find your Ad Account ID in Ads Manager

### Google Ads API Credentials

```bash
# Required for Google Ads API
GOOGLE_ADS_CLIENT_ID=your_google_ads_client_id_here
GOOGLE_ADS_CLIENT_SECRET=your_google_ads_client_secret_here
GOOGLE_ADS_DEVELOPER_TOKEN=your_google_ads_developer_token_here
GOOGLE_ADS_REFRESH_TOKEN=your_google_ads_refresh_token_here
GOOGLE_ADS_DEFAULT_CUSTOMER_ID=your_customer_id_here
GOOGLE_ADS_REDIRECT_URI=https://war-room-oa9t.onrender.com/auth/google/callback
```

**How to get Google Ads credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Apply for Google Ads API access
4. Get Developer Token (requires approval)
5. Complete OAuth flow to get refresh token
6. Find Customer ID in Google Ads account

### Alert Thresholds

```bash
# Configurable alert thresholds
DAILY_SPEND_THRESHOLD=500        # Alert when daily spend exceeds $500
CTR_THRESHOLD_LOW=1.0           # Alert when CTR drops below 1%
CPC_THRESHOLD_HIGH=5.0          # Alert when CPC exceeds $5
SPEND_THRESHOLD_PERCENTAGE=80   # Alert at 80% of daily budget
PERFORMANCE_DROP_THRESHOLD=20   # Alert on 20% performance drop
MONITORING_INTERVAL_SECONDS=300 # Check every 5 minutes
```

## 📊 API Endpoints

### Campaign Insights
```
GET /api/v1/ad-insights/campaigns
```
- Unified insights from Meta & Google Ads
- Real-time or cached data
- Filtering by account IDs, date ranges
- Response includes spend, impressions, clicks, conversions

### Real-time Alerts
```
GET /api/v1/ad-insights/alerts
```
- Active spend threshold alerts
- Performance drop notifications
- Budget pacing warnings

### WebSocket Monitoring
```
WS /api/v1/ws/ad-monitor
```
- Live spend tracking
- Real-time alert notifications
- Campaign performance updates
- Automatic threshold monitoring

### Health Check
```
GET /api/v1/ad-insights/health
```
- API connection status
- Platform availability
- Authentication verification

## 🔄 Data Sync

```
POST /api/v1/ad-insights/sync
```
- Manual data synchronization
- Platform-specific sync
- Account-specific refresh

## 🎯 Frontend Integration

The dashboard components are ready:

- **AdsPlatformMetrics** - Unified campaign display
- **MetaCampaignInsights** - Meta-specific widgets  
- **Real-time WebSocket** - Live updates and alerts
- **OAuth Flow** - Authentication screens

## 🚨 Mock Mode

Currently running in mock mode. Set `MOCK_MODE=false` after adding real credentials.

## 🔐 Security Features

- ✅ Rate limiting (200 calls/hour default)
- ✅ Circuit breakers for API failures
- ✅ Token validation and refresh
- ✅ Secure credential storage
- ✅ CORS protection
- ✅ Request/response logging

## 📈 Monitoring

- Real-time spend tracking
- Budget pacing alerts
- Performance drop detection
- API health monitoring
- WebSocket connection management

## ⚡ Quick Test

Once credentials are added:

1. Visit: `https://war-room-oa9t.onrender.com/api/v1/ad-insights/health`
2. Check API connections
3. Test: `https://war-room-oa9t.onrender.com/api/v1/ad-insights/campaigns`
4. Connect WebSocket for live updates

## 🎉 Ready for Production!

The complete live ad data pipeline is implemented and ready for production use. Simply add your API credentials to activate real-time campaign insights and spend monitoring.
