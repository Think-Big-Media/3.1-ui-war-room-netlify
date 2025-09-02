/**
 * Zustand store for real-time dashboard state management
 * Handles Meta/Google metrics, alerts, and sentiment data
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface AdMetrics {
  platform: 'meta' | 'google';
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  lastUpdated: Date;
}

export interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  avgRoas: number;
  spendByPlatform: Record<string, number>;
  performanceByHour: Array<{
    hour: string;
    meta: AdMetrics;
    google: AdMetrics;
  }>;
}

export interface CrisisAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  affectedKeywords: string[];
  estimatedReach: number;
  timestamp: Date;
  acknowledged: boolean;
  source: 'mentionlytics' | 'unified';
}

export interface SentimentData {
  overall: number; // -100 to 100
  mentionlyticsScore: number;
  weightedScore: number;
  trend: 'improving' | 'stable' | 'declining';
  volume: number;
  lastHour: Array<{
    timestamp: Date;
    score: number;
    volume: number;
  }>;
}

export interface WebSocketStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected: Date | null;
  reconnectAttempts: number;
  queuedMessages: number;
}

export interface DashboardState {
  // Real-time metrics
  metaMetrics: AdMetrics | null;
  googleMetrics: AdMetrics | null;
  aggregatedMetrics: AggregatedMetrics | null;

  // Crisis alerts
  alerts: CrisisAlert[];
  unacknowledgedCount: number;

  // Sentiment monitoring
  sentiment: SentimentData | null;
  sentimentHistory: Array<{
    timestamp: Date;
    score: number;
  }>;

  // WebSocket connection
  wsStatus: WebSocketStatus;

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdateTime: Date | null;

  // Performance metrics
  renderTime: number;
  updateLatency: number;

  // Actions
  updateMetaMetrics: (metrics: Partial<AdMetrics>) => void;
  updateGoogleMetrics: (metrics: Partial<AdMetrics>) => void;
  calculateAggregatedMetrics: () => void;
  addAlert: (alert: CrisisAlert) => void;
  acknowledgeAlert: (alertId: string) => void;
  updateSentiment: (data: Partial<SentimentData>) => void;
  setWebSocketStatus: (status: Partial<WebSocketStatus>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  recordPerformance: (renderTime: number, updateLatency: number) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  metaMetrics: null,
  googleMetrics: null,
  aggregatedMetrics: null,
  alerts: [],
  unacknowledgedCount: 0,
  sentiment: null,
  sentimentHistory: [],
  wsStatus: {
    connected: false,
    reconnecting: false,
    lastConnected: null,
    reconnectAttempts: 0,
    queuedMessages: 0,
  },
  isLoading: false,
  error: null,
  lastUpdateTime: null,
  renderTime: 0,
  updateLatency: 0,
};

// Create store with middleware
export const useDashboardStore = create<DashboardState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        updateMetaMetrics: (metrics) => {
          const startTime = Date.now();
          set((state) => {
            if (!state.metaMetrics) {
              state.metaMetrics = {
                platform: 'meta',
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                ctr: 0,
                cpc: 0,
                roas: 0,
                lastUpdated: new Date(),
              };
            }
            Object.assign(state.metaMetrics, metrics, {
              lastUpdated: new Date(),
            });
            state.lastUpdateTime = new Date();
          });
          get().calculateAggregatedMetrics();
          get().recordPerformance(0, Date.now() - startTime);
        },

        updateGoogleMetrics: (metrics) => {
          const startTime = Date.now();
          set((state) => {
            if (!state.googleMetrics) {
              state.googleMetrics = {
                platform: 'google',
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                ctr: 0,
                cpc: 0,
                roas: 0,
                lastUpdated: new Date(),
              };
            }
            Object.assign(state.googleMetrics, metrics, {
              lastUpdated: new Date(),
            });
            state.lastUpdateTime = new Date();
          });
          get().calculateAggregatedMetrics();
          get().recordPerformance(0, Date.now() - startTime);
        },

        calculateAggregatedMetrics: () => {
          set((state) => {
            const meta = state.metaMetrics;
            const google = state.googleMetrics;

            if (!meta && !google) {
              state.aggregatedMetrics = null;
              return;
            }

            state.aggregatedMetrics = {
              totalSpend: (meta?.spend || 0) + (google?.spend || 0),
              totalImpressions: (meta?.impressions || 0) + (google?.impressions || 0),
              totalClicks: (meta?.clicks || 0) + (google?.clicks || 0),
              totalConversions: (meta?.conversions || 0) + (google?.conversions || 0),
              avgCtr: calculateWeightedAverage(
                meta?.ctr || 0,
                meta?.impressions || 0,
                google?.ctr || 0,
                google?.impressions || 0
              ),
              avgCpc: calculateWeightedAverage(
                meta?.cpc || 0,
                meta?.clicks || 0,
                google?.cpc || 0,
                google?.clicks || 0
              ),
              avgRoas: calculateWeightedAverage(
                meta?.roas || 0,
                meta?.spend || 0,
                google?.roas || 0,
                google?.spend || 0
              ),
              spendByPlatform: {
                meta: meta?.spend || 0,
                google: google?.spend || 0,
              },
              performanceByHour: [], // This would be populated by historical data
            };
          });
        },

        addAlert: (alert) => {
          set((state) => {
            // Prevent duplicates
            if (state.alerts.some((a) => a.id === alert.id)) {
              return;
            }

            state.alerts.unshift(alert);

            // Keep only last 100 alerts
            if (state.alerts.length > 100) {
              state.alerts = state.alerts.slice(0, 100);
            }

            // Update unacknowledged count
            state.unacknowledgedCount = state.alerts.filter((a) => !a.acknowledged).length;
          });
        },

        acknowledgeAlert: (alertId) => {
          set((state) => {
            const alert = state.alerts.find((a) => a.id === alertId);
            if (alert) {
              alert.acknowledged = true;
              state.unacknowledgedCount = state.alerts.filter((a) => !a.acknowledged).length;
            }
          });
        },

        updateSentiment: (data) => {
          set((state) => {
            if (!state.sentiment) {
              state.sentiment = {
                overall: 0,
                mentionlyticsScore: 0,
                weightedScore: 0,
                trend: 'stable',
                volume: 0,
                lastHour: [],
              };
            }

            Object.assign(state.sentiment, data);

            // Use mentionlytics score as the primary score
            if (data.mentionlyticsScore !== undefined) {
              state.sentiment.weightedScore = state.sentiment.mentionlyticsScore;
              state.sentiment.overall = state.sentiment.weightedScore;
            }

            // Add to history
            state.sentimentHistory.push({
              timestamp: new Date(),
              score: state.sentiment.overall,
            });

            // Keep only last 24 hours of history
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            state.sentimentHistory = state.sentimentHistory.filter((h) => h.timestamp > oneDayAgo);

            // Determine trend
            if (state.sentimentHistory.length >= 2) {
              const recent = state.sentimentHistory.slice(-10);
              const older = state.sentimentHistory.slice(-20, -10);
              const recentAvg = average(recent.map((h) => h.score));
              const olderAvg = average(older.map((h) => h.score));

              if (recentAvg > olderAvg + 5) {
                state.sentiment.trend = 'improving';
              } else if (recentAvg < olderAvg - 5) {
                state.sentiment.trend = 'declining';
              } else {
                state.sentiment.trend = 'stable';
              }
            }
          });
        },

        setWebSocketStatus: (status) => {
          set((state) => {
            Object.assign(state.wsStatus, status);
          });
        },

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        recordPerformance: (renderTime, updateLatency) => {
          set((state) => {
            state.renderTime = renderTime;
            state.updateLatency = updateLatency;
          });
        },

        reset: () => {
          set(() => initialState);
        },
      }))
    ),
    {
      name: 'dashboard-store',
    }
  )
);

// Helper functions
function calculateWeightedAverage(
  value1: number,
  weight1: number,
  value2: number,
  weight2: number
): number {
  const totalWeight = weight1 + weight2;
  if (totalWeight === 0) {
    return 0;
  }
  return (value1 * weight1 + value2 * weight2) / totalWeight;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

// Selectors
export const selectTotalSpend = (state: DashboardState) => state.aggregatedMetrics?.totalSpend || 0;

export const selectCriticalAlerts = (state: DashboardState) =>
  state.alerts.filter((a) => a.severity === 'critical' && !a.acknowledged);

export const selectSentimentTrend = (state: DashboardState) => state.sentiment?.trend || 'stable';

export const selectConnectionStatus = (state: DashboardState) => state.wsStatus.connected;

// Subscriptions for performance monitoring
useDashboardStore.subscribe(
  (state) => state.renderTime,
  (renderTime) => {
    if (renderTime > 100) {
      console.warn(`Dashboard render time exceeded 100ms: ${renderTime}ms`);
    }
  }
);

useDashboardStore.subscribe(
  (state) => state.updateLatency,
  (latency) => {
    if (latency > 2000) {
      console.warn(`Update latency exceeded 2s: ${latency}ms`);
    }
  }
);
