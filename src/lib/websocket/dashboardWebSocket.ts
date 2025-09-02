/**
 * WebSocket integration for real-time dashboard updates
 * Handles reconnection logic and message queuing
 */

import io from 'socket.io-client';
import { useDashboardStore } from '../../store/dashboardStore';
import type { AdMetrics, CrisisAlert, SentimentData } from '../../store/dashboardStore';

// WebSocket configuration
const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  timeout: 20000,
  autoConnect: true,
  transports: ['websocket', 'polling'],
};

// Message types
type WSMessageType =
  | 'meta_metrics_update'
  | 'google_metrics_update'
  | 'crisis_alert'
  | 'sentiment_update'
  | 'connection_status'
  | 'error';

interface WSMessage<T = any> {
  type: WSMessageType;
  data: T;
  timestamp: Date;
  correlationId?: string;
}

// Queue for messages during disconnection
class MessageQueue {
  private queue: WSMessage[] = [];
  private maxSize = 100;

  enqueue(message: WSMessage): void {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // Remove oldest
    }
    this.queue.push(message);
  }

  dequeueAll(): WSMessage[] {
    const messages = [...this.queue];
    this.queue = [];
    return messages;
  }

  size(): number {
    return this.queue.length;
  }
}

export class DashboardWebSocket {
  private socket: ReturnType<typeof io> | null = null;
  private messageQueue = new MessageQueue();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;
  private subscriptions = new Map<string, Set<(data: any) => void>>();

  constructor() {
    this.setupSocket();
  }

  private setupSocket(): void {
    this.socket = io(WS_CONFIG.url, {
      reconnectionDelay: WS_CONFIG.reconnectionDelay,
      reconnectionDelayMax: WS_CONFIG.reconnectionDelayMax,
      reconnectionAttempts: WS_CONFIG.reconnectionAttempts,
      timeout: WS_CONFIG.timeout,
      autoConnect: WS_CONFIG.autoConnect,
      transports: WS_CONFIG.transports,
    });

    this.setupEventHandlers();
    this.startPingInterval();
  }

  private setupEventHandlers(): void {
    if (!this.socket) {
      return;
    }

    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on('reconnect', this.handleReconnect.bind(this));
    this.socket.on('reconnect_attempt', this.handleReconnectAttempt.bind(this));

    // Message events
    this.socket.on('meta_metrics', this.handleMetaMetrics.bind(this));
    this.socket.on('google_metrics', this.handleGoogleMetrics.bind(this));
    this.socket.on('crisis_alert', this.handleCrisisAlert.bind(this));
    this.socket.on('sentiment_update', this.handleSentimentUpdate.bind(this));
    this.socket.on('error', this.handleError.bind(this));
  }

  private handleConnect(): void {
    console.log('WebSocket connected');

    const store = useDashboardStore.getState();
    store.setWebSocketStatus({
      connected: true,
      reconnecting: false,
      lastConnected: new Date(),
      reconnectAttempts: 0,
    });

    // Process queued messages
    this.processQueuedMessages();

    // Subscribe to monitoring channels
    this.subscribeToChannels();
  }

  private handleDisconnect(reason: string): void {
    console.log('WebSocket disconnected:', reason);

    const store = useDashboardStore.getState();
    store.setWebSocketStatus({
      connected: false,
      reconnecting: !this.isIntentionalDisconnect,
    });

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleConnectError(error: Error): void {
    console.error('WebSocket connection error:', error);

    const store = useDashboardStore.getState();
    store.setError(`Connection error: ${error.message}`);
  }

  private handleReconnect(attemptNumber: number): void {
    console.log('WebSocket reconnected after', attemptNumber, 'attempts');

    const store = useDashboardStore.getState();
    store.setWebSocketStatus({
      connected: true,
      reconnecting: false,
      lastConnected: new Date(),
      reconnectAttempts: 0,
    });
  }

  private handleReconnectAttempt(attemptNumber: number): void {
    const store = useDashboardStore.getState();
    store.setWebSocketStatus({
      reconnecting: true,
      reconnectAttempts: attemptNumber,
    });
  }

  // Message handlers
  private handleMetaMetrics(data: AdMetrics): void {
    const store = useDashboardStore.getState();
    store.updateMetaMetrics(data);

    // Notify subscribers
    this.notifySubscribers('meta_metrics', data);
  }

  private handleGoogleMetrics(data: AdMetrics): void {
    const store = useDashboardStore.getState();
    store.updateGoogleMetrics(data);

    // Notify subscribers
    this.notifySubscribers('google_metrics', data);
  }

  private handleCrisisAlert(data: CrisisAlert): void {
    const store = useDashboardStore.getState();
    store.addAlert(data);

    // Notify subscribers
    this.notifySubscribers('crisis_alert', data);
  }

  private handleSentimentUpdate(data: SentimentData): void {
    const store = useDashboardStore.getState();
    store.updateSentiment(data);

    // Notify subscribers
    this.notifySubscribers('sentiment_update', data);
  }

  private handleError(error: any): void {
    console.error('WebSocket error:', error);

    const store = useDashboardStore.getState();
    store.setError(error.message || 'WebSocket error occurred');
  }

  // Queue management
  private queueMessage(message: WSMessage): void {
    this.messageQueue.enqueue(message);

    const store = useDashboardStore.getState();
    store.setWebSocketStatus({
      queuedMessages: this.messageQueue.size(),
    });
  }

  private processQueuedMessages(): void {
    const messages = this.messageQueue.dequeueAll();

    messages.forEach((message) => {
      this.sendMessage(message.type, message.data);
    });

    const store = useDashboardStore.getState();
    store.setWebSocketStatus({
      queuedMessages: 0,
    });
  }

  // Subscription management
  private subscribeToChannels(): void {
    if (!this.socket) {
      return;
    }

    // Subscribe to monitoring channels
    this.socket.emit('subscribe', {
      channels: [
        'meta_ads_metrics',
        'google_ads_metrics',
        'crisis_monitoring',
        'sentiment_analysis',
      ],
    });
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }

    this.subscriptions.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(event);
        }
      }
    };
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  // Connection management
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  sendMessage(type: WSMessageType, data: any): void {
    const message: WSMessage = {
      type,
      data,
      timestamp: new Date(),
      correlationId: crypto.randomUUID(),
    };

    if (this.socket?.connected) {
      this.socket.emit(type, message);
    } else {
      // Queue message for later delivery
      this.queueMessage(message);
    }
  }

  connect(): void {
    this.isIntentionalDisconnect = false;
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true;
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }

  destroy(): void {
    this.disconnect();

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.socket?.removeAllListeners();
    this.socket = null;
    this.subscriptions.clear();
  }
}

// Singleton instance
let dashboardWebSocket: DashboardWebSocket | null = null;

export function getDashboardWebSocket(): DashboardWebSocket {
  if (!dashboardWebSocket) {
    dashboardWebSocket = new DashboardWebSocket();
  }
  return dashboardWebSocket;
}

export function destroyDashboardWebSocket(): void {
  if (dashboardWebSocket) {
    dashboardWebSocket.destroy();
    dashboardWebSocket = null;
  }
}
