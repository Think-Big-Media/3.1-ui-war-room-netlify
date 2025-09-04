/**
 * War Room Platform - No Auth Version for Development
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

// Lazy load regular dashboard components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// Loading component
const LazyLoadFallback = ({ componentName }: { componentName: string }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      <p className="mt-4 text-gray-600">Loading {componentName}...</p>
    </div>
  </div>
);

function AppNoAuth() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={
              <React.Suspense fallback={<LazyLoadFallback componentName="Dashboard" />}>
                <Dashboard />
              </React.Suspense>
            }
          />
        </Route>
        <Route path="/dashboard" element={<MainLayout />}>
          <Route
            index
            element={
              <React.Suspense fallback={<LazyLoadFallback componentName="Dashboard" />}>
                <Dashboard />
              </React.Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AppNoAuth;
