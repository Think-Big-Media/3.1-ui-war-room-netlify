# API Integrations Layer

This directory contains React Query hooks that bridge our API implementations (`src/api/`) with the React frontend.

## Overview

The integration layer provides:
- 🔐 Authentication management for both Meta and Google Ads
- 📊 Data fetching hooks with caching and real-time updates
- 🔄 Mutation hooks for campaign management
- 🚨 Unified error handling with toast notifications
- 📈 Performance monitoring and health checks

## Directory Structure

```
src/services/integrations/
├── useMetaAds.ts              # Meta Business API React Query hooks
├── useGoogleAds.ts            # Google Ads API React Query hooks
├── UnifiedAdsDashboard.tsx    # Example unified dashboard component
├── index.ts                   # Main exports
└── README.md                  # This file
```

## Quick Start

### 1. Environment Variables

Add these to your `.env` file:

```env
# Meta Business API
VITE_META_APP_ID=your-meta-app-id
VITE_META_APP_SECRET=your-meta-app-secret
VITE_META_REDIRECT_URI=https://your-domain.com/api/meta/callback

# Google Ads API
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_DEVELOPER_TOKEN=your-developer-token
VITE_GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/callback
```

### 2. Basic Usage

```typescript
import { useMetaAuth, useMetaAccountInsights } from '@/services/integrations';

function MyComponent() {
  // Authentication
  const { isAuthenticated, getLoginUrl, logout } = useMetaAuth();
  
  // Fetch insights
  const { data, isLoading, error } = useMetaAccountInsights(
    'act_123456789',
    {
      datePreset: 'last_30d',
      fields: ['impressions', 'clicks', 'spend'],
    }
  );
  
  if (!isAuthenticated) {
    return <button onClick={() => window.location.href = getLoginUrl()}>
      Connect Meta
    </button>;
  }
  
  return <div>Spend: ${data?.spend}</div>;
}
```

## Available Hooks

### Meta Business API Hooks

#### Authentication
- `useMetaAuth()` - Manage Meta authentication state

#### Data Fetching
- `useMetaAccountInsights()` - Account-level performance data
- `useMetaCampaignInsights()` - Campaign performance metrics
- `useMetaAdSetInsights()` - Ad set performance data
- `useMetaAdInsights()` - Individual ad performance
- `useMetaAggregatedInsights()` - Cross-campaign aggregated data
- `useMetaInsightsStream()` - Real-time performance streaming

#### Utilities
- `useMetaAPIHealth()` - Monitor API health status
- `useMetaErrorHandler()` - Global error handling

### Google Ads API Hooks

#### Authentication
- `useGoogleAdsAuth()` - Manage Google Ads authentication

#### Data Fetching
- `useGoogleAdsCustomers()` - List accessible customer accounts
- `useGoogleAdsCampaigns()` - List campaigns
- `useGoogleAdsCampaignInsights()` - Campaign performance data
- `useGoogleAdsAdGroups()` - List ad groups
- `useGoogleAdsKeywords()` - List keywords
- `useGoogleAdsSearchTerms()` - Search terms report
- `useGoogleAdsAccountInsights()` - Account-level insights
- `useGoogleAdsChangeHistory()` - Track account changes

#### Mutations
- `useGoogleAdsCampaignMutations()` - Update budgets, pause/enable campaigns

#### Utilities
- `useGoogleAdsPerformanceStream()` - Real-time monitoring
- `useGoogleAdsAPIHealth()` - API health status
- `useGoogleAdsErrorHandler()` - Error handling

## Advanced Examples

### 1. Real-time Performance Dashboard

```typescript
import { useMetaInsightsStream, useGoogleAdsPerformanceStream } from '@/services/integrations';

function RealtimeDashboard() {
  // Stream Meta data every 5 minutes
  const { insights: metaData } = useMetaInsightsStream(
    { accountId: 'act_123', datePreset: 'today' },
    { pollInterval: 5 * 60 * 1000 }
  );
  
  // Stream Google Ads data
  const { performance: googleData } = useGoogleAdsPerformanceStream(
    'customer-id',
    ['campaign-1', 'campaign-2'],
    { pollInterval: 5 * 60 * 1000 }
  );
  
  return (
    <div>
      <MetricsChart data={metaData} />
      <MetricsChart data={googleData} />
    </div>
  );
}
```

### 2. Campaign Management

```typescript
import { useGoogleAdsCampaignMutations } from '@/services/integrations';

function CampaignManager({ customerId, campaignId }) {
  const { updateBudget, pauseCampaign, isUpdatingBudget } = 
    useGoogleAdsCampaignMutations(customerId);
  
  const handleBudgetUpdate = (newBudget: number) => {
    updateBudget({ campaignId, dailyBudget: newBudget });
  };
  
  return (
    <div>
      <button 
        onClick={() => handleBudgetUpdate(100)}
        disabled={isUpdatingBudget}
      >
        Update Budget
      </button>
      <button onClick={() => pauseCampaign(campaignId)}>
        Pause Campaign
      </button>
    </div>
  );
}
```

### 3. Error Handling

```typescript
import { useMetaErrorHandler, useGoogleAdsErrorHandler } from '@/services/integrations';

function AppWrapper({ children }) {
  const { handleError: handleMetaError } = useMetaErrorHandler();
  const { handleError: handleGoogleError } = useGoogleAdsErrorHandler();
  
  // Set up global error boundaries
  useEffect(() => {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.name === 'MetaAPIError') {
        handleMetaError(event.reason);
      } else if (event.reason?.name === 'GoogleAdsAPIError') {
        handleGoogleError(event.reason);
      }
    });
  }, []);
  
  return <>{children}</>;
}
```

## Query Key Patterns

Both integrations use consistent query key patterns for cache management:

```typescript
// Meta query keys
metaQueryKeys.all                                    // ['meta']
metaQueryKeys.auth()                                 // ['meta', 'auth']
metaQueryKeys.accountInsights(accountId, params)    // ['meta', 'insights', 'account', accountId, params]

// Google Ads query keys
googleAdsQueryKeys.all                              // ['googleAds']
googleAdsQueryKeys.campaigns(customerId)            // ['googleAds', 'customers', customerId, 'campaigns']
```

## Performance Optimization

1. **Stale Time**: Most queries have a 5-minute stale time to reduce unnecessary requests
2. **Refetch Intervals**: Real-time hooks support custom polling intervals
3. **Parallel Fetching**: Aggregated insights fetch data in parallel
4. **Smart Caching**: Query keys include parameters for granular cache control

## Migration Guide

If you're migrating from the old `googleAdsService.ts`:

```typescript
// Old way
import { useGoogleAdsPerformance } from '@/services/googleAdsService';
const { data } = useGoogleAdsPerformance();

// New way
import { useGoogleAdsCampaigns, useGoogleAdsCampaignInsights } from '@/services/integrations';
const { data: campaigns } = useGoogleAdsCampaigns(customerId);
const { data: insights } = useGoogleAdsCampaignInsights(customerId, campaignId, params);
```

## Testing

Mock the API clients in your tests:

```typescript
jest.mock('../../api/meta', () => ({
  createMetaAPI: () => ({
    auth: {
      getCachedToken: () => ({ access_token: 'mock-token' }),
      getLoginUrl: () => 'https://mock-login-url',
    },
    insights: {
      getAccountInsights: () => Promise.resolve({ impressions: 1000 }),
    },
  }),
}));
```

## Troubleshooting

### Common Issues

1. **"Meta API credentials not configured"**
   - Ensure all environment variables are set
   - Check that variables start with `VITE_` for Vite projects

2. **Rate limiting errors**
   - The integrations include built-in rate limiting
   - Errors are automatically handled with retry logic

3. **Authentication loops**
   - Check redirect URI matches your app configuration
   - Ensure tokens are properly stored in localStorage

### Debug Mode

Enable debug logging:

```typescript
// In your app initialization
if (import.meta.env.DEV) {
  window.localStorage.setItem('debug', 'meta:*,googleads:*');
}
```

## Future Enhancements

- [ ] Add WebSocket support for real-time Meta updates
- [ ] Implement offline queue for mutations
- [ ] Add data transformation hooks
- [ ] Create custom hooks for common use cases
- [ ] Add TypeScript generics for better type inference

## Contributing

When adding new hooks:
1. Follow the existing naming convention (`use{Platform}{Feature}`)
2. Include proper TypeScript types
3. Add error handling with toast notifications
4. Update this README with examples
5. Add unit tests

## Support

For issues or questions:
- Check the [API documentation](../../api/README.md)
- Review error messages in browser console
- Enable debug mode for detailed logs