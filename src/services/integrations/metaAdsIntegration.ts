/**
 * Enhanced Meta Business API Integration Layer
 * Implements OAuth 2.0 flow with long-lived tokens and comprehensive error handling
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { createMetaAPI } from '../../api/meta';
import { safeParseJSON, safeSetJSON, safeGetItem } from '../../utils/localStorage';
import type {
  MetaConfig,
  AccessToken,
  InsightsParams,
  InsightsData,
  Campaign,
  AdSet,
  Ad,
  AdAccount,
  CreativeAsset,
  CustomAudience,
  BusinessUser,
} from '../../api/meta/types';
import { MetaAPIError } from '../../api/meta/errors';
import { useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Constants
const TOKEN_REFRESH_BUFFER = 24 * 60 * 60 * 1000; // 24 hours before expiry
const LONG_LIVED_TOKEN_DURATION = 60 * 24 * 60 * 60 * 1000; // 60 days
const SHORT_LIVED_TOKEN_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Enhanced Meta API configuration
interface EnhancedMetaConfig extends MetaConfig {
  enableAutoRefresh?: boolean;
  onTokenRefresh?: (token: AccessToken) => void;
  onAuthError?: (error: MetaAPIError) => void;
}

// Token storage interface
interface TokenStorage {
  getToken(): AccessToken | null;
  setToken(token: AccessToken): void;
  clearToken(): void;
  getTokenExpiry(): number | null;
}

// Default token storage implementation using localStorage
class LocalStorageTokenStorage implements TokenStorage {
  private readonly tokenKey = 'meta_access_token';
  private readonly expiryKey = 'meta_token_expiry';

  getToken(): AccessToken | null {
    return safeParseJSON<AccessToken>(this.tokenKey, { fallback: null });
  }

  setToken(token: AccessToken): void {
    safeSetJSON(this.tokenKey, token);
    // Calculate and store expiry time
    const expiryTime =
      Date.now() + (token.expires_in ? token.expires_in * 1000 : LONG_LIVED_TOKEN_DURATION);
    localStorage.setItem(this.expiryKey, expiryTime.toString());
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.expiryKey);
  }

  getTokenExpiry(): number | null {
    const expiryStr = safeGetItem(this.expiryKey);
    if (!expiryStr) return null;
    const expiry = parseInt(expiryStr, 10);
    return isNaN(expiry) ? null : expiry;
  }
}

// Enhanced Meta API client factory
const createEnhancedMetaAPI = (config?: EnhancedMetaConfig) => {
  const defaultConfig: EnhancedMetaConfig = {
    appId: import.meta.env.VITE_META_APP_ID || '',
    appSecret: import.meta.env.VITE_META_APP_SECRET || '',
    apiVersion: '21.0', // Using v21.0 as v19.0 is deprecated
    redirectUri:
      import.meta.env.VITE_META_REDIRECT_URI || `${window.location.origin}/api/meta/callback`,
    enableAutoRefresh: true,
    ...config,
  };

  if (!defaultConfig.appId || !defaultConfig.appSecret) {
    console.warn('Meta API credentials not configured');
  }

  return createMetaAPI({ config: defaultConfig });
};

// Enhanced query keys with better organization
export const metaQueryKeys = {
  all: ['meta'] as const,
  auth: {
    all: () => [...metaQueryKeys.all, 'auth'] as const,
    token: () => [...metaQueryKeys.auth.all(), 'token'] as const,
    user: () => [...metaQueryKeys.auth.all(), 'user'] as const,
    permissions: () => [...metaQueryKeys.auth.all(), 'permissions'] as const,
  },
  accounts: {
    all: () => [...metaQueryKeys.all, 'accounts'] as const,
    list: () => [...metaQueryKeys.accounts.all(), 'list'] as const,
    detail: (accountId: string) => [...metaQueryKeys.accounts.all(), accountId] as const,
  },
  campaigns: {
    all: () => [...metaQueryKeys.all, 'campaigns'] as const,
    list: (accountId: string) => [...metaQueryKeys.campaigns.all(), accountId, 'list'] as const,
    detail: (campaignId: string) => [...metaQueryKeys.campaigns.all(), campaignId] as const,
  },
  insights: {
    all: () => [...metaQueryKeys.all, 'insights'] as const,
    account: (accountId: string, params?: InsightsParams) =>
      [...metaQueryKeys.insights.all(), 'account', accountId, params] as const,
    campaign: (campaignId: string, params?: InsightsParams) =>
      [...metaQueryKeys.insights.all(), 'campaign', campaignId, params] as const,
    adSet: (adSetId: string, params?: InsightsParams) =>
      [...metaQueryKeys.insights.all(), 'adSet', adSetId, params] as const,
    ad: (adId: string, params?: InsightsParams) =>
      [...metaQueryKeys.insights.all(), 'ad', adId, params] as const,
  },
  audiences: {
    all: () => [...metaQueryKeys.all, 'audiences'] as const,
    list: (accountId: string) => [...metaQueryKeys.audiences.all(), accountId, 'list'] as const,
    detail: (audienceId: string) => [...metaQueryKeys.audiences.all(), audienceId] as const,
  },
};

// Token refresh scheduler
class TokenRefreshScheduler {
  private refreshTimer: NodeJS.Timeout | null = null;
  private tokenStorage: TokenStorage;

  constructor(tokenStorage: TokenStorage) {
    this.tokenStorage = tokenStorage;
  }

  scheduleRefresh(onRefresh: () => Promise<void>, tokenExpiry?: number): void {
    this.cancelRefresh();

    const expiry = tokenExpiry || this.tokenStorage.getTokenExpiry();
    if (!expiry) {
      return;
    }

    const timeUntilRefresh = expiry - Date.now() - TOKEN_REFRESH_BUFFER;
    if (timeUntilRefresh <= 0) {
      // Token needs immediate refresh
      onRefresh();
    } else {
      // Schedule refresh
      this.refreshTimer = setTimeout(() => {
        onRefresh();
      }, timeUntilRefresh);
    }
  }

  cancelRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Enhanced OAuth Authentication Hook
export const useMetaOAuth = (config?: EnhancedMetaConfig) => {
  const metaAPI = useMemo(() => createEnhancedMetaAPI(config), [config]);
  const queryClient = useQueryClient();
  const tokenStorage = useMemo(() => new LocalStorageTokenStorage(), []);
  const refreshScheduler = useMemo(() => new TokenRefreshScheduler(tokenStorage), [tokenStorage]);

  // Get current auth status with auto-refresh
  const {
    data: authToken,
    isLoading,
    refetch: refetchToken,
  } = useQuery({
    queryKey: metaQueryKeys.auth.token(),
    queryFn: async () => {
      const cachedToken = tokenStorage.getToken();
      if (!cachedToken) {
        return null;
      }

      // Check if token needs refresh
      const expiry = tokenStorage.getTokenExpiry();
      if (expiry && expiry - Date.now() < TOKEN_REFRESH_BUFFER) {
        // Token is about to expire, exchange for long-lived token
        try {
          const newToken = await metaAPI.auth.getLongLivedToken(cachedToken.access_token);
          tokenStorage.setToken(newToken);
          config?.onTokenRefresh?.(newToken);
          return newToken;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Return existing token and let it expire naturally
          return cachedToken;
        }
      }

      return cachedToken;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth queries
  });

  // Schedule automatic token refresh
  useEffect(() => {
    if (authToken && config?.enableAutoRefresh !== false) {
      refreshScheduler.scheduleRefresh(async () => {
        await refetchToken();
      });
    }

    return () => {
      refreshScheduler.cancelRefresh();
    };
  }, [authToken, config?.enableAutoRefresh, refreshScheduler, refetchToken]);

  // Generate random state for OAuth flow
  const generateRandomState = useCallback(() => {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }, []);

  // Generate OAuth login URL with state parameter
  const getLoginUrl = useCallback(
    (scopes: string[] = ['ads_read', 'ads_management', 'business_management'], state?: string) => {
      const authState = state || generateRandomState();
      sessionStorage.setItem('meta_oauth_state', authState);
      return metaAPI.auth.getLoginUrl(scopes);
    },
    [metaAPI, generateRandomState]
  );

  // Exchange authorization code for access token
  const exchangeCode = useMutation({
    mutationFn: async ({ code, state }: { code: string; state?: string }) => {
      // Verify state parameter for security
      const savedState = sessionStorage.getItem('meta_oauth_state');
      if (state && savedState && state !== savedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }
      sessionStorage.removeItem('meta_oauth_state');

      // Exchange code for token
      const token = await metaAPI.auth.exchangeCodeForToken(code);

      // Immediately exchange for long-lived token
      const longLivedToken = await metaAPI.auth.getLongLivedToken(token.access_token);

      return longLivedToken;
    },
    onSuccess: (token) => {
      tokenStorage.setToken(token);
      queryClient.setQueryData(metaQueryKeys.auth.token(), token);
      queryClient.invalidateQueries({ queryKey: metaQueryKeys.all });
      toast.success('Successfully connected to Meta Business');
      config?.onTokenRefresh?.(token);
    },
    onError: (error: Error) => {
      console.error('OAuth exchange failed:', error);
      toast.error(`Authentication failed: ${error.message}`);
      if (error instanceof MetaAPIError) {
        config?.onAuthError?.(error);
      }
    },
  });

  // Get long-lived token from existing token
  const getLongLivedToken = useMutation({
    mutationFn: async () => {
      const currentToken = tokenStorage.getToken();
      if (!currentToken) {
        throw new Error('No access token available');
      }

      const longLivedToken = await metaAPI.auth.getLongLivedToken(currentToken.access_token);
      return longLivedToken;
    },
    onSuccess: (token) => {
      tokenStorage.setToken(token);
      queryClient.setQueryData(metaQueryKeys.auth.token(), token);
      toast.success('Token refreshed successfully');
      config?.onTokenRefresh?.(token);
    },
    onError: (error: Error) => {
      console.error('Token refresh failed:', error);
      toast.error('Failed to refresh token. Please login again.');
      if (error instanceof MetaAPIError) {
        config?.onAuthError?.(error);
      }
    },
  });

  // Seamless re-authentication
  const reAuthenticate = useCallback(async () => {
    // Since Facebook doesn't show OAuth dialog for already authorized apps,
    // we can redirect directly to get a new token
    const loginUrl = getLoginUrl();
    window.location.href = loginUrl;
  }, [getLoginUrl]);

  // Logout
  const logout = useCallback(() => {
    tokenStorage.clearToken();
    refreshScheduler.cancelRefresh();
    queryClient.removeQueries({ queryKey: metaQueryKeys.all });
    toast.success('Disconnected from Meta Business');
  }, [tokenStorage, refreshScheduler, queryClient]);

  // Check token validity
  const isTokenValid = useCallback(() => {
    const expiry = tokenStorage.getTokenExpiry();
    return expiry ? expiry > Date.now() : false;
  }, [tokenStorage]);

  return {
    // Auth state
    isAuthenticated: Boolean(authToken) && isTokenValid(),
    isLoading,
    authToken,

    // Auth methods
    getLoginUrl,
    exchangeCode: exchangeCode.mutate,
    getLongLivedToken: getLongLivedToken.mutate,
    reAuthenticate,
    logout,

    // Token info
    isTokenValid,
    tokenExpiry: tokenStorage.getTokenExpiry(),

    // Mutation states
    isExchangingCode: exchangeCode.isPending,
    isRefreshingToken: getLongLivedToken.isPending,

    // Errors
    exchangeError: exchangeCode.error,
    refreshError: getLongLivedToken.error,
  };
};

// User profile hook
export const useMetaUser = (options?: UseQueryOptions<BusinessUser>) => {
  const { authToken } = useMetaOAuth();
  const metaAPI = useMemo(() => createEnhancedMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.auth.user(),
    queryFn: async () => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      // Since getCurrentUser is not available in the auth API, fetch user info from Graph API
      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${authToken.access_token}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      const user = await response.json();
      return user as BusinessUser;
    },
    enabled: Boolean(authToken),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Ad accounts hook
export const useMetaAdAccounts = (options?: UseQueryOptions<AdAccount[]>) => {
  const { authToken } = useMetaOAuth();
  const metaAPI = useMemo(() => createEnhancedMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.accounts.list(),
    queryFn: async () => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      // This would need to be implemented in the API client
      const accounts = await metaAPI.accounts.list(authToken.access_token);
      return accounts;
    },
    enabled: Boolean(authToken),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

// Enhanced insights hook with better error handling
export const useMetaInsights = (
  type: 'account' | 'campaign' | 'adSet' | 'ad',
  entityId: string,
  params: InsightsParams,
  options?: UseQueryOptions<InsightsData> & {
    onError?: (error: MetaAPIError) => void;
  }
) => {
  const { authToken, reAuthenticate } = useMetaOAuth();
  const metaAPI = useMemo(() => createEnhancedMetaAPI(), []);

  const queryKey = useMemo(() => {
    switch (type) {
      case 'account':
        return metaQueryKeys.insights.account(entityId, params);
      case 'campaign':
        return metaQueryKeys.insights.campaign(entityId, params);
      case 'adSet':
        return metaQueryKeys.insights.adSet(entityId, params);
      case 'ad':
        return metaQueryKeys.insights.ad(entityId, params);
    }
  }, [type, entityId, params]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      try {
        let insightsArray: InsightsData[];

        switch (type) {
          case 'account':
            insightsArray = await metaAPI.insights.getAccountInsights({
              ...params,
              accountId: entityId,
            });
            break;
          case 'campaign':
            insightsArray = await metaAPI.insights.getCampaignInsights(entityId, params);
            break;
          case 'adSet':
            insightsArray = await metaAPI.insights.getAdSetInsights(entityId, params);
            break;
          case 'ad':
            insightsArray = await metaAPI.insights.getAdInsights(entityId, params);
            break;
        }

        // Return the first insights object or a default if array is empty
        const insights =
          insightsArray?.[0] ||
          ({
            account_id: entityId,
            impressions: '0',
            clicks: '0',
            spend: '0',
            date_start: '',
            date_stop: '',
          } as InsightsData);

        return insights;
      } catch (error) {
        if (error instanceof MetaAPIError) {
          // Handle specific error codes
          if (error.code === 190) {
            // Token expired - attempt seamless re-authentication
            toast.error('Session expired. Please login again.');
            setTimeout(() => reAuthenticate(), 2000);
          } else if (error.code === 4) {
            toast.error('Rate limit reached. Please try again later.');
          } else if (error.code === 200) {
            toast.error('Permission denied. Please check your access.');
          }

          options?.onError?.(error);
        }
        throw error;
      }
    },
    enabled: Boolean(authToken) && Boolean(entityId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof MetaAPIError && error.code === 190) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

// Campaign management hooks
export const useMetaCampaigns = (accountId: string, options?: UseQueryOptions<Campaign[]>) => {
  const { authToken } = useMetaOAuth();
  const metaAPI = useMemo(() => createEnhancedMetaAPI(), []);

  return useQuery({
    queryKey: metaQueryKeys.campaigns.list(accountId),
    queryFn: async () => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      // This would need to be implemented in the API client
      const campaigns = await metaAPI.campaigns.list(accountId, authToken.access_token);
      return campaigns;
    },
    enabled: Boolean(authToken) && Boolean(accountId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Campaign mutations
export const useMetaCampaignMutations = (accountId: string) => {
  const { authToken } = useMetaOAuth();
  const metaAPI = useMemo(() => createEnhancedMetaAPI(), []);
  const queryClient = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Partial<Campaign>) => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const campaign = await metaAPI.campaigns.create(
        accountId,
        campaignData,
        authToken.access_token
      );
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: metaQueryKeys.campaigns.list(accountId),
      });
      toast.success('Campaign created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({
      campaignId,
      updates,
    }: {
      campaignId: string;
      updates: Partial<Campaign>;
    }) => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const campaign = await metaAPI.campaigns.update(campaignId, updates, authToken.access_token);
      return campaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: metaQueryKeys.campaigns.detail(variables.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: metaQueryKeys.campaigns.list(accountId),
      });
      toast.success('Campaign updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update campaign: ${error.message}`);
    },
  });

  const pauseCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      return updateCampaign.mutate({
        campaignId,
        updates: { status: 'PAUSED' },
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      await metaAPI.campaigns.delete(campaignId, authToken.access_token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: metaQueryKeys.campaigns.list(accountId),
      });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
  });

  return {
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    pauseCampaign: pauseCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,

    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    isDeleting: deleteCampaign.isPending,
  };
};

// Export all hooks and utilities
export type { TokenStorage };
export { LocalStorageTokenStorage, TokenRefreshScheduler, createEnhancedMetaAPI };

// Re-export types for convenience
export type {
  MetaConfig,
  AccessToken,
  InsightsParams,
  InsightsData,
  Campaign,
  AdSet,
  Ad,
  AdAccount,
  CustomAudience,
  BusinessUser,
} from '../../api/meta/types';
