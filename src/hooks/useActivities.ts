/**
 * React Query hooks for Activity data
 * Provides real-time activity feed from campaign insights
 */

import { useQuery } from '@tanstack/react-query';
import { activityApi, type ActivityEvent, type ActivityResponse } from '../services/activityApi';
import { createLogger } from '../utils/logger';

const logger = createLogger('useActivities');

// Query key factory
const activityKeys = {
  all: ['activities'] as const,
  recent: (params?: any) => [...activityKeys.all, 'recent', params] as const,
};

/**
 * Hook to get recent activities
 */
export function useRecentActivities(
  params: {
    limit?: number;
    hours?: number;
    types?: string[];
    severity?: string;
    autoRefresh?: boolean;
  } = {}
) {
  const { autoRefresh = true, ...apiParams } = params;

  return useQuery({
    queryKey: activityKeys.recent(apiParams),
    queryFn: () => activityApi.getRecentActivities(apiParams),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: autoRefresh ? 1000 * 60 : false, // 1 minute if auto-refresh enabled
    retry: (failureCount: number, error: any) => {
      // Don't retry on auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook for critical activities only
 */
export function useCriticalActivities() {
  return useQuery({
    queryKey: activityKeys.recent({ severity: 'critical' }),
    queryFn: () =>
      activityApi.getRecentActivities({
        severity: 'critical',
        limit: 10,
      }),
    staleTime: 1000 * 15, // 15 seconds for critical
    refetchInterval: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook for campaign-related activities only
 */
export function useCampaignActivities(limit = 15) {
  return useQuery({
    queryKey: activityKeys.recent({
      types: ['campaign_update', 'spend_alert', 'performance_change'],
      limit,
    }),
    queryFn: () =>
      activityApi.getRecentActivities({
        types: ['campaign_update', 'spend_alert', 'performance_change'],
        limit,
      }),
    staleTime: 1000 * 45, // 45 seconds
    refetchInterval: 1000 * 90, // 90 seconds
  });
}

// Export query keys for external use
export { activityKeys };
