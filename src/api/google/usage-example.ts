// Example usage of Google Ads API client

import { createGoogleAdsAPI } from './index';
import { ReportingQuery } from './types';

// Initialize the API client
const googleAdsAPI = createGoogleAdsAPI({
  config: {
    clientId: import.meta.env.GOOGLE_ADS_CLIENT_ID!,
    clientSecret: import.meta.env.GOOGLE_ADS_CLIENT_SECRET!,
    developerToken: import.meta.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    loginCustomerId: import.meta.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    apiVersion: 'v20', // Latest stable version
    redirectUri: import.meta.env.GOOGLE_ADS_REDIRECT_URI!,
  },
  accessLevel: 'BASIC', // Set based on your developer token access
  circuitBreakerConfig: {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 3,
  },
});

// Example 1: OAuth Authentication Flow
async function authenticateUser() {
  // Step 1: Generate authorization URL
  const state = googleAdsAPI.auth.generateState();
  const authUrl = googleAdsAPI.auth.getAuthorizationUrl(state);

  console.log('Redirect user to:', authUrl);

  // Step 2: After user authorizes and returns with code
  const authCode = 'code_from_redirect'; // Get from URL params

  try {
    const token = await googleAdsAPI.auth.exchangeCodeForTokens(authCode);
    console.log('Access token obtained');
    console.log('Refresh token:', token.refresh_token ? 'Available' : 'Not available');

    // Validate token has required scopes
    const isValid = await googleAdsAPI.auth.validateTokenScopes(token.access_token);
    console.log('Token validation:', isValid ? 'Valid' : 'Invalid');

    return token;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

// Example 2: Get Campaign Performance
async function getCampaignPerformance(customerId: string) {
  try {
    const campaigns = await googleAdsAPI.insights.getCampaignPerformance(customerId, {
      dateRange: { predefinedRange: 'LAST_30_DAYS' },
      metrics: [
        'metrics.impressions',
        'metrics.clicks',
        'metrics.cost_micros',
        'metrics.conversions',
        'metrics.ctr',
        'metrics.average_cpc',
      ],
      orderBy: 'metrics.impressions DESC',
      limit: 10,
    });

    console.log(`Found ${campaigns.length} campaigns`);

    campaigns.forEach((row) => {
      console.log(`
        Campaign: ${row.campaign.name} (${row.campaign.id})
        Status: ${row.campaign.status}
        Impressions: ${row.metrics.impressions}
        Clicks: ${row.metrics.clicks}
        Cost: $${(parseInt(row.metrics.costMicros) / 1_000_000).toFixed(2)}
        CTR: ${row.metrics.ctr}%
        Avg CPC: $${row.metrics.averageCpc}
        Conversions: ${row.metrics.conversions}
      `);
    });

    return campaigns;
  } catch (error) {
    console.error('Failed to get campaign performance:', error);
    throw error;
  }
}

// Example 3: Get Account Summary
async function getAccountSummary(customerId: string) {
  try {
    const summary = await googleAdsAPI.insights.getAccountSummary(customerId, {
      predefinedRange: 'LAST_7_DAYS',
    });

    console.log('Account Summary (Last 7 Days):');
    console.log(`Customer: ${summary.customer.descriptiveName}`);
    console.log(`Currency: ${summary.customer.currencyCode}`);
    console.log(`Total Spend: $${summary.summary.totalSpend.toFixed(2)}`);
    console.log(`Total Impressions: ${summary.summary.totalImpressions.toLocaleString()}`);
    console.log(`Total Clicks: ${summary.summary.totalClicks.toLocaleString()}`);
    console.log(`Average CTR: ${summary.summary.averageCTR.toFixed(2)}%`);
    console.log(`Average CPC: $${summary.summary.averageCPC.toFixed(2)}`);
    console.log(`Total Conversions: ${summary.summary.totalConversions}`);
    console.log(`Conversion Rate: ${summary.summary.conversionRate.toFixed(2)}%`);

    return summary;
  } catch (error) {
    console.error('Failed to get account summary:', error);
    throw error;
  }
}

// Example 4: Search Query with GAQL
async function searchWithGAQL(customerId: string) {
  try {
    // Get top spending keywords
    const query = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc
      FROM keyword_view
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND ad_group_criterion.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 20
    `;

    const results = await googleAdsAPI.client.search(customerId, { query });

    console.log('Top Spending Keywords:');
    results.results.forEach((row) => {
      const costInDollars = parseInt(row.metrics.costMicros) / 1_000_000;
      console.log(`
        Keyword: ${row.adGroupCriterion.keyword.text}
        Match Type: ${row.adGroupCriterion.keyword.matchType}
        Ad Group: ${row.adGroup.name}
        Cost: $${costInDollars.toFixed(2)}
        Clicks: ${row.metrics.clicks}
        CTR: ${row.metrics.ctr.toFixed(2)}%
      `);
    });

    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

// Example 5: Performance by Date
async function getPerformanceTimeline(customerId: string) {
  try {
    const timeline = await googleAdsAPI.insights.getPerformanceByDate(customerId, {
      entity: 'customer',
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-01-30',
      },
      granularity: 'DAY',
    });

    console.log('Daily Performance:');
    timeline.forEach((day) => {
      const date = day.segments?.date || 'Unknown';
      const cost = parseInt(day.metrics?.costMicros || '0') / 1_000_000;

      console.log(
        `${date}: $${cost.toFixed(2)} | ${day.metrics?.clicks} clicks | ${day.metrics?.conversions} conversions`
      );
    });

    return timeline;
  } catch (error) {
    console.error('Failed to get performance timeline:', error);
    throw error;
  }
}

// Example 6: Handle Rate Limits and Errors
async function robustAPICall(customerId: string) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Check current rate limit status
      const rateLimitInfo = googleAdsAPI.client.getHealthStatus().rateLimiter;
      console.log(`Rate limit status: ${rateLimitInfo.remainingOperations} operations remaining`);

      // Make API call
      const results = await googleAdsAPI.insights.getCampaignPerformance(customerId, {
        dateRange: { predefinedRange: 'YESTERDAY' },
      });

      return results;
    } catch (error) {
      attempt++;
      const err = error as any;

      if (err.name === 'GoogleAdsRateLimitError') {
        const waitTime = err.retryAfterSeconds
          ? err.retryAfterSeconds * 1000
          : googleAdsAPI.client.getRateLimiter().calculateBackoff(attempt);

        console.log(`Rate limited. Waiting ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else if (err.name === 'CircuitBreakerOpenError') {
        console.log('Circuit breaker open. Service unavailable.');
        throw error;
      } else if (err.name === 'GoogleAdsValidationError') {
        console.error('Validation error:', err.fieldErrors);
        throw error;
      } else if (attempt < maxRetries) {
        const backoff = googleAdsAPI.client.getRateLimiter().calculateBackoff(attempt);
        console.log(`Error occurred. Retrying in ${backoff / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        throw error;
      }
    }
  }
}

// Example 7: Search Terms Report
async function getSearchTermsReport(customerId: string, campaignId: string) {
  try {
    const searchTerms = await googleAdsAPI.insights.getSearchTermsReport(customerId, {
      campaignId,
      dateRange: { predefinedRange: 'LAST_7_DAYS' },
      limit: 50,
    });

    console.log('Search Terms Report:');
    searchTerms.forEach((term) => {
      const cost = parseInt(term.metrics.costMicros || '0') / 1_000_000;
      console.log(`
        "${term.searchTerm}"
        Campaign: ${term.campaign.name}
        Ad Group: ${term.adGroup.name}
        Impressions: ${term.metrics.impressions}
        Clicks: ${term.metrics.clicks}
        Cost: $${cost.toFixed(2)}
        Conversions: ${term.metrics.conversions}
      `);
    });

    return searchTerms;
  } catch (error) {
    console.error('Failed to get search terms:', error);
    throw error;
  }
}

// Example 8: Stream Large Result Sets
async function streamAllCampaigns(customerId: string) {
  const query = {
    query: `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
    `,
  };

  let totalCampaigns = 0;
  let totalCost = 0;

  try {
    for await (const batch of googleAdsAPI.insights.streamInsights(
      customerId,
      query,
      1000 // Process 1000 at a time
    )) {
      totalCampaigns += batch.length;

      batch.forEach((row) => {
        totalCost += parseInt(row.metrics?.costMicros || '0') / 1_000_000;
      });

      console.log(`Processed ${totalCampaigns} campaigns so far...`);
    }

    console.log(`\nTotal campaigns: ${totalCampaigns}`);
    console.log(`Total spend: $${totalCost.toFixed(2)}`);
  } catch (error) {
    console.error('Stream processing failed:', error);
    throw error;
  }
}

// Example 9: Monitor API Health
function monitorAPIHealth() {
  setInterval(() => {
    const health = googleAdsAPI.client.getHealthStatus();

    console.log('\n=== Google Ads API Health Status ===');
    console.log(`Authentication: ${health.auth ? 'OK' : 'No Token'}`);

    if (health.rateLimiter) {
      console.log(`Daily Operations Used: ${health.rateLimiter.dailyOperations}`);
      console.log(`Remaining Operations: ${health.rateLimiter.remainingOperations}`);
      console.log(`Access Level: ${health.rateLimiter.accessLevel}`);
      console.log(`Reset Time: ${health.rateLimiter.resetTime}`);
    }

    console.log(`Circuit Breaker: ${health.circuitBreaker.state}`);
    console.log(`Success Rate: ${health.circuitBreaker.successRate}%`);

    if (health.circuitBreaker.failureBreakdown) {
      console.log('Failure Types:', health.circuitBreaker.failureBreakdown);
    }
  }, 60000); // Check every minute
}

// Export example functions for testing
export {
  authenticateUser,
  getCampaignPerformance,
  getAccountSummary,
  searchWithGAQL,
  getPerformanceTimeline,
  robustAPICall,
  getSearchTermsReport,
  streamAllCampaigns,
  monitorAPIHealth,
};
