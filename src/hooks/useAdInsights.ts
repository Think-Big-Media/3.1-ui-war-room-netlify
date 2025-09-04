/**
 * React Query hooks for Ad Insights API
 * Replaces mock data with live API connections
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adInsightsApi,
  type AdInsightsResponse,
  type RealTimeAlert,
  type CampaignHealthData,
} from '../services/adInsightsApi';
import { createLogger } from '../utils/logger';

const logger = createLogger('useAdInsights');

// Query key factory
const adInsightsKeys = {
  all: ['adInsights'] as const,
  campaigns: (params?: any) => [...adInsightsKeys.all, 'campaigns', params] as const,
  alerts: (params?: any) => [...adInsightsKeys.all, 'alerts', params] as const,
  health: () => [...adInsightsKeys.all, 'health'] as const,
  platform: (platform: string, params?: any) =>
    [...adInsightsKeys.all, 'platform', platform, params] as const,
};

/**
 * Hook to get unified campaign insights
 */
export function useAdInsights(
  params: {
    date_preset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d';
    account_ids?: string;
    include_inactive?: boolean;
    real_time?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: adInsightsKeys.campaigns(params),
    queryFn: () => adInsightsApi.getCampaignInsights(params),
    staleTime: params.real_time ? 0 : 1000 * 60 * 5, // 5 minutes for non-real-time
    refetchInterval: params.real_time ? 1000 * 30 : 1000 * 60 * 2, // 30s real-time, 2min normal
    retry: (failureCount: number, error: any) => {
      // Don't retry on auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to get real-time alerts
 */
export function useAdAlerts(
  params: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    platform?: 'meta' | 'google';
    limit?: number;
  } = {}
) {
  return useQuery({
    queryKey: adInsightsKeys.alerts(params),
    queryFn: () => adInsightsApi.getAlerts(params),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get campaign health status
 */
export function useCampaignHealth() {
  return useQuery({
    queryKey: adInsightsKeys.health(),
    queryFn: async () => {
      try {
        return await adInsightsApi.getCampaignHealth();
      } catch (error) {
        logger.warn('Using fallback health data due to API error', error);
        // Return fallback data that matches CampaignHealthData interface
        return {
          meta_status: 'offline' as const,
          google_status: 'offline' as const,
          overall_health: 'warning' as const,
          total_daily_spend: 0,
          daily_spend_limit: 1000,
          active_campaigns: 0,
          performance_score: 0,
          last_updated: new Date().toISOString(),
        };
      }
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get platform-specific metrics
 */
export function usePlatformMetrics(
  platform: 'meta' | 'google',
  params: {
    date_preset?: string;
    account_id?: string;
  } = {}
) {
  return useQuery({
    queryKey: adInsightsKeys.platform(platform, params),
    queryFn: () => adInsightsApi.getPlatformMetrics(platform, params),
    staleTime: 1000 * 60 * 3, // 3 minutes
    enabled: Boolean(platform),
  });
}

/**
 * Mutation hook to trigger manual sync
 */
export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platforms?: ('meta' | 'google')[]) => adInsightsApi.triggerSync(platforms),
    onSuccess: () => {
      // Invalidate and refetch all ad insights data after sync
      queryClient.invalidateQueries({ queryKey: adInsightsKeys.all });
      logger.info('Manual sync triggered successfully');
    },
    onError: (error: any) => {
      logger.error('Failed to trigger sync', error);
    },
  });
}

/**
 * Hook for real-time campaign performance (high frequency updates)
 */
export function useRealTimeCampaigns(enabled = true) {
  return useQuery({
    queryKey: adInsightsKeys.campaigns({ real_time: true }),
    queryFn: () => adInsightsApi.getCampaignInsights({ real_time: true }),
    enabled,
    staleTime: 0,
    refetchInterval: 1000 * 15, // 15 seconds for real-time
    refetchIntervalInBackground: true,
  });
}

/**
 * Hook to get critical alerts only
 */
export function useCriticalAlerts() {
  return useQuery({
    queryKey: adInsightsKeys.alerts({ severity: 'critical' }),
    queryFn: () => adInsightsApi.getAlerts({ severity: 'critical' }),
    staleTime: 1000 * 15, // 15 seconds for critical alerts
    refetchInterval: 1000 * 30, // 30 seconds
  });
}

// Helper function to invalidate all ad insights data
export function invalidateAdInsights() {
  const queryClient = useQueryClient();
  queryClient.invalidateQueries({ queryKey: adInsightsKeys.all });
}

// Export query keys for external use
export { adInsightsKeys };
