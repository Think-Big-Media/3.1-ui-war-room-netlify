// React Query hooks for Google Ads API integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoogleAdsAPI } from '../../api/google';
import type {
  GoogleAdsConfig,
  InsightsParams,
  CampaignData,
  AdGroupData,
  KeywordData,
  SearchTermData,
  CustomerData,
  AccessToken,
  ReportData,
  ChangeData,
} from '../../api/google/types';
import { GoogleAdsAPIError } from '../../api/google/errors';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Initialize Google Ads API client
const getGoogleAdsAPI = () => {
  const config: GoogleAdsConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
    developerToken: import.meta.env.VITE_GOOGLE_DEVELOPER_TOKEN || '',
    redirectUri:
      import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/api/google/callback`,
    apiVersion: 'v20', // Updated to latest stable version
  };

  if (!config.clientId || !config.clientSecret || !config.developerToken) {
    console.warn('Google Ads API credentials not configured');
  }

  return createGoogleAdsAPI({ config });
};

// Query keys factory
export const googleAdsQueryKeys = {
  all: ['googleAds'] as const,
  auth: () => [...googleAdsQueryKeys.all, 'auth'] as const,
  customers: () => [...googleAdsQueryKeys.all, 'customers'] as const,
  customer: (customerId: string) => [...googleAdsQueryKeys.customers(), customerId] as const,
  campaigns: (customerId: string) =>
    [...googleAdsQueryKeys.customer(customerId), 'campaigns'] as const,
  campaign: (customerId: string, campaignId: string) =>
    [...googleAdsQueryKeys.campaigns(customerId), campaignId] as const,
  adGroups: (customerId: string, campaignId: string) =>
    [...googleAdsQueryKeys.campaign(customerId, campaignId), 'adGroups'] as const,
  keywords: (customerId: string, adGroupId: string) =>
    [...googleAdsQueryKeys.customer(customerId), 'keywords', adGroupId] as const,
  insights: (customerId: string, params?: InsightsParams) =>
    [...googleAdsQueryKeys.customer(customerId), 'insights', params] as const,
  reports: (customerId: string, reportType: string) =>
    [...googleAdsQueryKeys.customer(customerId), 'reports', reportType] as const,
  changes: (customerId: string) => [...googleAdsQueryKeys.customer(customerId), 'changes'] as const,
};

// Authentication hooks
export const useGoogleAdsAuth = () => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);
  const queryClient = useQueryClient();

  // Get current auth status
  const { data: authToken, isLoading } = useQuery({
    queryKey: googleAdsQueryKeys.auth(),
    queryFn: () => {
      const token = googleAdsAPI.auth.getCachedToken();
      return token;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate login URL
  const getLoginUrl = useCallback(
    (scopes: string[] = ['https://www.googleapis.com/auth/adwords']) => {
      return googleAdsAPI.auth.getLoginUrl(scopes);
    },
    [googleAdsAPI]
  );

  // Exchange code for token
  const exchangeCode = useMutation({
    mutationFn: async (code: string) => {
      const token = await googleAdsAPI.auth.exchangeCodeForToken(code);
      return token;
    },
    onSuccess: (token) => {
      queryClient.setQueryData(googleAdsQueryKeys.auth(), token);
      toast.success('Successfully connected to Google Ads');
    },
    onError: (error: GoogleAdsAPIError) => {
      toast.error(`Authentication failed: ${error.message}`);
    },
  });

  // Refresh token
  const refreshToken = useMutation({
    mutationFn: async () => {
      const currentToken = googleAdsAPI.auth.getCachedToken();
      if (!currentToken?.refresh_token) {
        throw new Error('No refresh token available');
      }
      return await googleAdsAPI.auth.refreshToken(currentToken.refresh_token);
    },
    onSuccess: (token) => {
      queryClient.setQueryData(googleAdsQueryKeys.auth(), token);
    },
    onError: (error: GoogleAdsAPIError) => {
      toast.error(`Token refresh failed: ${error.message}`);
    },
  });

  // Logout
  const logout = useCallback(() => {
    googleAdsAPI.auth.clearCache();
    queryClient.removeQueries({ queryKey: googleAdsQueryKeys.all });
    toast.success('Disconnected from Google Ads');
  }, [googleAdsAPI, queryClient]);

  return {
    isAuthenticated: Boolean(authToken),
    isLoading,
    authToken,
    getLoginUrl,
    exchangeCode: exchangeCode.mutate,
    refreshToken: refreshToken.mutate,
    logout,
    isExchangingCode: exchangeCode.isPending,
    isRefreshing: refreshToken.isPending,
  };
};

// Customer accounts hook
export const useGoogleAdsCustomers = (options?: { enabled?: boolean }) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: googleAdsQueryKeys.customers(),
    queryFn: async () => {
      try {
        const customers = await googleAdsAPI.customers.listAccessibleCustomers();
        return customers;
      } catch (error) {
        if (error instanceof GoogleAdsAPIError) {
          handleGoogleAdsError(error);
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Campaigns hook
export const useGoogleAdsCampaigns = (
  customerId: string,
  options?: {
    enabled?: boolean;
    includeRemoved?: boolean;
  }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: googleAdsQueryKeys.campaigns(customerId),
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const campaigns = await googleAdsAPI.campaigns.listCampaigns(customerId);
      return campaigns;
    },
    enabled: options?.enabled !== false && Boolean(customerId),
    staleTime: 5 * 60 * 1000,
  });
};

// Campaign insights hook
export const useGoogleAdsCampaignInsights = (
  customerId: string,
  campaignId: string,
  params: InsightsParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: googleAdsQueryKeys.insights(customerId, params),
    queryFn: async () => {
      if (!customerId || !campaignId) {
        throw new Error('Customer ID and Campaign ID are required');
      }

      const insights = await googleAdsAPI.insights.getCampaignInsights(
        customerId,
        campaignId,
        params
      );
      return insights;
    },
    enabled: options?.enabled !== false && Boolean(customerId) && Boolean(campaignId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
};

// Ad Groups hook
export const useGoogleAdsAdGroups = (
  customerId: string,
  campaignId: string,
  options?: { enabled?: boolean }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: googleAdsQueryKeys.adGroups(customerId, campaignId),
    queryFn: async () => {
      if (!customerId || !campaignId) {
        throw new Error('Customer ID and Campaign ID are required');
      }

      const adGroups = await googleAdsAPI.adGroups.listAdGroups(customerId, campaignId);
      return adGroups;
    },
    enabled: options?.enabled !== false && Boolean(customerId) && Boolean(campaignId),
    staleTime: 5 * 60 * 1000,
  });
};

// Keywords hook
export const useGoogleAdsKeywords = (
  customerId: string,
  adGroupId: string,
  options?: { enabled?: boolean }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: googleAdsQueryKeys.keywords(customerId, adGroupId),
    queryFn: async () => {
      if (!customerId || !adGroupId) {
        throw new Error('Customer ID and Ad Group ID are required');
      }

      const keywords = await googleAdsAPI.keywords.listKeywords(customerId, adGroupId);
      return keywords;
    },
    enabled: options?.enabled !== false && Boolean(customerId) && Boolean(adGroupId),
    staleTime: 5 * 60 * 1000,
  });
};

// Search terms report hook
export const useGoogleAdsSearchTerms = (
  customerId: string,
  params: {
    campaignId?: string;
    dateRange: { startDate: string; endDate: string };
  },
  options?: { enabled?: boolean }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: [...googleAdsQueryKeys.reports(customerId, 'searchTerms'), params],
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const searchTerms = await googleAdsAPI.reports.getSearchTermsReport(customerId, params);
      return searchTerms;
    },
    enabled: options?.enabled !== false && Boolean(customerId),
    staleTime: 15 * 60 * 1000, // 15 minutes for reports
  });
};

// Account-level insights hook
export const useGoogleAdsAccountInsights = (
  customerId: string,
  params: InsightsParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: googleAdsQueryKeys.insights(customerId, params),
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const insights = await googleAdsAPI.insights.getAccountInsights(customerId, params);
      return insights;
    },
    enabled: options?.enabled !== false && Boolean(customerId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
};

// Campaign mutations
export const useGoogleAdsCampaignMutations = (customerId: string) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);
  const queryClient = useQueryClient();

  const updateBudget = useMutation({
    mutationFn: async ({
      campaignId,
      dailyBudget,
    }: {
      campaignId: string;
      dailyBudget: number;
    }) => {
      return await googleAdsAPI.campaigns.updateCampaignBudget(customerId, campaignId, dailyBudget);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: googleAdsQueryKeys.campaign(customerId, variables.campaignId),
      });
      toast.success('Campaign budget updated successfully');
    },
    onError: (error: GoogleAdsAPIError) => {
      toast.error(`Failed to update budget: ${error.message}`);
    },
  });

  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return await googleAdsAPI.campaigns.pauseCampaign(customerId, campaignId);
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({
        queryKey: googleAdsQueryKeys.campaign(customerId, campaignId),
      });
      toast.success('Campaign paused successfully');
    },
    onError: (error: GoogleAdsAPIError) => {
      toast.error(`Failed to pause campaign: ${error.message}`);
    },
  });

  const enableCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return await googleAdsAPI.campaigns.enableCampaign(customerId, campaignId);
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({
        queryKey: googleAdsQueryKeys.campaign(customerId, campaignId),
      });
      toast.success('Campaign enabled successfully');
    },
    onError: (error: GoogleAdsAPIError) => {
      toast.error(`Failed to enable campaign: ${error.message}`);
    },
  });

  return {
    updateBudget: updateBudget.mutate,
    pauseCampaign: pauseCampaign.mutate,
    enableCampaign: enableCampaign.mutate,
    isUpdatingBudget: updateBudget.isPending,
    isPausing: pauseCampaign.isPending,
    isEnabling: enableCampaign.isPending,
  };
};

// Change history hook
export const useGoogleAdsChangeHistory = (
  customerId: string,
  params: {
    dateRange: { startDate: string; endDate: string };
    resourceType?: string;
  },
  options?: { enabled?: boolean }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: [...googleAdsQueryKeys.changes(customerId), params],
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const changes = await googleAdsAPI.changes.getChangeHistory(customerId, params);
      return changes;
    },
    enabled: options?.enabled !== false && Boolean(customerId),
    staleTime: 10 * 60 * 1000,
  });
};

// Utility hook for real-time performance monitoring
export const useGoogleAdsPerformanceStream = (
  customerId: string,
  campaignIds: string[],
  options?: {
    enabled?: boolean;
    pollInterval?: number; // Default 5 minutes
  }
) => {
  const params: InsightsParams = {
    account_id: customerId,
    date_preset: 'today',
    fields: ['impressions', 'clicks', 'cost', 'conversions'],
  };

  const { data, refetch, isLoading, error } = useGoogleAdsAccountInsights(customerId, params, {
    enabled: options?.enabled && campaignIds.length > 0,
    refetchInterval: options?.pollInterval || 5 * 60 * 1000,
  });

  return {
    performance: data,
    isStreaming: isLoading,
    error,
    refresh: refetch,
  };
};

// Hook to get API health status
export const useGoogleAdsAPIHealth = () => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: [...googleAdsQueryKeys.all, 'health'],
    queryFn: () => {
      return googleAdsAPI.client.getHealthStatus();
    },
    refetchInterval: 60 * 1000, // Check every minute
  });
};

// Error handler utility
const handleGoogleAdsError = (error: GoogleAdsAPIError) => {
  switch (error.status || error.code) {
    case 'UNAUTHENTICATED':
    case 401:
      toast.error('Session expired. Please login again.');
      break;
    case 'RESOURCE_EXHAUSTED':
    case 429:
      toast.error('API quota exceeded. Please try again later.');
      break;
    case 'PERMISSION_DENIED':
    case 403:
      toast.error('Insufficient permissions. Please check your access.');
      break;
    case 'INVALID_ARGUMENT':
    case 400:
      toast.error('Invalid request parameters.');
      break;
    default:
      toast.error(error.message || 'An error occurred with Google Ads API');
  }
};

// Hook for handling errors globally
export const useGoogleAdsErrorHandler = () => {
  const queryClient = useQueryClient();
  const { logout } = useGoogleAdsAuth();

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof GoogleAdsAPIError) {
        handleGoogleAdsError(error);

        if (error.status === 'UNAUTHENTICATED' || error.code === 401) {
          logout();
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    },
    [logout]
  );

  return { handleError };
};

// Aggregated insights across campaigns
export const useGoogleAdsAggregatedInsights = (
  customerId: string,
  campaignIds: string[],
  params: InsightsParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const googleAdsAPI = useMemo(() => getGoogleAdsAPI(), []);

  return useQuery({
    queryKey: [...googleAdsQueryKeys.insights(customerId, params), 'aggregated', campaignIds],
    queryFn: async () => {
      if (!customerId || campaignIds.length === 0) {
        throw new Error('Customer ID and campaign IDs are required');
      }

      // Fetch insights for all campaigns in parallel
      const promises = campaignIds.map((campaignId) =>
        googleAdsAPI.insights.getCampaignInsights(customerId, campaignId, params)
      );

      const results = await Promise.all(promises);

      // Aggregate the results
      return results.reduce((acc: any, insights: any) => {
        // Aggregate logic here
        return {
          ...acc,
          impressions: (acc.impressions || 0) + (insights.impressions || 0),
          clicks: (acc.clicks || 0) + (insights.clicks || 0),
          cost: (acc.cost || 0) + (insights.cost || 0),
          conversions: (acc.conversions || 0) + (insights.conversions || 0),
        };
      }, {} as any);
    },
    enabled: options?.enabled !== false && Boolean(customerId) && campaignIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
};
