/**
 * Enhanced WebSocket hook with robust reconnection logic
 * Handles connection management, authentication, and message handling.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('useWebSocket');

interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  exponentialBackoff?: boolean;
  debug?: boolean;
  protocols?: string[];
  onOpen?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnect?: (attempt: number) => void;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  lastJsonMessage: any;
  reconnectAttempts: number;
  error: string | null;
  connectionState: string;
  sendMessage: (message: any) => boolean;
  sendJsonMessage: (message: object) => boolean;
  connect: () => void;
  disconnect: () => void;
  subscribeToMetrics: (metrics: string[]) => void;
}

export const useWebSocket = (
  url: string | null,
  options: WebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    autoReconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 10,
    exponentialBackoff = true,
    debug = false,
    protocols = [],
    onOpen,
    onMessage,
    onClose,
    onError,
    onReconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [lastJsonMessage, setLastJsonMessage] = useState<any>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Calculate reconnection delay with exponential backoff
  const calculateReconnectDelay = useCallback(
    (attempt: number): number => {
      if (!exponentialBackoff) {
        return reconnectInterval;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
      const delay = Math.min(
        reconnectInterval * Math.pow(2, attempt),
        30000 // Max 30 seconds
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      return delay + jitter;
    },
    [exponentialBackoff, reconnectInterval]
  );

  // Send message to WebSocket
  const sendMessage = useCallback(
    (message: any): boolean => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(data);
        debug && logger.debug('Sent message:', message);
        return true;
      }
      debug && logger.warn('Cannot send message: WebSocket not connected');
      return false;
    },
    [debug]
  );

  // Send JSON message
  const sendJsonMessage = useCallback(
    (message: object): boolean => {
      return sendMessage(JSON.stringify(message));
    },
    [sendMessage]
  );

  // Subscribe to specific metrics
  const subscribeToMetrics = useCallback(
    (metrics: string[]) => {
      sendMessage({
        type: 'subscribe',
        metrics,
      });
    },
    [sendMessage]
  );

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let jsonMessage = null;

      try {
        jsonMessage = JSON.parse(event.data);

        // Handle pong response
        if (jsonMessage.type === 'pong') {
          debug && logger.debug('Received pong');
          return;
        }

        setLastJsonMessage(jsonMessage);
      } catch (e) {
        // Not JSON, that's fine
        debug && logger.debug('Received non-JSON message');
      }

      const message: WebSocketMessage = jsonMessage || {
        type: 'raw',
        data: event.data,
        timestamp: new Date().toISOString(),
      };

      setLastMessage(message);

      // Call custom message handler if provided
      onMessage?.(jsonMessage || event.data);

      // Handle built-in message types
      if (jsonMessage) {
        switch (jsonMessage.type) {
          case 'ping':
            // Respond to heartbeat
            sendMessage({ type: 'pong' });
            break;

          case 'error':
            logger.error('WebSocket server error:', jsonMessage.data);
            setError(jsonMessage.data);
            break;

          case 'metrics_update':
          case 'activity_feed':
          case 'alert_update':
            // These are handled by the custom onMessage handler
            debug && logger.debug(`Received ${jsonMessage.type}:`, jsonMessage.data);
            break;

          default:
            debug && logger.debug('Unknown message type:', jsonMessage.type);
        }
      }
    },
    [debug, onMessage, sendMessage]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!url || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    clearTimeouts();

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    setIsConnecting(true);
    setError(null);

    debug && logger.info(`Connecting to WebSocket: ${url}`);

    try {
      // Add auth token to URL if available
      const wsUrl = url;
      // TODO: Add JWT token as query parameter when auth is implemented
      // const token = localStorage.getItem('accessToken');
      // const wsUrl = token ? `${url}?token=${token}` : url;

      const ws = new WebSocket(wsUrl, protocols);
      wsRef.current = ws;

      ws.onopen = (event) => {
        debug && logger.info('WebSocket connected');

        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        setError(null);

        // Start ping/pong to keep connection alive
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 30000); // Ping every 30 seconds

        onOpen?.(event);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        debug && logger.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onclose = (event) => {
        debug && logger.info(`WebSocket closed: ${event.code} ${event.reason}`);

        clearTimeouts();
        setIsConnected(false);
        setIsConnecting(false);

        onClose?.(event);

        // Attempt reconnection if enabled and not a clean close
        if (
          autoReconnect &&
          event.code !== 1000 && // Normal closure
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const attempt = reconnectAttemptsRef.current + 1;
          const delay = calculateReconnectDelay(attempt);

          debug && logger.info(`Reconnecting in ${delay}ms (attempt ${attempt})`);

          setReconnectAttempts(attempt);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current = attempt;
            onReconnect?.(attempt);
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Maximum reconnection attempts reached');
        }
      };
    } catch (error) {
      logger.error('Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [
    url,
    autoReconnect,
    maxReconnectAttempts,
    handleMessage,
    clearTimeouts,
    calculateReconnectDelay,
    debug,
    protocols,
    onOpen,
    onError,
    onClose,
    onReconnect,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    debug && logger.info('Manually disconnecting WebSocket');

    clearTimeouts();
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  }, [clearTimeouts, maxReconnectAttempts, debug]);

  // Connection state string
  const connectionState = (() => {
    if (isConnecting) {
      return 'Connecting';
    }
    if (isConnected) {
      return 'Connected';
    }
    if (error) {
      return 'Error';
    }
    return 'Disconnected';
  })();

  // Auto-connect when URL is provided
  useEffect(() => {
    if (url) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      clearTimeouts();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, connect, disconnect, clearTimeouts]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    lastJsonMessage,
    reconnectAttempts,
    error,
    connectionState,
    sendMessage,
    sendJsonMessage,
    connect,
    disconnect,
    subscribeToMetrics,
  };
};

/**
 * Specialized WebSocket hook for analytics data
 */
export const useAnalyticsWebSocket = () => {
  const websocketUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/analytics`;

  const { isConnected, lastMessage, lastJsonMessage, sendJsonMessage, subscribeToMetrics } =
    useWebSocket(websocketUrl, {
      autoReconnect: true,
      onOpen: () => {
        console.log('Analytics WebSocket connected');
      },
      onClose: () => {
        console.log('Analytics WebSocket disconnected');
      },
      onError: (error) => {
        console.error('Analytics WebSocket error:', error);
      },
    });

  return {
    isConnected,
    lastMessage,
    lastJsonMessage,
    sendJsonMessage,
    subscribeToMetrics,
  };
};
