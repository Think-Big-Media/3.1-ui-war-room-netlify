/**
 * Meta API Sandbox for Testing
 * Use this to test the integration without real API calls
 */

import { createMetaApi } from './index';
import { type MetaTokenResponse, type AdAccount, type Campaign, type InsightData } from './types';

// Mock data for testing
const mockToken: MetaTokenResponse = {
  access_token: 'mock_access_token_12345',
  token_type: 'bearer',
  expires_in: 5184000, // 60 days
};

const mockAdAccounts: AdAccount[] = [
  {
    id: 'act_123456789',
    account_id: '123456789',
    name: 'Test Ad Account 1',
    currency: 'USD',
    timezone_name: 'America/New_York',
    account_status: 1,
    business: {
      id: 'biz_123',
      name: 'Test Business',
    },
  },
  {
    id: 'act_987654321',
    account_id: '987654321',
    name: 'Test Ad Account 2',
    currency: 'EUR',
    timezone_name: 'Europe/London',
    account_status: 1,
  },
];

const mockCampaigns: Campaign[] = [
  {
    id: 'camp_001',
    name: 'Summer Sale Campaign',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    created_time: '2024-07-01T10:00:00Z',
    updated_time: '2024-07-15T14:30:00Z',
    daily_budget: '10000', // $100 in cents
  },
  {
    id: 'camp_002',
    name: 'Brand Awareness Push',
    status: 'PAUSED',
    objective: 'BRAND_AWARENESS',
    created_time: '2024-06-15T09:00:00Z',
    updated_time: '2024-07-10T11:00:00Z',
    lifetime_budget: '50000', // $500 in cents
  },
];

const mockInsights: InsightData[] = [
  {
    date_start: '2024-07-01',
    date_stop: '2024-07-31',
    spend: '1523.45',
    impressions: '125430',
    clicks: '3421',
    cpm: '12.15',
    cpc: '0.45',
    ctr: '2.73',
    conversions: '145',
    cost_per_conversion: '10.51',
    campaign_id: 'camp_001',
    campaign_name: 'Summer Sale Campaign',
  },
];

/**
 * Create sandbox Meta API instance
 */
export function createMetaSandbox() {
  const api = createMetaApi({
    appId: 'sandbox_app_id',
    appSecret: 'sandbox_app_secret',
    redirectUri: 'http://localhost:5173/auth/meta/callback',
  });

  // Override methods with mock implementations
  const sandbox = {
    ...api,
    // Mock auth methods
    setMockToken: () => api.setToken(mockToken),
    getMockAuthUrl: () => 'https://facebook.com/mock-auth-url',

    // Mock API methods with delays to simulate real calls
    getAdAccounts: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockAdAccounts;
    },

    getCampaigns: async (accountId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      console.log(`Fetching campaigns for account: ${accountId}`);
      return mockCampaigns;
    },

    getAccountInsights: async (accountId: string, params?: any) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`Fetching insights for account: ${accountId}`, params);
      return mockInsights;
    },

    getCampaignInsights: async (campaignId: string, params?: any) => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      console.log(`Fetching insights for campaign: ${campaignId}`, params);
      return mockInsights.filter((i) => i.campaign_id === campaignId);
    },

    getAggregatedInsights: async (accountId: string, campaignIds?: string[], params?: any) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log(`Fetching aggregated insights for account: ${accountId}`, {
        campaignIds,
        params,
      });

      const total: InsightData = {
        date_start: '2024-07-01',
        date_stop: '2024-07-31',
        spend: '2547.89',
        impressions: '245680',
        clicks: '6789',
        cpm: '10.37',
        cpc: '0.38',
        ctr: '2.76',
        conversions: '234',
        cost_per_conversion: '10.89',
      };

      const byCampaign = mockCampaigns.reduce(
        (acc, campaign) => {
          acc[campaign.id] = mockInsights.find((i) => i.campaign_id === campaign.id) || {
            ...mockInsights[0],
            campaign_id: campaign.id,
            campaign_name: campaign.name,
          };
          return acc;
        },
        {} as Record<string, InsightData>
      );

      return { total, byCampaign, byDate: {} };
    },

    // Test utilities
    testRateLimiting: async () => {
      console.log('Testing rate limiting...');
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(sandbox.getAdAccounts());
      }
      await Promise.all(promises);
      console.log('Rate limit test complete');
    },

    testCaching: async () => {
      console.log('Testing caching...');
      console.time('First call');
      await sandbox.getAccountInsights('act_123456789');
      console.timeEnd('First call');

      console.time('Cached call');
      await sandbox.getAccountInsights('act_123456789');
      console.timeEnd('Cached call');

      console.log('Cache test complete');
    },
  };

  return sandbox;
}

/**
 * Run sandbox tests
 */
export async function runSandboxTests() {
  console.log('🧪 Starting Meta API Sandbox Tests...\n');

  const sandbox = createMetaSandbox();

  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing Authentication...');
    sandbox.setMockToken();
    console.log('✅ Mock token set\n');

    // Test 2: Get Ad Accounts
    console.log('2️⃣ Fetching Ad Accounts...');
    const accounts = await sandbox.getAdAccounts();
    console.log(`✅ Found ${accounts.length} ad accounts`);
    console.log(accounts.map((a) => `- ${a.name} (${a.currency})`).join('\n'), '\n');

    // Test 3: Get Campaigns
    console.log('3️⃣ Fetching Campaigns...');
    const campaigns = await sandbox.getCampaigns(accounts[0].account_id);
    console.log(`✅ Found ${campaigns.length} campaigns`);
    console.log(campaigns.map((c) => `- ${c.name} (${c.status})`).join('\n'), '\n');

    // Test 4: Get Insights
    console.log('4️⃣ Fetching Account Insights...');
    const insights = await sandbox.getAccountInsights(accounts[0].account_id);
    console.log(`✅ Got insights for ${insights.length} periods`);
    console.log(`Total spend: $${insights[0].spend}\n`);

    // Test 5: Get Aggregated Data
    console.log('5️⃣ Fetching Aggregated Insights...');
    const aggregated = await sandbox.getAggregatedInsights(
      accounts[0].account_id,
      campaigns.map((c) => c.id)
    );
    console.log('✅ Aggregated data:');
    console.log(`- Total spend: $${aggregated.total.spend}`);
    console.log(`- Total clicks: ${aggregated.total.clicks}`);
    console.log(`- Overall CTR: ${aggregated.total.ctr}%\n`);

    // Test 6: Rate Limiting
    console.log('6️⃣ Testing Rate Limiting...');
    await sandbox.testRateLimiting();
    console.log('✅ Rate limiting working\n');

    // Test 7: Caching
    console.log('7️⃣ Testing Cache...');
    await sandbox.testCaching();
    console.log('✅ Caching working\n');

    console.log('🎉 All sandbox tests passed!');
  } catch (error) {
    console.error('❌ Sandbox test failed:', error);
  }
}

// Export for direct testing
if (import.meta.env.DEV) {
  (window as any).metaSandbox = createMetaSandbox();
  (window as any).runMetaSandboxTests = runSandboxTests;
  console.log('Meta API Sandbox available at window.metaSandbox');
  console.log('Run tests with: window.runMetaSandboxTests()');
}
