/**
 * Platform Admin Dashboard
 * Main dashboard for War Room platform administrators.
 */
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Activity,
  AlertCircle,
  TrendingUp,
  Database,
  Cpu,
  Shield,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { analytics } from '../../services/posthog';
import { platformAdminApi } from '../../api/platformAdmin';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
}

export const PlatformAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    // Track page view
    analytics.trackPageView('platform_admin_dashboard');

    // Load metrics
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch platform metrics
      const [metricsData, healthData] = await Promise.all([
        platformAdminApi.endpoints.getPlatformMetrics.initiate(),
        platformAdminApi.endpoints.getSystemHealth.initiate(),
      ]);

      setMetrics(metricsData);
      setHealthStatus(healthData);

      // Track successful load
      analytics.track('platform_metrics_loaded', {
        org_count: (metricsData as any).data?.totalOrganizations || 0,
        user_count: (metricsData as any).data?.totalUsers || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      analytics.trackError('platform_dashboard_error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Total Organizations',
      value: metrics?.organizations?.total || 0,
      change: metrics?.organizations?.new || 0,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: metrics?.users?.active || 0,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'API Calls Today',
      value: formatNumber(metrics?.usage?.total_api_calls || 0),
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      title: 'AI Tokens Used',
      value: formatNumber(metrics?.usage?.total_ai_tokens || 0),
      icon: Cpu,
      color: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor and manage the War Room platform</p>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield
              className={`h-6 w-6 ${
                healthStatus?.status === 'operational' ? 'text-green-500' : 'text-yellow-500'
              }`}
            />
            <div>
              <h3 className="font-semibold">System Status</h3>
              <p className="text-sm text-gray-600">
                {healthStatus?.status === 'operational'
                  ? 'All systems operational'
                  : 'Degraded performance'}
              </p>
            </div>
          </div>
          <div className="flex space-x-4 text-sm">
            <StatusIndicator label="Database" status={healthStatus?.services?.database} />
            <StatusIndicator label="Redis" status={healthStatus?.services?.redis} />
            <StatusIndicator label="PostHog" status={healthStatus?.services?.posthog} />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Signups</h3>
          <div className="space-y-3">
            {metrics?.recent_signups?.map((signup: any) => (
              <div key={signup.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{signup.org_name}</p>
                  <p className="text-sm text-gray-500">{signup.admin_email}</p>
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(signup.created_at)}</span>
              </div>
            )) || <p className="text-gray-500">No recent signups</p>}
          </div>
        </div>

        {/* Top Organizations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top Organizations</h3>
          <div className="space-y-3">
            {metrics?.top_organizations?.map((org: any) => (
              <div key={org.org_id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{org.org_name}</p>
                  <p className="text-sm text-gray-500">{formatNumber(org.api_calls)} API calls</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
          <div className="space-y-3">
            {metrics?.alerts?.map((alert: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-500">{alert.message}</p>
                </div>
              </div>
            )) || <p className="text-gray-500">No active alerts</p>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex space-x-4">
        <button
          onClick={() => {
            analytics.trackClick('view_all_orgs', 'button');
            // Navigate to organizations list
          }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View All Organizations
        </button>
        <button
          onClick={() => {
            analytics.trackClick('view_analytics', 'button');
            // Navigate to analytics
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Platform Analytics
        </button>
        <button
          onClick={() => {
            analytics.trackClick('manage_features', 'button');
            // Navigate to feature flags
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Feature Flags
        </button>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<MetricCard> = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <Icon className={`h-8 w-8 ${color}`} />
      {change !== undefined && (
        <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-gray-500'}`}>
          +{change} new
        </span>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-gray-600 text-sm mt-1">{title}</p>
  </div>
);

const StatusIndicator: React.FC<{ label: string; status: string }> = ({ label, status }) => (
  <div className="flex items-center space-x-2">
    <div
      className={`h-2 w-2 rounded-full ${
        status === 'healthy' || status === 'enabled' ? 'bg-green-500' : 'bg-yellow-500'
      }`}
    />
    <span className="text-gray-600">{label}</span>
  </div>
);

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`;
  }
  return `${Math.floor(diffMins / 1440)}d ago`;
}

export default PlatformAdminDashboard;
