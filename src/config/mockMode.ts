/**
 * Mock Mode Configuration
 * Automatically switches between real API data and mock data based on credential availability
 */

// Check if Meta API credentials are available
const hasMetaCredentials = Boolean(
  import.meta.env?.VITE_META_APP_ID &&
    import.meta.env?.VITE_META_APP_SECRET &&
    import.meta.env?.VITE_META_ACCESS_TOKEN
);

// Check if Google Ads credentials are available
const hasGoogleAdsCredentials = Boolean(
  import.meta.env?.VITE_GOOGLE_ADS_CLIENT_ID &&
    import.meta.env?.VITE_GOOGLE_ADS_CLIENT_SECRET &&
    import.meta.env?.VITE_GOOGLE_ADS_DEVELOPER_TOKEN
);

// Check other service credentials
const hasOpenAICredentials = Boolean(import.meta.env?.VITE_OPENAI_API_KEY);
const hasSendGridCredentials = Boolean(import.meta.env?.VITE_SENDGRID_API_KEY);
const hasTwilioCredentials = Boolean(
  import.meta.env?.VITE_TWILIO_ACCOUNT_SID && import.meta.env?.VITE_TWILIO_AUTH_TOKEN
);

export const mockModeConfig = {
  // Force mock mode with env var (for development/demo)
  forceMockMode: import.meta.env?.VITE_FORCE_MOCK_MODE === 'true',

  // Individual service mock modes
  meta: {
    enabled: !hasMetaCredentials || import.meta.env?.VITE_FORCE_MOCK_MODE === 'true',
    hasCredentials: hasMetaCredentials,
  },

  googleAds: {
    enabled: !hasGoogleAdsCredentials || import.meta.env?.VITE_FORCE_MOCK_MODE === 'true',
    hasCredentials: hasGoogleAdsCredentials,
  },

  openai: {
    enabled: !hasOpenAICredentials || import.meta.env?.VITE_FORCE_MOCK_MODE === 'true',
    hasCredentials: hasOpenAICredentials,
  },

  pinecone: {
    enabled: !hasOpenAICredentials || import.meta.env?.VITE_FORCE_MOCK_MODE === 'true', // Use OpenAI credentials as proxy
    hasCredentials: hasOpenAICredentials,
  },

  sendgrid: {
    enabled: !hasSendGridCredentials || import.meta.env?.VITE_FORCE_MOCK_MODE === 'true',
    hasCredentials: hasSendGridCredentials,
  },

  twilio: {
    enabled: !hasTwilioCredentials || import.meta.env?.VITE_FORCE_MOCK_MODE === 'true',
    hasCredentials: hasTwilioCredentials,
  },
};

// Mock data for Meta campaigns
export const mockMetaCampaigns = [
  {
    id: '23851234567890123',
    name: 'Q4 Political Awareness Campaign',
    status: 'ACTIVE',
    objective: 'REACH',
    daily_budget: '500.00',
    lifetime_budget: null,
    created_time: '2024-01-15T10:30:00Z',
    updated_time: '2024-01-20T14:22:00Z',
  },
  {
    id: '23851234567890124',
    name: 'Voter Registration Drive',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    daily_budget: '750.00',
    lifetime_budget: null,
    created_time: '2024-01-10T09:15:00Z',
    updated_time: '2024-01-19T16:45:00Z',
  },
  {
    id: '23851234567890125',
    name: 'Issue Advocacy - Healthcare',
    status: 'PAUSED',
    objective: 'TRAFFIC',
    daily_budget: '300.00',
    lifetime_budget: null,
    created_time: '2024-01-05T11:00:00Z',
    updated_time: '2024-01-18T12:30:00Z',
  },
];

// Mock data for Meta insights
export const mockMetaInsights = {
  data: [
    {
      date_start: '2024-01-15',
      date_stop: '2024-01-21',
      impressions: '125432',
      clicks: '3456',
      spend: '2847.65',
      cpm: '22.68',
      cpc: '0.82',
      ctr: '2.75',
      reach: '89234',
      frequency: '1.41',
    },
  ],
  paging: {
    cursors: {
      before: 'MAZDZD',
      after: 'MQZDZD',
    },
  },
};

// Mock data for Meta ad accounts
export const mockMetaAdAccounts = {
  data: [
    {
      id: 'act_123456789',
      name: 'Think Big Media - Political Campaigns',
      account_status: 1,
      currency: 'USD',
      timezone_name: 'America/New_York',
      business: {
        id: '987654321',
        name: 'Think Big Media',
      },
    },
  ],
};

// Utility function to check if we should use mock data for a service
export const shouldUseMockData = (service: keyof typeof mockModeConfig) => {
  if (service === 'forceMockMode') {
    return mockModeConfig.forceMockMode;
  }
  return mockModeConfig[service]?.enabled ?? true;
};

// Get credential status for debugging
export const getCredentialStatus = () => ({
  meta: hasMetaCredentials,
  googleAds: hasGoogleAdsCredentials,
  openai: hasOpenAICredentials,
  sendgrid: hasSendGridCredentials,
  twilio: hasTwilioCredentials,
  forceMockMode: mockModeConfig.forceMockMode,
});
