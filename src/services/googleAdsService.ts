import axios from 'axios';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createLogger } from '../utils/logger';

const logger = createLogger('googleAdsService');

// Google Ads API configuration
const googleAdsApi = axios.create({
  baseURL: import.meta.env.VITE_GOOGLE_ADS_API_URL || 'https://googleads.googleapis.com/v20',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
googleAdsApi.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('googleAdsAccessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Zod schemas
const CampaignMetricsSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  cluster: z.string(),
  impressions: z.number(),
  clicks: z.number(),
  conversions: z.number(),
  spend: z.number(),
  ctr: z.number(),
  conversionRate: z.number(),
  roas: z.number(),
  performanceScore: z.number(), // 0-100 score for budget rotation
});

const CampaignPerformanceResponseSchema = z.object({
  campaigns: z.array(CampaignMetricsSchema),
  totalBudget: z.number(),
  budgetUtilization: z.number(),
});

const BudgetRotationResponseSchema = z.object({
  success: z.boolean(),
  oldCampaignId: z.string(),
  newCampaignId: z.string(),
  budgetTransferred: z.number(),
  message: z.string(),
});

// Mock data toggle - use config to determine if we should use mock data
import { shouldUseMockData } from '../config/mockMode';
const USE_MOCK_DATA = shouldUseMockData('googleAds');

// Service functions
export const googleAdsService = {
  /**
   * Get campaign performance metrics for 4 active clusters
   */
  getCampaignPerformance: async () => {
    if (USE_MOCK_DATA) {
      // Mock data for development
      const mockData = {
        campaigns: [
          {
            campaignId: 'camp_001',
            campaignName: 'AI Productivity Tools',
            cluster: 'AI Productivity Hacks',
            impressions: 45678,
            clicks: 2341,
            conversions: 187,
            spend: 2456.78,
            ctr: 5.12,
            conversionRate: 7.99,
            roas: 3.24,
            performanceScore: 92,
          },
          {
            campaignId: 'camp_002',
            campaignName: 'Workflow Automation',
            cluster: 'Business Process Automation',
            impressions: 38942,
            clicks: 1876,
            conversions: 143,
            spend: 2189.45,
            ctr: 4.82,
            conversionRate: 7.62,
            roas: 2.98,
            performanceScore: 85,
          },
          {
            campaignId: 'camp_003',
            campaignName: 'Remote Work Solutions',
            cluster: 'Digital Transformation',
            impressions: 29876,
            clicks: 987,
            conversions: 67,
            spend: 1987.32,
            ctr: 3.3,
            conversionRate: 6.79,
            roas: 1.87,
            performanceScore: 58, // Low performer
          },
          {
            campaignId: 'camp_004',
            campaignName: 'Team Collaboration',
            cluster: 'Team Productivity',
            impressions: 41234,
            clicks: 2098,
            conversions: 176,
            spend: 2376.45,
            ctr: 5.09,
            conversionRate: 8.39,
            roas: 3.56,
            performanceScore: 95,
          },
        ],
        totalBudget: 10000, // $10k grant
        budgetUtilization: 92.1,
      };

      return CampaignPerformanceResponseSchema.parse(mockData);
    }

    // Real API implementation
    const response = await googleAdsApi.get('/customers/{customer_id}/campaigns', {
      params: {
        query: `
          SELECT
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros,
            metrics.ctr,
            metrics.conversion_rate
          FROM campaign
          WHERE campaign.status = 'ENABLED'
          ORDER BY metrics.cost_micros DESC
          LIMIT 4
        `,
      },
    });

    // Transform response to match our schema
    return CampaignPerformanceResponseSchema.parse(response.data);
  },

  /**
   * Rotate budget from worst performing campaign to new cluster
   */
  rotateBudget: async (worstCampaignId: string, newClusterId: string) => {
    if (USE_MOCK_DATA) {
      // Mock implementation
      const mockResponse = {
        success: true,
        oldCampaignId: worstCampaignId,
        newCampaignId: `camp_${Date.now()}`,
        budgetTransferred: 2500,
        message: `Successfully rotated budget from campaign ${worstCampaignId} to new cluster "${newClusterId}"`,
      };

      return BudgetRotationResponseSchema.parse(mockResponse);
    }

    // Real API implementation would:
    // 1. Pause the worst performing campaign
    // 2. Create a new campaign for the new cluster
    // 3. Transfer the budget
    const response = await googleAdsApi.post('/customers/{customer_id}/campaigns:mutate', {
      operations: [
        {
          update: {
            resourceName: `customers/{customer_id}/campaigns/${worstCampaignId}`,
            status: 'PAUSED',
          },
        },
        {
          create: {
            name: newClusterId,
            status: 'ENABLED',
            // ... other campaign settings
          },
        },
      ],
    });

    return BudgetRotationResponseSchema.parse(response.data);
  },

  /**
   * Store Google Ads access token after OAuth
   */
  setAccessToken: (token: string) => {
    localStorage.setItem('googleAdsAccessToken', token);
  },
};

// React Query hooks
export const useGoogleAdsPerformance = () => {
  return useQuery({
    queryKey: ['googleAds', 'performance'],
    queryFn: googleAdsService.getCampaignPerformance,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: Boolean(localStorage.getItem('googleAdsAccessToken')) || USE_MOCK_DATA,
  });
};

export const useRotateBudget = () => {
  return useMutation({
    mutationFn: ({
      worstCampaignId,
      newClusterId,
    }: {
      worstCampaignId: string;
      newClusterId: string;
    }) => googleAdsService.rotateBudget(worstCampaignId, newClusterId),
    onSuccess: (data) => {
      logger.info('Budget rotation successful', { data });
    },
  });
};
