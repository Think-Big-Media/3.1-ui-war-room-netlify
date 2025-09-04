# Meta Business API Integration Guide

## ⚠️ IMPORTANT: API Version Update Required

**Meta Business API v19.0 will be deprecated on February 4, 2025**

We must migrate to v21.0 or v22.0 immediately to avoid business disruption.

## Current API Documentation (v21.0/v22.0)

### Authentication Requirements
- **Permission**: `ads_read` (minimum for insights)
- **Access Token**: User or Page access token
- **App Requirements**: Registered Meta app with Marketing API access

### Ad Insights Endpoint

#### Endpoint Structure
```
https://graph.facebook.com/v21.0/{object-id}/insights
```

Where `{object-id}` can be:
- Ad Account ID: `act_<ACCOUNT_ID>`
- Campaign ID: `<CAMPAIGN_ID>`
- Ad Set ID: `<ADSET_ID>`
- Ad ID: `<AD_ID>`

#### Core Parameters

##### Required Parameters
- `access_token`: Your Meta access token

##### Key Optional Parameters
```javascript
{
  // Metrics to retrieve
  fields: "impressions,reach,clicks,spend,cpm,cpc,ctr",
  
  // Aggregation level
  level: "ad" | "adset" | "campaign" | "account",
  
  // Time range presets
  date_preset: "today" | "yesterday" | "last_7d" | "last_30d" | "lifetime",
  
  // Custom date range (if not using date_preset)
  time_range: {
    since: "2025-01-01",
    until: "2025-01-30"
  },
  
  // Attribution windows
  action_attribution_windows: ["1d_click", "7d_click", "1d_view"],
  
  // Breakdown dimensions
  breakdowns: ["age", "gender", "country"],
  
  // Filtering
  filtering: [{
    field: "campaign.name",
    operator: "CONTAIN",
    value: "Summer"
  }],
  
  // Pagination
  limit: 100,
  after: "cursor_string"
}
```

### Response Structure

```json
{
  "data": [
    {
      "account_id": "act_123456789",
      "campaign_id": "123456789",
      "impressions": "10000",
      "reach": "8000",
      "clicks": "250",
      "spend": "150.00",
      "cpm": "15.00",
      "cpc": "0.60",
      "ctr": "2.50",
      "date_start": "2025-01-29",
      "date_stop": "2025-01-29"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MjQZD"
    },
    "next": "https://graph.facebook.com/v21.0/..."
  }
}
```

### Rate Limiting

#### API Call Limits
- **User Level**: 200 calls per hour per user
- **App Level**: Variable based on app verification status
- **Ad Account Level**: Percentage-based throttling

#### Best Practices
1. Use batch requests for multiple queries
2. Implement exponential backoff for rate limit errors
3. Cache responses when possible
4. Use field expansion to reduce API calls

### Error Handling

```json
{
  "error": {
    "message": "Error message",
    "type": "OAuthException",
    "code": 190,
    "error_subcode": 460,
    "fbtrace_id": "trace_id"
  }
}
```

Common error codes:
- `190`: Invalid OAuth access token
- `100`: Invalid parameter
- `17`: User request limit reached
- `32`: Page request limit reached

## Implementation Architecture

### 1. Modular API Client Structure
```
src/api/meta/
├── client.ts           # Main Meta API client
├── auth.ts            # Authentication handler
├── insights.ts        # Insights-specific methods
├── rateLimiter.ts     # Rate limiting logic
├── types.ts           # TypeScript interfaces
└── utils.ts           # Helper functions
```

### 2. Circuit Breaker Pattern
```typescript
class MetaAPIClient {
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      timeout: 30000,
      errorThreshold: 50,
      resetTimeout: 60000
    });
  }
}
```

### 3. Security Considerations
- Store access tokens in environment variables
- Implement token refresh logic
- Use HTTPS for all API calls
- Validate and sanitize all API responses
- Log all API errors for monitoring

## Migration Checklist

- [ ] Update all API calls from v19.0 to v21.0/v22.0
- [ ] Test authentication flow with new version
- [ ] Verify all field names are still valid
- [ ] Update error handling for new error codes
- [ ] Test rate limiting behavior
- [ ] Update documentation and code comments
- [ ] Monitor deprecation warnings in API responses

## Next Steps

1. Create `.env` variables for Meta API credentials
2. Implement base API client with authentication
3. Add insights endpoint methods
4. Set up rate limiting and circuit breaker
5. Create unit and integration tests
6. Integrate with War Room dashboard