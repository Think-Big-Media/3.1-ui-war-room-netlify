/**
 * WebSocket hook for real-time ad monitoring
 * Connects to backend ad monitoring WebSocket endpoint
 * Optimized with useMemo and useCallback for better performance
 */

import { useCallback, useMemo } from 'react';
import { useWebSocket } from './useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { adInsightsKeys } from './useAdInsights';
import { activityKeys } from './useActivities';
import { createLogger } from '../utils/logger';
import { API_BASE_URL } from '@/config/constants';

const logger = createLogger('useAdMonitorWebSocket');

interface AdAlert {
  alert_id: string;
  alert_type: string;
  platform: 'meta' | 'google';
  campaign_id: string;
  campaign_name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  current_value: number;
  threshold_value: number;
  timestamp: string;
}

interface SpendUpdate {
  platform: 'meta' | 'google';
  campaign_id: string;
  campaign_name: string;
  current_spend: number;
  spend_limit: number;
  percentage_used: number;
  timestamp: string;
}

interface AdMonitorMessage {
  type: 'spend_alert' | 'spend_update' | 'campaign_status' | 'connection_status';
  data: AdAlert | SpendUpdate | any;
  timestamp: string;
}

export function useAdMonitorWebSocket() {
  const queryClient = useQueryClient();

  // Get WebSocket URL
  const wsUrl = useMemo(() => {
    const httpBase = API_BASE_URL;
    // If using relative base, derive from current location
    const resolvedHttpBase =
      httpBase ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'http://localhost:8000');
    const wsBaseUrl = resolvedHttpBase.replace(/^https?:/, 'wss:').replace(/^http:/, 'ws:');
    return `${wsBaseUrl}/ws/ad-monitor`;
  }, []);

  // Memoize query keys to prevent recreation on every message
  const queryKeys = useMemo(
    () => ({
      alerts: adInsightsKeys.alerts(),
      activities: activityKeys.all,
      campaigns: adInsightsKeys.campaigns(),
      health: adInsightsKeys.health(),
    }),
    []
  );

  const handleMessage = useCallback(
    (data: AdMonitorMessage) => {
      if (!data?.type) {
        return;
      }

      logger.info(`Received ${data.type}:`, data.data);

      switch (data.type) {
        case 'spend_alert':
          // Invalidate alerts to fetch fresh data
          queryClient.invalidateQueries({ queryKey: queryKeys.alerts });

          // Add to activities
          queryClient.invalidateQueries({ queryKey: queryKeys.activities });
          break;

        case 'spend_update':
          // Update campaign insights cache
          queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
          break;

        case 'campaign_status':
          // Update health status
          queryClient.invalidateQueries({ queryKey: queryKeys.health });
          break;

        case 'connection_status':
          logger.info('Ad monitor connection status:', data.data);
          break;

        default:
          logger.warn('Unknown message type:', data.type);
      }
    },
    [queryClient, queryKeys]
  );

  const handleError = useCallback((event: Event) => {
    logger.error('Ad monitor WebSocket error:', event);
  }, []);

  const handleReconnect = useCallback((attempt: number) => {
    logger.info(`Ad monitor WebSocket reconnecting (attempt ${attempt})`);
  }, []);

  // Memoize WebSocket options to prevent unnecessary reconnections
  const wsOptions = useMemo(
    () => ({
      onMessage: handleMessage,
      onError: handleError,
      onReconnect: handleReconnect,
      autoReconnect: true,
      exponentialBackoff: true,
      debug: true,
    }),
    [handleMessage, handleError, handleReconnect]
  );

  const ws = useWebSocket(wsUrl, wsOptions);

  // Specialized methods for ad monitoring
  const dismissAlert = useCallback(
    (alertId: string) => {
      return ws.sendJsonMessage({
        type: 'dismiss_alert',
        alert_id: alertId,
      });
    },
    [ws]
  );

  const requestSpendUpdate = useCallback(
    (platform?: 'meta' | 'google') => {
      return ws.sendJsonMessage({
        type: 'request_spend_update',
        platform,
      });
    },
    [ws]
  );

  const subscribeToAlerts = useCallback(
    (platforms: ('meta' | 'google')[] = ['meta', 'google']) => {
      return ws.sendJsonMessage({
        type: 'subscribe_alerts',
        platforms,
      });
    },
    [ws]
  );

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      ...ws,
      dismissAlert,
      requestSpendUpdate,
      subscribeToAlerts,
    }),
    [ws, dismissAlert, requestSpendUpdate, subscribeToAlerts]
  );
}
