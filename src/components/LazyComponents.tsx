/**
 * Lazy-loaded components for better performance
 * Reduces initial bundle size by code-splitting routes
 */

import { lazy, Suspense } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
);

// Lazy load main route components
export const LazyCommandCenter = lazy(() => import('../pages/CommandCenter'));
export const LazyRealTimeMonitoring = lazy(() => import('../pages/RealTimeMonitoring'));
export const LazyCampaignControl = lazy(() => import('../pages/CampaignControl'));
export const LazyIntelligenceHub = lazy(() => import('../pages/IntelligenceHub'));
export const LazyAlertCenter = lazy(() => import('../pages/AlertCenter'));
export const LazySettingsPage = lazy(() => import('../pages/SettingsPage'));
export const LazyContentCalendarPage = lazy(() => import('../pages/ContentCalendarPage'));
export const LazyContentEnginePage = lazy(() => import('../pages/ContentEnginePage'));

// Lazy load heavy dashboard components
export const LazyDashboard = lazy(() => import('../components/dashboard/Dashboard'));
export const LazyAnalyticsDashboard = lazy(() => import('../pages/AnalyticsDashboard'));

// HOC for wrapping lazy components with Suspense
export const withSuspense = (Component: React.ComponentType) => {
  return (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

// Pre-wrapped components ready to use
export const CommandCenter = withSuspense(LazyCommandCenter);
export const RealTimeMonitoring = withSuspense(LazyRealTimeMonitoring);
export const CampaignControl = withSuspense(LazyCampaignControl);
export const IntelligenceHub = withSuspense(LazyIntelligenceHub);
export const AlertCenter = withSuspense(LazyAlertCenter);
export const SettingsPage = withSuspense(LazySettingsPage);
export const ContentCalendarPage = withSuspense(LazyContentCalendarPage);
export const ContentEnginePage = withSuspense(LazyContentEnginePage);
export const Dashboard = withSuspense(LazyDashboard);
export const AnalyticsDashboard = withSuspense(LazyAnalyticsDashboard);
