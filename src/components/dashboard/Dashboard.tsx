/**
 * Unified Dashboard Component
 * Real-time command center with WebSocket integration
 */

import type React from 'react';
import { memo, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { MetricsDisplay } from './MetricsDisplay';
import { AlertCenter } from './AlertCenter';
import { SentimentGauge } from './SentimentGauge';
import { useDashboardWebSocket } from '../../hooks/useDashboardWebSocket';
import { useDashboardStore } from '../../store/dashboardStore';

// Dashboard header with connection status
const DashboardHeader = memo(() => {
  const { wsStatus, lastUpdateTime } = useDashboardStore();
  const { connect, disconnect } = useDashboardWebSocket({ autoConnect: false });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campaign Command Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time monitoring and crisis management
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Last update time */}
          {lastUpdateTime && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last update: {new Date(lastUpdateTime).toLocaleTimeString()}
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center space-x-2">
            {wsStatus.connected ? (
              <>
                <Wifi className="text-green-500" size={20} />
                <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                <button
                  onClick={disconnect}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Disconnect
                </button>
              </>
            ) : wsStatus.reconnecting ? (
              <>
                <RefreshCw className="text-yellow-500 animate-spin" size={20} />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Reconnecting... ({wsStatus.reconnectAttempts})
                </span>
              </>
            ) : (
              <>
                <WifiOff className="text-red-500" size={20} />
                <span className="text-sm text-red-600 dark:text-red-400">Disconnected</span>
                <button
                  onClick={connect}
                  className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Connect
                </button>
              </>
            )}
          </div>

          {/* Queued messages indicator */}
          {wsStatus.queuedMessages > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {wsStatus.queuedMessages} queued
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

// Performance metrics display
const PerformanceMetrics = memo(() => {
  const { renderTime, updateLatency } = useDashboardStore();

  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono">
      <div>Render: {renderTime}ms</div>
      <div>Latency: {updateLatency}ms</div>
    </div>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';

// Main Dashboard component
export const Dashboard: React.FC = memo(() => {
  // Initialize WebSocket connection
  const { error } = useDashboardWebSocket({
    autoConnect: true,
    reconnectOnMount: true,
    events: {
      // Custom event handlers if needed
      connection_established: () => {
        console.log('Dashboard WebSocket connection established');
      },
      error: (error) => {
        console.error('Dashboard WebSocket error:', error);
      },
    },
  });

  const { setLoading } = useDashboardStore();

  // Track performance
  useEffect(() => {
    const startTime = performance.now();
    setLoading(true);

    // Simulate initial data load
    const timer = setTimeout(() => {
      setLoading(false);
      const loadTime = performance.now() - startTime;
      console.log(`Dashboard initial load time: ${loadTime}ms`);
    }, 100);

    return () => clearTimeout(timer);
  }, [setLoading]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <DashboardHeader />

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 fade-in">
            <p className="text-sm text-red-800 dark:text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Main content grid */}
        <div className="space-y-6">
          {/* Metrics section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Campaign Performance</h2>
            <MetricsDisplay />
          </section>

          {/* Alert and sentiment section */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Crisis Monitoring</h2>
                <AlertCenter />
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Public Sentiment</h2>
                <SentimentGauge />
              </div>
            </div>
          </section>
        </div>

        {/* Performance metrics (dev only) */}
        <PerformanceMetrics />
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

// Export individual components for flexibility
export { MetricsDisplay, AlertCenter, SentimentGauge } from './index';
