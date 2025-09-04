# War Room API Integration Guide

**Date**: July 30, 2025  
**Branch**: `feature/api-integration-pipeline`  
**Status**: ✅ Integration Layer Complete

## 🚀 Quick Start

### 1. Environment Setup

Add these to your `.env` file:

```env
# Meta Business API
VITE_META_APP_ID=your-meta-app-id
VITE_META_APP_SECRET=your-meta-app-secret
VITE_META_REDIRECT_URI=https://war-room-oa9t.onrender.com/api/meta/callback

# Google Ads API (v20)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_DEVELOPER_TOKEN=your-developer-token
VITE_GOOGLE_REDIRECT_URI=https://war-room-oa9t.onrender.com/api/google/callback
```

### 2. Import the New Dashboard Component

```tsx
// In your main dashboard file
import { AdsPlatformMetrics } from '@/components/dashboard/AdsPlatformMetrics';

// Use in your dashboard
<AdsPlatformMetrics 
  metaAccountId="act_123456789"
  googleCustomerId="123-456-7890"
  dateRange="last_30d"
  refreshInterval={300000} // 5 minutes
/>
```

## 📊 Available Components

### 1. AdsPlatformMetrics Component

**Location**: `src/frontend/src/components/dashboard/AdsPlatformMetrics.tsx`

This component displays:
- Combined metrics from both Meta and Google Ads
- Real-time data with automatic refresh
- Platform-specific breakdowns
- Performance summaries with ROAS calculations

### 2. Integration Hooks

**Location**: `src/services/integrations/`

#### Meta Business API Hooks
```typescript
import { 
  useMetaAuth,
  useMetaAccountInsights,
  useMetaCampaignInsights 
} from '@/services/integrations';

// Authentication
const { isAuthenticated, getLoginUrl, logout } = useMetaAuth();

// Account insights
const { data, isLoading, error } = useMetaAccountInsights(
  accountId,
  {
    datePreset: 'last_30d',
    fields: ['impressions', 'clicks', 'spend'],
  }
);
```

#### Google Ads API Hooks
```typescript
import { 
  useGoogleAdsAuth,
  useGoogleAdsAccountInsights,
  useGoogleAdsCampaigns 
} from '@/services/integrations';

// Authentication
const { isAuthenticated, getLoginUrl, logout } = useGoogleAdsAuth();

// Account insights
const { data, isLoading, error } = useGoogleAdsAccountInsights(
  customerId,
  {
    dateRange: { preset: 'LAST_30_DAYS' },
    metrics: ['impressions', 'clicks', 'cost'],
  }
);
```

## 🔐 Authentication Flow

### Meta Business OAuth
```typescript
// 1. Generate login URL
const metaLoginUrl = getMetaLoginUrl(['ads_read', 'ads_management']);

// 2. Redirect user
window.location.href = metaLoginUrl;

// 3. Handle callback (in your callback route)
const code = new URLSearchParams(window.location.search).get('code');
exchangeCode(code);
```

### Google Ads OAuth
```typescript
// 1. Generate login URL
const googleLoginUrl = getGoogleLoginUrl(['https://www.googleapis.com/auth/adwords']);

// 2. Redirect user
window.location.href = googleLoginUrl;

// 3. Handle callback
const code = new URLSearchParams(window.location.search).get('code');
exchangeCode(code);
```

## 📈 Example: Full Dashboard Integration

```tsx
import React, { useState } from 'react';
import { AdsPlatformMetrics } from '@/components/dashboard/AdsPlatformMetrics';
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview';
import { CampaignHealth } from '@/components/dashboard/CampaignHealth';

export const Dashboard = () => {
  const [dateRange, setDateRange] = useState<'last_7d' | 'last_30d' | 'last_90d'>('last_30d');
  
  // Get account IDs from your app state/context
  const metaAccountId = useAppSelector(state => state.ads.metaAccountId);
  const googleCustomerId = useAppSelector(state => state.ads.googleCustomerId);

  return (
    <div className="p-6 space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="last_7d">Last 7 Days</option>
          <option value="last_30d">Last 30 Days</option>
          <option value="last_90d">Last 90 Days</option>
        </select>
      </div>

      {/* Ads Platform Metrics */}
      <AdsPlatformMetrics
        metaAccountId={metaAccountId}
        googleCustomerId={googleCustomerId}
        dateRange={dateRange}
      />

      {/* Original Analytics */}
      <AnalyticsOverview timeRange={dateRange} />

      {/* Campaign Health */}
      <CampaignHealth />
    </div>
  );
};
```

## 🛠️ Advanced Usage

### 1. Custom Metrics Dashboard
```tsx
import { useMetaAggregatedInsights, useGoogleAdsAggregatedInsights } from '@/services/integrations';

function CustomMetrics({ campaignIds }) {
  // Aggregate data across multiple campaigns
  const { data: metaAggregated } = useMetaAggregatedInsights(
    {
      accountId: 'act_123',
      campaignIds,
      datePreset: 'last_30d',
      fields: ['impressions', 'clicks', 'spend', 'conversions'],
    }
  );

  const { data: googleAggregated } = useGoogleAdsAggregatedInsights(
    'customer-id',
    campaignIds,
    {
      dateRange: { preset: 'LAST_30_DAYS' },
      metrics: ['impressions', 'clicks', 'cost', 'conversions'],
    }
  );

  // Combine and display metrics
  return <YourCustomChart data={{ meta: metaAggregated, google: googleAggregated }} />;
}
```

### 2. Real-time Streaming
```tsx
import { useMetaInsightsStream, useGoogleAdsPerformanceStream } from '@/services/integrations';

function RealtimeMonitor() {
  // Stream updates every minute
  const { insights: metaStream } = useMetaInsightsStream(
    { accountId: 'act_123', datePreset: 'today' },
    { pollInterval: 60000 }
  );

  const { performance: googleStream } = useGoogleAdsPerformanceStream(
    'customer-id',
    ['campaign-1', 'campaign-2'],
    { pollInterval: 60000 }
  );

  return <LiveChart data={{ meta: metaStream, google: googleStream }} />;
}
```

### 3. Error Handling
```tsx
import { useMetaErrorHandler, useGoogleAdsErrorHandler } from '@/services/integrations';

function AppErrorBoundary({ children }) {
  const { handleError: handleMetaError } = useMetaErrorHandler();
  const { handleError: handleGoogleError } = useGoogleAdsErrorHandler();

  React.useEffect(() => {
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

## 🧪 Testing

### 1. Mock Data for Development
```typescript
// In your test setup
jest.mock('@/services/integrations', () => ({
  useMetaAccountInsights: () => ({
    data: {
      impressions: 10000,
      clicks: 500,
      spend: 250,
      conversions: 25,
    },
    isLoading: false,
    error: null,
  }),
  useGoogleAdsAccountInsights: () => ({
    data: {
      impressions: 15000,
      clicks: 750,
      cost: 375,
      conversions: 30,
    },
    isLoading: false,
    error: null,
  }),
}));
```

### 2. Integration Tests
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMetaAccountInsights } from '@/services/integrations';

test('fetches Meta account insights', async () => {
  const { result } = renderHook(() => 
    useMetaAccountInsights('act_123', { datePreset: 'last_30d' })
  );

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
    expect(result.current.data.impressions).toBeGreaterThan(0);
  });
});
```

## 📋 Checklist for Production

- [ ] Add API credentials to environment variables
- [ ] Set up OAuth redirect URIs in Meta and Google developer consoles
- [ ] Configure CORS for your domain
- [ ] Test authentication flows
- [ ] Verify rate limiting is working
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure proper caching strategies
- [ ] Test with real account data
- [ ] Monitor API usage and costs
- [ ] Set up alerts for API failures

## 🚨 Common Issues & Solutions

### Issue: "Meta API credentials not configured"
**Solution**: Ensure all VITE_META_* environment variables are set

### Issue: Google Ads API returns 401
**Solution**: Check that your developer token has proper access level

### Issue: CORS errors on OAuth callback
**Solution**: Add your domain to the authorized redirect URIs

### Issue: Rate limiting errors
**Solution**: The integration layer handles this automatically with retry logic

## 📚 Resources

- [Meta Business API Documentation](https://developers.facebook.com/docs/marketing-api/)
- [Google Ads API v20 Documentation](https://developers.google.com/google-ads/api/docs/start)
- [React Query Documentation](https://tanstack.com/query/latest)
- [War Room Integration Layer Source](src/services/integrations/)

## 🎯 Next Steps

1. **Test OAuth Flows**: Set up test accounts and verify authentication
2. **Connect to Redux**: Integrate with your state management
3. **Add Campaign Management**: Implement CRUD operations for campaigns
4. **Build Custom Reports**: Create specialized reporting components
5. **Set Up Webhooks**: Implement real-time updates from platforms