# Meta Business API Integration

This module provides a complete integration with Meta Business API (Facebook/Instagram Ads) v19.0, including OAuth2 authentication, rate limiting, caching, and all core endpoints.

## Features

- ✅ **OAuth2 Authentication Flow**
- ✅ **Rate Limiting** (200 calls/hour with exponential backoff)
- ✅ **In-Memory Caching** (5-minute TTL for insights)
- ✅ **Request/Response Logging**
- ✅ **Token Refresh Automation**
- ✅ **TypeScript Support**
- ✅ **Sandbox Mode for Testing**

## Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
VITE_META_APP_ID=your-meta-app-id
VITE_META_APP_SECRET=your-meta-app-secret
VITE_META_REDIRECT_URI=http://localhost:5173/auth/meta/callback
VITE_META_API_VERSION=v19.0
```

### 2. Meta App Configuration

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app or use existing
3. Add "Facebook Login" product
4. Set OAuth redirect URI to match your `.env`
5. Request necessary permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `read_insights`

## Usage

### Basic Setup

```typescript
import { createMetaApi } from '@/lib/apis/meta';

// Initialize with default config from env
const metaApi = createMetaApi();

// Or with custom config
const metaApi = createMetaApi({
  appId: 'custom-app-id',
  appSecret: 'custom-secret',
  redirectUri: 'https://yourapp.com/auth/meta/callback',
});
```

### OAuth2 Authentication

```typescript
// Generate authorization URL
const authUrl = metaApi.getAuthUrl('random-state-string');
window.location.href = authUrl;

// Handle callback (in your callback route)
const code = new URLSearchParams(window.location.search).get('code');
if (code) {
  const token = await metaApi.exchangeCode(code);
  // Token is automatically stored
}
```

### Fetching Ad Accounts

```typescript
try {
  const accounts = await metaApi.getAdAccounts();
  console.log(accounts);
  // [
  //   {
  //     id: 'act_123456789',
  //     name: 'My Business Account',
  //     currency: 'USD',
  //     timezone_name: 'America/New_York',
  //     ...
  //   }
  // ]
} catch (error) {
  console.error('Failed to fetch accounts:', error);
}
```

### Getting Campaign Insights

```typescript
// Get last 30 days of insights
const insights = await metaApi.getAccountInsights('123456789', {
  date_preset: 'last_30d',
  fields: ['spend', 'impressions', 'clicks', 'ctr', 'cpc'],
});

// Get campaign-specific insights
const campaignInsights = await metaApi.getCampaignInsights('campaign_id', {
  time_range: {
    since: '2024-07-01',
    until: '2024-07-31',
  },
});

// Get aggregated insights across campaigns
const aggregated = await metaApi.getAggregatedInsights(
  'account_id',
  ['campaign_1', 'campaign_2'],
  { date_preset: 'last_7d' }
);
console.log(aggregated.total); // Combined metrics
console.log(aggregated.byCampaign); // Per-campaign breakdown
```

### Advanced Features

#### Rate Limit Monitoring

```typescript
const status = metaApi.client.getRateLimitStatus();
console.log(`Requests remaining: ${status.requestsRemaining}/200`);
console.log(`Reset time: ${status.resetTime}`);
console.log(`In backoff: ${status.inBackoff}`);
```

#### Cache Management

```typescript
// Clear all cache
metaApi.client.clearCache();

// Invalidate specific pattern
metaApi.client.invalidateCache('insights:123456789:*');

// Skip cache for specific request
const freshData = await metaApi.client.request('/me/adaccounts', {
  skipCache: true,
});
```

#### Request Logging

```typescript
// Get request logs
const logs = metaApi.client.getRequestLogs();
logs.forEach(log => {
  console.log(`${log.method} ${log.endpoint} - ${log.duration}ms`);
});

// Clear logs
metaApi.client.clearLogs();
```

## Sandbox Testing

Use the sandbox for testing without real API calls:

```typescript
import { createMetaSandbox, runSandboxTests } from '@/lib/apis/meta/sandbox';

// Create sandbox instance
const sandbox = createMetaSandbox();

// Use like regular API
sandbox.setMockToken();
const accounts = await sandbox.getAdAccounts();

// Run automated tests
await runSandboxTests();
```

In development, sandbox is available in console:
```javascript
window.metaSandbox.getAdAccounts()
window.runMetaSandboxTests()
```

## Error Handling

```typescript
try {
  const data = await metaApi.getAccountInsights('account_id');
} catch (error) {
  if (error.error?.code === 4) {
    // Rate limit error - handled automatically with retry
    console.log('Rate limited, will retry automatically');
  } else if (error.error?.code === 190) {
    // Invalid token
    console.log('Token expired, need to re-authenticate');
  } else {
    // Other error
    console.error('API Error:', error.error?.message);
  }
}
```

## API Reference

### Main Methods

- `getAdAccounts()` - Get all ad accounts
- `getCampaigns(accountId)` - Get campaigns for account
- `getAccountInsights(accountId, params)` - Get account-level insights
- `getCampaignInsights(campaignId, params)` - Get campaign insights
- `getAggregatedInsights(accountId, campaignIds, params)` - Get aggregated metrics

### Insight Parameters

```typescript
interface InsightParams {
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  fields?: string[];
  date_preset?: string; // 'today', 'yesterday', 'last_7d', 'last_30d', etc.
  time_range?: {
    since: string; // YYYY-MM-DD
    until: string; // YYYY-MM-DD
  };
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  breakdowns?: string[]; // 'age', 'gender', 'country', etc.
  limit?: number;
}
```

## Deployment

1. Set environment variables in your deployment platform
2. Ensure redirect URI matches production URL
3. Use long-lived tokens for server-side usage
4. Monitor rate limits in production

## Security Notes

- Never expose `appSecret` to client-side code
- Use environment variables for sensitive data
- Implement proper token storage (consider server-side)
- Regularly refresh tokens before expiration
- Validate webhook signatures if using webhooks

## Troubleshooting

1. **Rate Limit Errors**: The client automatically handles rate limits with exponential backoff
2. **Token Expiration**: Implement token refresh before expiration (60 days for long-lived tokens)
3. **Permission Errors**: Ensure your app has requested and been granted necessary permissions
4. **CORS Issues**: Meta API doesn't support CORS - use server-side proxy for production

## Resources

- [Meta Business API Documentation](https://developers.facebook.com/docs/marketing-apis/)
- [API Changelog](https://developers.facebook.com/docs/graph-api/changelog)
- [Rate Limiting Guide](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)
- [Insights API Reference](https://developers.facebook.com/docs/marketing-api/insights/)