// React Query hooks for Meta Business API integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMetaAPI } from '../../api/meta';
import type { InsightsParams, InsightsData, AccessToken, MetaConfig } from '../../api/meta/types';
import { MetaAPIError } from '../../api/meta/errors';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Initialize Meta API client
const getMetaAPI = () => {
  const config: MetaConfig = {
    appId: import.meta.env.VITE_META_APP_ID || '',
    appSecret: import.meta.env.VITE_META_APP_SECRET || '',
    apiVersion: '21.0', // Using latest stable version
    redirectUri:
      import.meta.env.VITE_META_REDIRECT_URI || `${window.location.origin}/api/meta/callback`,
  };

  if (!config.appId || !config.appSecret) {
    console.warn('Meta API credentials not configured');
  }

  return createMetaAPI({ config });
};

// Query keys factory
export const metaQueryKeys = {
  all: ['meta'] as const,
  auth: () => [...metaQueryKeys.all, 'auth'] as const,
  insights: () => [...metaQueryKeys.all, 'insights'] as const,
  accountInsights: (accountId: string, params?: InsightsParams) =>
    [...metaQueryKeys.insights(), 'account', accountId, params] as const,
  campaignInsights: (campaignId: string, params?: Omit<InsightsParams, 'accountId'>) =>
    [...metaQueryKeys.insights(), 'campaign', campaignId, params] as const,
  adSetInsights: (adSetId: string, params?: Omit<InsightsParams, 'accountId'>) =>
    [...metaQueryKeys.insights(), 'adSet', adSetId, params] as const,
  adInsights: (adId: string, params?: Omit<InsightsParams, 'accountId'>) =>
    [...metaQueryKeys.insights(), 'ad', adId, params] as const,
  aggregatedInsights: (params: InsightsParams & { campaignIds?: string[] }) =>
    [...metaQueryKeys.insights(), 'aggregated', params] as const,
};

// Authentication hooks
export const useMetaAuth = () => {
  const metaAPI = useMemo(() => getMetaAPI(), []);
  const queryClient = useQueryClient();

  // Get current auth status
  const { data: authToken, isLoading } = useQuery({
    queryKey: metaQueryKeys.auth(),
    queryFn: () => {
      const token = metaAPI.auth.getCachedToken();
      return token;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate login URL
  const getLoginUrl = useCallback(
    (scopes: string[] = ['ads_read', 'ads_management']) => {
      return metaAPI.auth.getLoginUrl(scopes);
    },
    [metaAPI]
  );

  // Exchange code for token
  const exchangeCode = useMutation({
    mutationFn: async (code: string) => {
      const token = await metaAPI.auth.exchangeCodeForToken(code);
      return token;
    },
    onSuccess: (token) => {
      queryClient.setQueryData(metaQueryKeys.auth(), token);
      toast.success('Successfully connected to Meta Business');
    },
    onError: (error: MetaAPIError) => {
      toast.error(`Authentication failed: ${error.message}`);
    },
  });

  // Refresh token
  const refreshToken = useMutation({
    mutationFn: async () => {
      const currentToken = metaAPI.auth.getCachedToken();
      if (!currentToken?.refresh_token) {
        throw new Error('No refresh token available');
      }
      return await metaAPI.auth.refreshToken(currentToken.refresh_token);
    },
    onSuccess: (token) => {
      queryClient.setQueryData(metaQueryKeys.auth(), token);
    },
    onError: (error: MetaAPIError) => {
      toast.error(`Token refresh failed: ${error.message}`);
    },
  });

  // Logout
  const logout = useCallback(() => {
    metaAPI.auth.clearCache();
    queryClient.removeQueries({ queryKey: metaQueryKeys.all });
    toast.success('Disconnected from Meta Business');
  }, [metaAPI, queryClient]);

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

// Account insights hook
export const useMetaAccountInsights = (
  accountId: string,
  params: InsightsParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const metaAPI = useMemo(() => getMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.accountInsights(accountId, params),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Account ID is required');
      }

      try {
        const insights = await metaAPI.insights.getAccountInsights({
          ...params,
          accountId,
        });
        return insights;
      } catch (error) {
        if (error instanceof MetaAPIError) {
          // Handle specific error types
          if (error.code === 190) {
            toast.error('Authentication expired. Please login again.');
          } else if (error.code === 4) {
            toast.error('Rate limit reached. Please try again later.');
          }
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false && Boolean(accountId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof MetaAPIError && error.code === 190) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Campaign insights hook
export const useMetaCampaignInsights = (
  campaignId: string,
  params: Omit<InsightsParams, 'accountId'>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const metaAPI = useMemo(() => getMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.campaignInsights(campaignId, params),
    queryFn: async () => {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const insights = await metaAPI.insights.getCampaignInsights(campaignId, params);
      return insights;
    },
    enabled: options?.enabled !== false && Boolean(campaignId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
};

// Ad set insights hook
export const useMetaAdSetInsights = (
  adSetId: string,
  params: Omit<InsightsParams, 'accountId'>,
  options?: {
    enabled?: boolean;
  }
) => {
  const metaAPI = useMemo(() => getMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.adSetInsights(adSetId, params),
    queryFn: async () => {
      if (!adSetId) {
        throw new Error('Ad Set ID is required');
      }

      const insights = await metaAPI.insights.getAdSetInsights(adSetId, params);
      return insights;
    },
    enabled: options?.enabled !== false && Boolean(adSetId),
    staleTime: 5 * 60 * 1000,
  });
};

// Individual ad insights hook
export const useMetaAdInsights = (
  adId: string,
  params: Omit<InsightsParams, 'accountId'>,
  options?: {
    enabled?: boolean;
  }
) => {
  const metaAPI = useMemo(() => getMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.adInsights(adId, params),
    queryFn: async () => {
      if (!adId) {
        throw new Error('Ad ID is required');
      }

      const insights = await metaAPI.insights.getAdInsights(adId, params);
      return insights;
    },
    enabled: options?.enabled !== false && Boolean(adId),
    staleTime: 5 * 60 * 1000,
  });
};

// Aggregated insights hook
export const useMetaAggregatedInsights = (
  params: InsightsParams & { campaignIds?: string[] },
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const metaAPI = useMemo(() => getMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.aggregatedInsights(params),
    queryFn: async () => {
      const aggregated = await metaAPI.insights.getAggregatedInsights(params);
      return aggregated;
    },
    enabled: options?.enabled !== false && Boolean(params.accountId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
};

// Utility hook for real-time insights streaming
export const useMetaInsightsStream = (
  params: InsightsParams,
  options?: {
    enabled?: boolean;
    pollInterval?: number; // Default 5 minutes
  }
) => {
  const { data, refetch, isLoading, error } = useMetaAccountInsights(params.accountId, params, {
    enabled: options?.enabled,
    refetchInterval: options?.pollInterval || 5 * 60 * 1000, // 5 minutes default
  });

  return {
    insights: data,
    isStreaming: isLoading,
    error,
    refresh: refetch,
  };
};

// Hook to get API health status
export const useMetaAPIHealth = () => {
  const metaAPI = useMemo(() => getMetaAPI(), []);

  return useQuery({
    queryKey: [...metaQueryKeys.all, 'health'],
    queryFn: () => {
      return metaAPI.client.getHealthStatus();
    },
    refetchInterval: 60 * 1000, // Check every minute
  });
};

// Hook for handling errors globally
export const useMetaErrorHandler = () => {
  const queryClient = useQueryClient();
  const { logout } = useMetaAuth();

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof MetaAPIError) {
        switch (error.code) {
          case 190: // Invalid token
            logout();
            toast.error('Session expired. Please login again.');
            break;
          case 4: // Rate limit
          case 17: // User request limit reached
            toast.error('Rate limit reached. Please try again later.');
            break;
          case 200: // Permission error
            toast.error('Insufficient permissions. Please check your access.');
            break;
          default:
            toast.error(error.message || 'An error occurred with Meta API');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    },
    [logout]
  );

  return { handleError };
};
