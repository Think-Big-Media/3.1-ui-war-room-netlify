/**
 * AlertCenter Component
 * Real-time crisis notifications from monitoring pipeline
 * Handles acknowledgment and prioritization
 */

import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  BellOff,
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAdAlerts, useCriticalAlerts } from '../../hooks/useAdInsights';
import type { RealTimeAlert } from '../../services/adInsightsApi';

// Alert severity configurations
const severityConfig = {
  critical: {
    color: 'bg-red-500',
    lightColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    icon: AlertTriangle,
    sound: 'critical-alert.mp3',
  },
  high: {
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-800 dark:text-orange-200',
    icon: AlertCircle,
    sound: 'high-alert.mp3',
  },
  medium: {
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    icon: Info,
    sound: null,
  },
  low: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    icon: Info,
    sound: null,
  },
};

// Individual alert component
const AlertItem = memo<{
  alert: RealTimeAlert;
  onAcknowledge: (id: string) => void;
}>(({ alert, onAcknowledge }) => {
  const config =
    severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <div
      className={`
          relative overflow-hidden rounded-lg border p-4
          ${config.lightColor} ${config.borderColor}
          transition-all duration-200 scale-in
        `}
    >
      {/* Priority indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`} />

      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${config.color} bg-opacity-20`}>
            <Icon size={20} className={config.textColor} />
          </div>

          <div className="flex-1">
            <h4 className={`font-semibold ${config.textColor}`}>
              {alert.campaign_name
                ? `${alert.campaign_name}: ${alert.alert_type.replace('_', ' ')}`
                : alert.message}
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>

            {/* Alert metadata */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-medium">Platform:</span>
                <span className="uppercase font-mono">{alert.platform}</span>
              </div>

              {alert.current_value && (
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} />
                  <span>
                    Current:{' '}
                    {typeof alert.current_value === 'number'
                      ? alert.current_value.toFixed(2)
                      : alert.current_value}
                  </span>
                </div>
              )}

              {alert.threshold_value && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Threshold:</span>
                  <span>{alert.threshold_value.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* TODO: Add acknowledged state management */}
          {true && (
            <button
              onClick={() => onAcknowledge(alert.campaign_id)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Acknowledge alert"
            >
              <CheckCircle size={18} className="text-green-600" />
            </button>
          )}

          <button
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Dismiss"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
});

AlertItem.displayName = 'AlertItem';

// Main AlertCenter component
export const AlertCenter: React.FC = memo(() => {
  // Live alert data from API
  const { data: allAlerts, isLoading, error } = useAdAlerts();
  const { data: criticalAlerts } = useCriticalAlerts();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');

  const alerts = (allAlerts as RealTimeAlert[]) || [];
  const criticalAlertsCount = (criticalAlerts as RealTimeAlert[])?.length || 0;

  // Handle alert acknowledgment (for now, just a placeholder)
  const handleAcknowledge = useCallback((alertId: string) => {
    console.log('Acknowledge alert:', alertId);
    // TODO: Implement alert acknowledgment API
  }, []);

  // Play sound for critical alerts
  useEffect(() => {
    if (notificationsEnabled && criticalAlertsCount > 0) {
      // Play sound (implementation would depend on audio setup)
      const audio = new Audio('/sounds/critical-alert.mp3');
      audio.play().catch((err) => console.error('Failed to play alert sound:', err));
    }
  }, [criticalAlertsCount, notificationsEnabled]);

  // Filter alerts based on selected filter
  const filteredAlerts = alerts.filter((alert: RealTimeAlert) => {
    switch (filter) {
      case 'critical':
        return alert.severity === 'critical';
      case 'high':
        return alert.severity === 'high';
      default:
        return true;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">Alert Center</h2>
            {criticalAlertsCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full scale-in">
                {criticalAlertsCount} critical
              </span>
            )}
            {error && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-full">
                Offline
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter buttons */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['all', 'critical', 'high'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-1 text-sm rounded transition-colors
                    ${
                      filter === f
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Notification toggle */}
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  notificationsEnabled
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }
              `}
              title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
            >
              {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Alert list */}
      <div className="max-h-96 overflow-y-auto scroll-fade-subtle">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 fade-in">
            <Bell size={48} className="mx-auto mb-3 opacity-20" />
            <p>No {filter !== 'all' ? filter : ''} alerts</p>
            <p className="text-sm mt-1">All systems operational</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
            ))}
          </div>
        )}
      </div>

      {/* Alert statistics */}
      {alerts.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center">
            {Object.entries(severityConfig).map(([severity, config]) => {
              const count = alerts.filter((a: RealTimeAlert) => a.severity === severity).length;
              return (
                <div key={severity} className="text-sm">
                  <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                  <div className="text-gray-500 dark:text-gray-400 uppercase font-mono">
                    {severity}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

AlertCenter.displayName = 'AlertCenter';

// Utility function
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}
