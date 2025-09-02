// Example usage of Meta Business API client

import { createMetaAPI } from './index';
import { type InsightsParams } from './types';

// Initialize the API client
const metaAPI = createMetaAPI({
  config: {
    appId: import.meta.env.META_APP_ID!,
    appSecret: import.meta.env.META_APP_SECRET!,
    apiVersion: '21.0', // Use latest version to avoid deprecation
    redirectUri: import.meta.env.META_REDIRECT_URI!,
  },
  rateLimiterConfig: {
    user: { tokens: 200, window: 3600000 }, // Conservative limits
    app: { tokens: 200, window: 3600000 },
  },
  circuitBreakerConfig: {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 3,
  },
});

// Example 1: OAuth Authentication Flow
async function authenticateUser() {
  // Step 1: Get login URL
  const loginUrl = metaAPI.auth.getLoginUrl(['ads_read', 'ads_management']);
  console.log('Redirect user to:', loginUrl);

  // Step 2: After user authorizes and returns with code
  const authCode = 'code_from_redirect'; // Get from URL params

  try {
    const token = await metaAPI.auth.exchangeCodeForToken(authCode);
    console.log('Access token obtained:', `${token.access_token.substring(0, 10)}...`);

    // Get long-lived token
    const longLivedToken = await metaAPI.auth.getLongLivedToken(token.access_token);
    console.log('Long-lived token obtained');

    return longLivedToken;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

// Example 2: Get Ad Account Insights
async function getAccountInsights(accountId: string) {
  const params: InsightsParams = {
    accountId,
    date_preset: 'last_30d',
    fields: ['impressions', 'clicks', 'spend', 'ctr', 'cpc', 'cpm'],
    level: 'campaign',
  };

  try {
    const insights = await metaAPI.insights.getAccountInsights(params);

    console.log(`Found ${insights.length} campaigns`);
    insights.forEach((insight) => {
      console.log(`
        Campaign: ${insight.campaign_name}
        Impressions: ${insight.impressions}
        Clicks: ${insight.clicks}
        Spend: $${insight.spend}
        CTR: ${insight.ctr}%
        CPC: $${insight.cpc}
        CPM: $${insight.cpm}
      `);
    });

    return insights;
  } catch (error) {
    console.error('Failed to get insights:', error);
    throw error;
  }
}

// Example 3: Get Aggregated Metrics
async function getAggregatedMetrics(accountId: string) {
  const params: InsightsParams = {
    accountId,
    date_preset: 'last_7d',
  };

  try {
    const aggregated = await metaAPI.insights.getAggregatedInsights(params);

    console.log('7-Day Summary:');
    console.log(`Total Spend: $${aggregated.summary.totalSpend.toFixed(2)}`);
    console.log(`Total Impressions: ${aggregated.summary.totalImpressions.toLocaleString()}`);
    console.log(`Total Clicks: ${aggregated.summary.totalClicks.toLocaleString()}`);
    console.log(`Average CTR: ${aggregated.summary.averageCTR.toFixed(2)}%`);
    console.log(`Average CPC: $${aggregated.summary.averageCPC.toFixed(2)}`);
    console.log(`Average CPM: $${aggregated.summary.averageCPM.toFixed(2)}`);

    return aggregated;
  } catch (error) {
    console.error('Failed to get aggregated metrics:', error);
    throw error;
  }
}

// Example 4: Stream Real-time Insights
async function streamRealTimeInsights(accountId: string) {
  const params: InsightsParams = {
    accountId,
    date_preset: 'today',
    level: 'account',
  };

  console.log('Starting real-time insights stream...');

  // Stream insights every 5 minutes
  for await (const insights of metaAPI.insights.streamInsights(params, 300000)) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] New insights received:`);

    insights.forEach((insight) => {
      console.log(`Spend today: $${insight.spend}`);
      console.log(`Impressions today: ${insight.impressions}`);
      console.log(`Clicks today: ${insight.clicks}`);
    });
  }
}

// Example 5: Handle Errors and Rate Limits
async function robustAPICall(accountId: string) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const insights = await metaAPI.insights.getAccountInsights({
        accountId,
        date_preset: 'yesterday',
      });

      return insights;
    } catch (error) {
      attempt++;

      if ((error as any).name === 'MetaRateLimitError') {
        const waitTime = (error as any).estimatedTimeToRegainAccess || 60000;
        console.log(`Rate limited. Waiting ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else if ((error as any).name === 'CircuitBreakerOpenError') {
        console.log('Circuit breaker open. Service unavailable.');
        throw error;
      } else if (attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt); // Simple exponential backoff
        console.log(`Error occurred. Retrying in ${backoff / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        throw error;
      }
    }
  }
}

// Example 6: Get Insights with Breakdowns
async function getInsightsByDemographics(accountId: string) {
  const params: InsightsParams & { breakdowns: string[] } = {
    accountId,
    date_preset: 'last_30d',
    breakdowns: ['age', 'gender'],
    level: 'account' as const,
  };

  try {
    const breakdownInsights = await metaAPI.insights.getInsightsWithBreakdowns(params);

    console.log('Insights by Demographics:');
    breakdownInsights.forEach((insights, key) => {
      const [age, gender] = key.split('|');
      console.log(`\nAge: ${age}, Gender: ${gender}`);

      const totalSpend = insights.reduce((sum, i) => sum + parseFloat(i.spend || '0'), 0);
      const totalClicks = insights.reduce((sum, i) => sum + parseInt(i.clicks || '0'), 0);

      console.log(`  Spend: $${totalSpend.toFixed(2)}`);
      console.log(`  Clicks: ${totalClicks}`);
    });
  } catch (error) {
    console.error('Failed to get breakdown insights:', error);
    throw error;
  }
}

// Example 7: Monitor API Health
function monitorAPIHealth() {
  setInterval(() => {
    const health = metaAPI.client.getHealthStatus();

    console.log('\n=== Meta API Health Status ===');
    console.log(`Authentication: ${health.auth ? 'OK' : 'No Token'}`);

    if (health.rateLimiter) {
      console.log(`Rate Limit: ${health.rateLimiter.tokensRemaining} tokens remaining`);
      console.log(`Usage: ${health.rateLimiter.percentageUsed}%`);
    }

    console.log(`Circuit Breaker: ${health.circuitBreaker.state}`);
    console.log(`Success Rate: ${health.circuitBreaker.successRate}%`);

    if (health.circuitBreaker.lastFailure) {
      console.log(`Last Failure: ${health.circuitBreaker.lastFailure}`);
    }
  }, 60000); // Check every minute
}

// Export example functions for testing
export {
  authenticateUser,
  getAccountInsights,
  getAggregatedMetrics,
  streamRealTimeInsights,
  robustAPICall,
  getInsightsByDemographics,
  monitorAPIHealth,
};
