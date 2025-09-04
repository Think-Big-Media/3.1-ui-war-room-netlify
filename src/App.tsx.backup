/**
 * War Room Platform - Main Application Component
 * Configured to use Supabase Authentication
 * Build timestamp: 2025-08-09T08:02:53Z
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

// Import Supabase Auth Components
import {
  SupabaseLoginForm,
  SupabaseRegisterForm,
  SupabaseForgotPasswordForm,
  SupabaseResetPasswordForm,
  SupabaseEmailVerificationPage,
} from './components/auth/supabase-index';

// Import Protected Route Components
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

// Import Layout
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthDebug } from './components/AuthDebug';
import { LoginBypass } from './components/auth/LoginBypass';

// Lazy load heavy dashboard components for better performance
const AnalyticsDashboard = React.lazy(
  () => import('./pages/AnalyticsDashboard')
);
const AutomationDashboard = React.lazy(
  () => import('./pages/AutomationDashboard')
);
const DocumentIntelligence = React.lazy(
  () => import('./pages/DocumentIntelligence')
);

// Lazy load other heavy components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CommandCenter = React.lazy(() => import('./pages/CommandCenter'));
const DebugDashboard = React.lazy(() => import('./pages/DebugDashboard'));
const XDashboard = React.lazy(() => import('./pages/XDashboard'));

// Import light components normally
import AuthCallback from './pages/AuthCallback';
import OAuthSetup from './pages/OAuthSetup';
import EnvCheck from './pages/EnvCheck';
import TestAuth from './pages/TestAuth';
import OAuthDiagnostics from './pages/OAuthDiagnostics';
import SettingsPage from './pages/SettingsPage';

// Import Builder.io components
import BuilderPage from './pages/BuilderPage';
import './builder-registry'; // Register components with Builder

// Import Data Toggle Button
import { DataToggleButton } from './components/DataToggleButton';

// Loading component for lazy-loaded routes
const LazyLoadFallback = ({ componentName }: { componentName: string }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      <p className="mt-4 text-gray-600">Loading {componentName}...</p>
    </div>
  </div>
);

// Temporary simple dashboard component
const SimpleDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        War Room Dashboard
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">
          Welcome to War Room! The full dashboard is being loaded.
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-500">✅ Authentication is working</p>
          <p className="text-sm text-gray-500">✅ Supabase is connected</p>
          <p className="text-sm text-gray-500">
            ⏳ Dashboard components loading...
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Auth Loading Fallback Component
const AuthLoadingFallback = () => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Show fallback after 5 seconds
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading War Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Loading taking longer than expected...
        </h2>
        <p className="text-gray-600 mb-6">
          The authentication system is having trouble loading. You can:
        </p>
        <div className="space-y-3">
          <button
            onClick={() => (window.location.href = '/login')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{ letterSpacing: '-0.05em' }}
          >
            Go to Login Page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            style={{ letterSpacing: '-0.05em' }}
          >
            Clear Storage & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // Set a global timeout for auth initialization
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 15000); // 15 seconds

    return () => clearTimeout(timer);
  }, []);

  // If auth times out, show fallback UI
  if (authTimeout) {
    return <AuthLoadingFallback />;
  }

  return (
    <>
      {/* Data Toggle Button - Always visible */}
      <DataToggleButton />

      <Routes>
        {/* Public Routes - Redirect to dashboard if authenticated */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <SupabaseLoginForm />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <SupabaseRegisterForm />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <SupabaseForgotPasswordForm />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <SupabaseResetPasswordForm />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={<SupabaseEmailVerificationPage />}
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/oauth-setup" element={<OAuthSetup />} />
        <Route path="/env-check" element={<EnvCheck />} />
        <Route path="/test-auth" element={<TestAuth />} />
        <Route path="/oauth-diagnostics" element={<OAuthDiagnostics />} />

        {/* Main App Routes - Single MainLayout */}
        <Route element={<MainLayout />}>
          <Route
            index
            element={
              <React.Suspense
                fallback={<LazyLoadFallback componentName="Dashboard" />}
              >
                <Dashboard />
              </React.Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <React.Suspense
                fallback={<LazyLoadFallback componentName="Dashboard" />}
              >
                <Dashboard />
              </React.Suspense>
            }
          />
          <Route
            path="x"
            element={
              <React.Suspense
                fallback={<LazyLoadFallback componentName="X Dashboard" />}
              >
                <XDashboard />
              </React.Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <React.Suspense
                fallback={
                  <LazyLoadFallback componentName="Analytics Dashboard" />
                }
              >
                <AnalyticsDashboard />
              </React.Suspense>
            }
          />
          <Route
            path="automation"
            element={
              <React.Suspense
                fallback={
                  <LazyLoadFallback componentName="Automation Dashboard" />
                }
              >
                <AutomationDashboard />
              </React.Suspense>
            }
          />
          <Route
            path="documents"
            element={
              <React.Suspense
                fallback={
                  <LazyLoadFallback componentName="Document Intelligence" />
                }
              >
                <DocumentIntelligence />
              </React.Suspense>
            }
          />
          <Route path="contacts" element={<SimpleDashboard />} />
        </Route>

        {/* Settings Route - Uses its own PageLayout with top navigation */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Debug route without layout */}
        <Route
          path="/debug"
          element={
            <ProtectedRoute>
              <React.Suspense
                fallback={<LazyLoadFallback componentName="Debug Dashboard" />}
              >
                <DebugDashboard />
              </React.Suspense>
            </ProtectedRoute>
          }
        />

        {/* Platform Admin Route - Requires platform_admin role */}
        <Route
          path="/platform-admin/*"
          element={
            <ProtectedRoute requiredRole="platform_admin">
              <SimpleDashboard />
            </ProtectedRoute>
          }
        />

        {/* Temporary route to view dashboard without auth for development */}
        <Route
          path="/preview-dashboard"
          element={
            <React.Suspense
              fallback={<LazyLoadFallback componentName="Dashboard" />}
            >
              <Dashboard />
            </React.Suspense>
          }
        />


        {/* CommandCenter Routes */}
        <Route
          path="/CommandCenter"
          element={
            <React.Suspense
              fallback={<LazyLoadFallback componentName="CommandCenter" />}
            >
              <CommandCenter />
            </React.Suspense>
          }
        />
        <Route
          path="/command-center"
          element={
            <React.Suspense
              fallback={<LazyLoadFallback componentName="CommandCenter" />}
            >
              <CommandCenter />
            </React.Suspense>
          }
        />


        {/* Builder.io Routes - Visual Editor Pages */}
        <Route path="/builder/*" element={<BuilderPage />} />
        <Route path="/builder" element={<BuilderPage />} />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">404</h1>
                <p className="mt-2 text-gray-600">Page not found</p>
                <a
                  href="/dashboard"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-500"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>
      {import.meta.env.DEV && (
        <>
          <AuthDebug />
          <LoginBypass />
        </>
      )}
    </>
  );
}

export default App;
