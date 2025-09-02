/**
 * React hook for Dashboard WebSocket integration
 * Provides automatic connection management and cleanup
 * Optimized with useMemo and useCallback for better performance
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getDashboardWebSocket,
  destroyDashboardWebSocket,
} from '../lib/websocket/dashboardWebSocket';
import { useDashboardStore } from '../store/dashboardStore';

interface UseDashboardWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
  events?: {
    [key: string]: (data: any) => void;
  };
}

export function useDashboardWebSocket(options: UseDashboardWebSocketOptions = {}) {
  // Memoize options to prevent unnecessary effect re-runs
  const memoizedOptions = useMemo(
    () => ({
      autoConnect: options.autoConnect ?? true,
      reconnectOnMount: options.reconnectOnMount ?? true,
      events: options.events ?? {},
    }),
    [options.autoConnect, options.reconnectOnMount, options.events]
  );

  const { autoConnect, reconnectOnMount, events } = memoizedOptions;

  const wsRef = useRef(getDashboardWebSocket());
  const unsubscribeRef = useRef<(() => void)[]>([]);

  const { wsStatus, error } = useDashboardStore();

  // Memoize event entries to prevent unnecessary subscriptions
  const eventEntries = useMemo(() => Object.entries(events), [events]);

  // Subscribe to events
  useEffect(() => {
    const ws = wsRef.current;

    // Subscribe to provided events
    eventEntries.forEach(([event, handler]) => {
      const unsubscribe = ws.subscribe(event, handler);
      unsubscribeRef.current.push(unsubscribe);
    });

    return () => {
      // Unsubscribe from all events
      unsubscribeRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRef.current = [];
    };
  }, [eventEntries]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && reconnectOnMount) {
      wsRef.current.connect();
    }

    return () => {
      // Don't destroy singleton on unmount
      // Just ensure cleanup of subscriptions
    };
  }, [autoConnect, reconnectOnMount]);

  // Connection management functions
  const connect = useCallback(() => {
    wsRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current.disconnect();
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    wsRef.current.sendMessage(type as any, data);
  }, []);

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    return wsRef.current.subscribe(event, handler);
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Connection status
      connected: wsStatus.connected,
      reconnecting: wsStatus.reconnecting,
      lastConnected: wsStatus.lastConnected,
      reconnectAttempts: wsStatus.reconnectAttempts,
      queuedMessages: wsStatus.queuedMessages,
      error,

      // Connection methods
      connect,
      disconnect,
      sendMessage,
      subscribe,

      // WebSocket instance (for advanced usage)
      ws: wsRef.current,
    }),
    [
      wsStatus.connected,
      wsStatus.reconnecting,
      wsStatus.lastConnected,
      wsStatus.reconnectAttempts,
      wsStatus.queuedMessages,
      error,
      connect,
      disconnect,
      sendMessage,
      subscribe,
    ]
  );
}

// Hook for global WebSocket management
export function useWebSocketManager() {
  const connect = useCallback(() => {
    const ws = getDashboardWebSocket();
    ws.connect();
  }, []);

  const disconnect = useCallback(() => {
    const ws = getDashboardWebSocket();
    ws.disconnect();
  }, []);

  const destroy = useCallback(() => {
    destroyDashboardWebSocket();
  }, []);

  // Memoize return object
  return useMemo(
    () => ({
      connect,
      disconnect,
      destroy,
    }),
    [connect, disconnect, destroy]
  );
}

// Hook for subscribing to specific events
export function useWebSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  const wsRef = useRef(getDashboardWebSocket());

  useEffect(() => {
    const unsubscribe = wsRef.current.subscribe(event, handler);
    return unsubscribe;
  }, [event, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Specialized hooks for specific data types
export function useMetricsUpdates() {
  const { metaMetrics, googleMetrics, aggregatedMetrics } = useDashboardStore();

  // Memoize handlers to prevent unnecessary effect re-runs
  const metaMetricsHandler = useCallback((data: any) => {
    console.log('Meta metrics update:', data);
  }, []);

  const googleMetricsHandler = useCallback((data: any) => {
    console.log('Google metrics update:', data);
  }, []);

  useWebSocketEvent('meta_metrics', metaMetricsHandler);
  useWebSocketEvent('google_metrics', googleMetricsHandler);

  // Memoize return object
  return useMemo(
    () => ({
      metaMetrics,
      googleMetrics,
      aggregatedMetrics,
    }),
    [metaMetrics, googleMetrics, aggregatedMetrics]
  );
}

export function useCrisisAlerts() {
  const { alerts, unacknowledgedCount, acknowledgeAlert } = useDashboardStore();

  // Memoize crisis alert handler to prevent unnecessary re-subscriptions
  const crisisAlertHandler = useCallback((alert: any) => {
    console.log('New crisis alert:', alert);

    // Play sound for critical alerts
    if (alert.severity === 'critical') {
      try {
        const audio = new Audio('/sounds/critical-alert.mp3');
        audio.play().catch(console.error);
      } catch (error) {
        console.error('Failed to play alert sound:', error);
      }
    }
  }, []);

  useWebSocketEvent('crisis_alert', crisisAlertHandler);

  // Memoize return object
  return useMemo(
    () => ({
      alerts,
      unacknowledgedCount,
      acknowledgeAlert,
    }),
    [alerts, unacknowledgedCount, acknowledgeAlert]
  );
}

export function useSentimentData() {
  const { sentiment, sentimentHistory } = useDashboardStore();

  // Memoize sentiment handler
  const sentimentHandler = useCallback((data: any) => {
    console.log('Sentiment update:', data);
  }, []);

  useWebSocketEvent('sentiment_update', sentimentHandler);

  // Memoize return object
  return useMemo(
    () => ({
      sentiment,
      sentimentHistory,
    }),
    [sentiment, sentimentHistory]
  );
}
