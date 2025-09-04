/**
 * Campaign Health Monitor Component
 * Real-time health metrics with CleanMyMac-inspired visual design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useCampaignHealth, useAdAlerts, useTriggerSync } from '../../hooks/useAdInsights';
import { useAdMonitorWebSocket } from '../../hooks/useAdMonitorWebSocket';
import { ConnectionStatus } from '../common/ConnectionStatus';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Database,
  Mail,
  Users,
  DollarSign,
  Calendar,
  Globe,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HealthMetric {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  value: number;
  unit?: string;
  description?: string;
  icon: React.ComponentType<any>;
  lastChecked: Date;
  trend?: 'up' | 'down' | 'stable';
  details?: {
    label: string;
    value: string | number;
  }[];
}

interface CampaignHealthProps {
  refreshInterval?: number;
  onRefresh?: () => void;
  compact?: boolean;
}

export const CampaignHealth: React.FC<CampaignHealthProps> = ({
  refreshInterval = 30000,
  onRefresh,
  compact = false,
}) => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const prefersReducedMotion = useReducedMotion();

  // Live API data
  const {
    data: healthData,
    isLoading: isHealthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useCampaignHealth();
  const { data: alerts, isLoading: isAlertsLoading } = useAdAlerts({ severity: 'high' });
  const { mutate: triggerSync, isPending: isSyncing } = useTriggerSync();

  // Real-time WebSocket connection
  const wsConnection = useAdMonitorWebSocket();

  const isRefreshing = isHealthLoading || isAlertsLoading || isSyncing;

  // Transform API data to component format
  useEffect(() => {
    if (!healthData && !healthError) {
      return;
    } // Still loading

    const liveMetrics: HealthMetric[] = [];

    // Add Meta Ads health metric
    if ((healthData as any)?.meta_status || healthError) {
      const metaStatus = healthError ? 'offline' : (healthData as any).meta_status;
      liveMetrics.push({
        id: 'meta-ads',
        name: 'Meta Ads',
        status: metaStatus,
        value: (healthData as any)?.performance_score || 0,
        unit: '/100',
        description: 'Meta advertising performance',
        icon: Activity,
        lastChecked: new Date((healthData as any)?.last_updated || Date.now()),
        trend: 'stable',
        details: [
          {
            label: 'Active campaigns',
            value: (healthData as any)?.active_campaigns?.toString() || '0',
          },
          {
            label: 'Daily spend',
            value: `$${(healthData as any)?.total_daily_spend?.toFixed(2) || '0.00'}`,
          },
        ],
      });
    }

    // Add Google Ads health metric
    if ((healthData as any)?.google_status || healthError) {
      const googleStatus = healthError ? 'offline' : (healthData as any).google_status;
      liveMetrics.push({
        id: 'google-ads',
        name: 'Google Ads',
        status: googleStatus,
        value: (healthData as any)?.performance_score || 0,
        unit: '/100',
        description: 'Google advertising performance',
        icon: BarChart3,
        lastChecked: new Date((healthData as any)?.last_updated || Date.now()),
        trend: 'stable',
        details: [
          {
            label: 'Budget usage',
            value: `${((((healthData as any)?.total_daily_spend || 0) / ((healthData as any)?.daily_spend_limit || 1)) * 100).toFixed(1)}%`,
          },
          {
            label: 'Spend limit',
            value: `$${(healthData as any)?.daily_spend_limit?.toFixed(2) || '0.00'}`,
          },
        ],
      });
    }

    // Add alerts-based health metrics
    if (alerts && alerts.length > 0) {
      const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
      const highAlerts = alerts.filter((a) => a.severity === 'high').length;

      liveMetrics.push({
        id: 'active-alerts',
        name: 'Active Alerts',
        status: criticalAlerts > 0 ? 'critical' : highAlerts > 0 ? 'warning' : 'healthy',
        value: alerts.length,
        description: 'Campaign alerts requiring attention',
        icon: Shield,
        lastChecked: new Date(),
        details: [
          { label: 'Critical', value: criticalAlerts.toString() },
          { label: 'High priority', value: highAlerts.toString() },
        ],
      });
    }

    // Add system connectivity metric
    liveMetrics.push({
      id: 'api-connectivity',
      name: 'API Connectivity',
      status: healthError ? 'critical' : isHealthLoading ? 'warning' : 'healthy',
      value: healthError ? 0 : 100,
      unit: '%',
      description: 'API connection status',
      icon: Wifi,
      lastChecked: new Date(),
      details: [
        { label: 'Last sync', value: healthData ? 'Just now' : 'Error' },
        { label: 'Status', value: healthError ? 'Disconnected' : 'Connected' },
      ],
    });

    // Fallback metrics if no API data available
    if (liveMetrics.length === 0 || healthError) {
      liveMetrics.push({
        id: 'system-status',
        name: 'System Status',
        status: 'warning',
        value: 0,
        description: 'Connecting to monitoring systems...',
        icon: RefreshCw,
        lastChecked: new Date(),
        details: [
          { label: 'Status', value: 'Initializing' },
          { label: 'Retry', value: 'In progress' },
        ],
      });
    }

    setMetrics(liveMetrics);
    setLastRefresh(new Date());
  }, [healthData, healthError, alerts, isHealthLoading]);

  // Calculate overall health from live data
  const overallHealth = React.useMemo(() => {
    if (healthError) {
      return 'critical';
    }
    if (healthData?.overall_health) {
      return healthData.overall_health;
    }

    const criticalCount = metrics.filter((m) => m.status === 'critical').length;
    const warningCount = metrics.filter((m) => m.status === 'warning').length;

    if (criticalCount > 0) {
      return 'critical';
    } else if (warningCount > 0) {
      return 'warning';
    }
    return 'healthy';
  }, [healthError, healthData?.overall_health, metrics]);

  const handleRefresh = useCallback(async () => {
    try {
      // Trigger fresh data fetch from APIs
      await refetchHealth();
      // Trigger sync if needed
      if (!healthData) {
        triggerSync(['meta', 'google']);
      }
      setLastRefresh(new Date());
      onRefresh?.();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [refetchHealth, triggerSync, healthData, onRefresh]);

  // Auto-refresh with proper dependencies
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, handleRefresh]);

  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'offline':
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'critical':
      case 'offline':
        return XCircle;
    }
  };

  const getOverallHealthColor = () => {
    switch (overallHealth) {
      case 'healthy':
        return 'from-green-500 to-emerald-600';
      case 'warning':
        return 'from-yellow-500 to-orange-600';
      case 'critical':
        return 'from-red-500 to-red-600';
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">System Health</h3>
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              overallHealth === 'healthy'
                ? 'bg-green-500'
                : overallHealth === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            )}
          />
        </div>
        <div className="space-y-2">
          {metrics.slice(0, 4).map((metric) => {
            const StatusIcon = getStatusIcon(metric.status);
            return (
              <div key={metric.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{metric.name}</span>
                <StatusIcon
                  className={cn(
                    'w-4 h-4',
                    metric.status === 'healthy'
                      ? 'text-green-500'
                      : metric.status === 'warning'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center',
                getOverallHealthColor()
              )}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Campaign Health</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-500">
                  Last updated {lastRefresh.toLocaleTimeString()}
                </p>
                <ConnectionStatus
                  isConnected={wsConnection.isConnected}
                  isConnecting={wsConnection.isConnecting}
                  error={wsConnection.error}
                  reconnectAttempts={wsConnection.reconnectAttempts}
                  maxReconnectAttempts={10}
                  onReconnect={wsConnection.connect}
                  compact={true}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 rounded-lg transition-all',
              isRefreshing ? 'bg-gray-100' : 'hover:bg-gray-100'
            )}
            title="Refresh campaign data"
          >
            <RefreshCw className={cn('w-5 h-5 text-gray-500', isRefreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Overall Status Bar */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                'h-full bg-gradient-to-r transition-all duration-500',
                getOverallHealthColor()
              )}
              style={{
                width: `${(metrics.filter((m) => m.status === 'healthy').length / metrics.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {metrics.filter((m) => m.status === 'healthy').length}/{metrics.length} Healthy
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const StatusIcon = getStatusIcon(metric.status);
          const colorClass = getStatusColor(metric.status);

          return (
            <div
              key={metric.id}
              className={cn(
                'p-4 rounded-xl border transition-all hover:shadow-md',
                metric.status === 'critical'
                  ? 'border-red-200 bg-red-50/30'
                  : metric.status === 'warning'
                    ? 'border-yellow-200 bg-yellow-50/30'
                    : 'border-gray-100 bg-white'
              )}
            >
              {/* Metric Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg', colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{metric.name}</h4>
                    {metric.description && (
                      <p className="text-xs text-gray-500">{metric.description}</p>
                    )}
                  </div>
                </div>
                <StatusIcon
                  className={cn(
                    'w-5 h-5',
                    metric.status === 'healthy'
                      ? 'text-green-500'
                      : metric.status === 'warning'
                        ? 'text-yellow-500'
                        : metric.status === 'critical'
                          ? 'text-red-500'
                          : 'text-gray-500'
                  )}
                />
              </div>

              {/* Metric Value */}
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value.toLocaleString()}
                </span>
                {metric.unit && <span className="text-sm text-gray-500">{metric.unit}</span>}
                {metric.trend && (
                  <div className="flex items-center">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Details */}
              {metric.details && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  {metric.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{detail.label}</span>
                      <span className="font-medium text-gray-700">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
