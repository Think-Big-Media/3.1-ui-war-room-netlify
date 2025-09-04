# Frontend API Integration Guide

## Overview

This guide documents the new API integration for connecting the War Room frontend to live backend APIs. The integration replaces mock data with real-time data from Meta, Google Ads, and monitoring services.

## Architecture

### API Services Structure

```
src/frontend/src/services/
├── metaApi.ts          # Meta Business API v21 integration
├── googleApi.ts        # Google Ads API v20 integration  
├── monitoringApi.ts    # Mentionlytics & NewsWhip integration
├── dashboardApi.ts     # Aggregated dashboard data service
└── testApiConnections.ts # API testing utilities
```

### Authentication Flow

1. **Supabase Integration**: All API calls use Supabase authentication
2. **Token Management**: Automatically handled in `src/lib/api.ts`
3. **Session Handling**: Tokens are refreshed automatically

## Key Components

### 1. MetricsGrid Component
- **Location**: `src/components/dashboard/MetricsGrid.tsx`
- **Purpose**: Displays real-time metrics from all platforms
- **Features**:
  - Auto-refresh every 5 minutes
  - Error handling with fallbacks
  - Loading states
  - Sparkline visualizations

### 2. CrisisAlertPanel Component
- **Location**: `src/components/dashboard/CrisisAlertPanel.tsx`
- **Purpose**: Real-time crisis detection and alerts
- **Features**:
  - WebSocket integration for live updates
  - 30-second auto-refresh
  - Alert severity indicators
  - Action buttons for alert management

### 3. RealTimeActivityFeed Component
- **Location**: `src/components/dashboard/RealTimeActivityFeed.tsx`
- **Purpose**: Live social media mentions and activities
- **Features**:
  - Sentiment analysis display
  - Source-specific icons
  - Engagement metrics
  - Keyword highlighting

## API Endpoints

### Meta Business API
- `GET /api/v1/meta/campaigns` - List campaigns
- `GET /api/v1/meta/campaigns/{id}/insights` - Campaign insights
- `GET /api/v1/meta/metrics` - Aggregated metrics
- `GET /api/v1/meta/realtime` - Real-time performance

### Google Ads API
- `GET /api/v1/google/campaigns` - List campaigns
- `GET /api/v1/google/campaigns/{id}/performance` - Performance data
- `GET /api/v1/google/metrics` - Aggregated metrics
- `GET /api/v1/google/keywords` - Keyword performance

### Monitoring API
- `GET /api/v1/monitoring/mentions` - Social media mentions
- `GET /api/v1/monitoring/alerts` - Active alerts
- `GET /api/v1/monitoring/crisis-alerts` - Crisis detection
- `GET /api/v1/monitoring/sentiment-trends` - Sentiment analysis

## Usage Examples

### Basic Dashboard Integration

```typescript
import { useDashboardData } from '../hooks/useDashboardData';

export const Dashboard = () => {
  const { metrics, alerts, activity, isLoading, error } = useDashboardData();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <MetricsGrid metrics={metrics} />
      <CrisisAlertPanel />
      <RealTimeActivityFeed />
    </div>
  );
};
```

### Direct API Usage

```typescript
import { metaApi } from '../services/metaApi';

// Fetch Meta campaigns
const campaigns = await metaApi.getCampaigns({ 
  status: 'ACTIVE',
  limit: 10 
});

// Get campaign insights
const insights = await metaApi.getCampaignInsights(campaignId, {
  date_start: '2024-01-01',
  date_stop: '2024-01-31'
});
```

## Performance Requirements

- **Response Time**: All API calls must complete within 3 seconds
- **Caching**: Implemented at service level with 5-minute TTL
- **Rate Limiting**: Handled automatically by API services
- **Error Recovery**: Automatic retry with exponential backoff

## Testing

### API Connection Test

Run in browser console:
```javascript
await window.testApiConnections()
```

This will test all API endpoints and report:
- Connection status
- Response times
- Data availability
- Performance metrics

### Manual Testing

1. Open the Dashboard page
2. Check browser DevTools Network tab
3. Verify API calls to `/api/v1/*` endpoints
4. Monitor response times < 3s

## Environment Configuration

### Development
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Production
```env
VITE_API_URL=https://war-room-oa9t.onrender.com
VITE_SUPABASE_URL=production-supabase-url
VITE_SUPABASE_ANON_KEY=production-anon-key
```

## Error Handling

All API services implement consistent error handling:

1. **Network Errors**: Display connection error message
2. **Auth Errors**: Redirect to login
3. **API Errors**: Show specific error message
4. **Timeout Errors**: Retry with user notification

## Migration from Mock Data

### Before (Mock Data)
```typescript
const mockActivities = [
  { id: '1', type: 'donation', title: 'New donation' }
];
```

### After (Live API)
```typescript
const { mentions } = await monitoringApi.getMentions({ limit: 20 });
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check Supabase authentication
   - Verify token in localStorage
   - Ensure user is logged in

2. **CORS Errors**
   - Verify backend CORS configuration
   - Check API URL matches environment

3. **Slow Response Times**
   - Check network latency
   - Verify backend performance
   - Review query optimization

## Next Steps

1. Implement WebSocket connections for real-time updates
2. Add response caching with Redis
3. Implement offline support with service workers
4. Add performance monitoring with Sentry

## Support

For issues or questions:
- Check browser console for errors
- Review Network tab in DevTools
- Contact backend team for API issues