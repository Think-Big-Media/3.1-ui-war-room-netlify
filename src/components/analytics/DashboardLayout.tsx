/**
 * Main dashboard layout component.
 * Responsive grid layout with loading states and error boundaries.
 */
import React, { Suspense, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAnalyticsWebSocket } from '../../hooks/useWebSocket';
import { DateRangeFilter } from './DateRangeFilter';
import { MetricCard } from './MetricCard';
import { VolunteerGrowthChart } from './VolunteerGrowthChart';
import { EventAttendanceChart } from './EventAttendanceChart';
import { DonationChart } from './DonationChart';
import { GeographicMap } from './GeographicMap';
import { ActivityFeed } from './ActivityFeed';
// import { ExportButton } from './ExportButton'; // ExportButton is defined below in this file
import { analytics } from '../../services/posthog';
import { useAppSelector } from '../../hooks/redux';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

// Loading skeleton component
const DashboardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div className="bg-gray-200 rounded-lg h-64" />
      <div className="bg-gray-200 rounded-lg h-64" />
    </div>
  </div>
);

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
    <p className="text-red-700 mb-4">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      Try again
    </button>
  </div>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isConnected, subscribeToMetrics } = useAnalyticsWebSocket();
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    // Track dashboard view
    analytics.trackPageView('analytics_dashboard', {
      date_range: dateRange,
      user_role: user?.role,
    });

    // Subscribe to real-time updates
    if (isConnected) {
      subscribeToMetrics(['volunteers', 'events', 'donations', 'reach', 'activity_feed']);
    }
  }, [isConnected, subscribeToMetrics, dateRange, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaign Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time insights and performance metrics
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection status indicator */}
              <div className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full mr-2 ${
                    isConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm text-gray-600">{isConnected ? 'Live' : 'Offline'}</span>
              </div>

              {/* Date range filter */}
              <DateRangeFilter />

              {/* Export button */}
              <ExportButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<DashboardSkeleton />}>
            {/* Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <MetricCard title="Active Volunteers" metric="volunteers" icon="users" color="blue" />
              <MetricCard title="Events Hosted" metric="events" icon="calendar" color="green" />
              <MetricCard title="Total Reach" metric="reach" icon="trending-up" color="purple" />
              <MetricCard
                title="Donations Raised"
                metric="donations"
                icon="dollar-sign"
                color="yellow"
              />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Volunteer growth chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Volunteer Growth</h3>
                <VolunteerGrowthChart />
              </div>

              {/* Event attendance chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Event Attendance</h3>
                <EventAttendanceChart />
              </div>

              {/* Donation breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Donation Sources</h3>
                <DonationChart />
              </div>

              {/* Geographic distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Geographic Reach</h3>
                <GeographicMap />
              </div>
            </div>

            {/* Activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {/* Custom content area */}
                {children}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <ActivityFeed />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Export button component
const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      // Export logic here
      analytics.trackClick('export_analytics', 'button', { format });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        disabled={isExporting}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 inline mr-2" />
            Exporting...
          </>
        ) : (
          'Export'
        )}
      </button>
    </div>
  );
};
