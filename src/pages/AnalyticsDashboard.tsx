/**
 * Main Analytics Dashboard page.
 * Composes all dashboard components with permission checking.
 */
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { DashboardLayout } from '../components/analytics/DashboardLayout';
import { useGetDashboardQuery } from '../services/analyticsApi';
import { analytics } from '../services/posthog';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { AnalyticsHead, AnalyticsStructuredData } from '../components/SEO';
import { type DateRangeEnum } from '../types/analytics';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const dateRange = useAppSelector((state) => state.analytics.dateRange);

  // Check permissions
  const hasAnalyticsPermission = (user as any)?.permissions?.includes('analytics.view');

  // Fetch dashboard data
  const { data, error, isLoading, refetch } = useGetDashboardQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  useEffect(() => {
    // Track page view
    analytics.trackPageView('analytics_dashboard', {
      has_permission: hasAnalyticsPermission,
      date_range: dateRange,
    });
  }, [hasAnalyticsPermission, dateRange]);

  // Redirect if no permission
  if (!hasAnalyticsPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the analytics dashboard. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Analytics Dashboard - War Room</title>
        <meta name="description" content="View campaign analytics and performance metrics" />
      </Helmet>

      <DashboardLayout>
        {/* Additional custom content can go here */}
        {/* The layout handles all the standard dashboard components */}

        {/* Export success notification */}
        <ExportNotification />

        {/* Feature announcement banner */}
        <FeatureAnnouncementBanner />
      </DashboardLayout>
    </>
  );
};

// Export notification component
const ExportNotification: React.FC = () => {
  const exportJob = useAppSelector((state) => state.analytics.activeExportJob);

  if (!exportJob) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center space-x-3">
        {exportJob.status === 'processing' ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Exporting data...</p>
              <p className="text-xs text-gray-600">This may take a few moments</p>
            </div>
          </>
        ) : exportJob.status === 'completed' ? (
          <>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Export complete!</p>
              <a href={exportJob.downloadUrl} className="text-xs text-blue-600 hover:text-blue-700">
                Download {exportJob.format.toUpperCase()}
              </a>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Export failed</p>
              <p className="text-xs text-gray-600">Please try again</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Feature announcement banner
const FeatureAnnouncementBanner: React.FC = () => {
  const [dismissed, setDismissed] = React.useState(false);
  const hasSeenAnnouncement = localStorage.getItem('analytics_announcement_seen');

  if (dismissed || hasSeenAnnouncement) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('analytics_announcement_seen', 'true');
    analytics.track('announcement_dismissed', {
      announcement: 'analytics_real_time',
    });
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700">
            <strong>New!</strong> Real-time updates are now available. Your dashboard will
            automatically refresh with the latest data.
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button onClick={handleDismiss} className="text-blue-400 hover:text-blue-500">
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
