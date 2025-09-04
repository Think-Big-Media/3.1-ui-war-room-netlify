/**
 * Protected Route Components for War Room Platform
 * Handles authentication, authorization, and email verification requirements
 */

import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <svg
        className="animate-spin h-12 w-12 text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Email verification required component
const EmailVerificationRequired = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please verify your email address to access this area of the platform.
        </p>
        <div className="mt-6">
          <button
            onClick={() => (window.location.href = '/verify-email')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Email Verification
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Access denied component
interface AccessDeniedProps {
  reason: string;
  requiredRole?: string;
  missingPermissions?: string[];
}

const AccessDenied = ({ reason, requiredRole, missingPermissions }: AccessDeniedProps) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-center text-sm text-gray-600">{reason}</p>

        {requiredRole && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Required role:</strong> {requiredRole}
            </p>
          </div>
        )}

        {missingPermissions && missingPermissions.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Missing permissions:</strong>
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {missingPermissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Main protected route component
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  requireEmailVerification?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  requireEmailVerification = false,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, profile, hasRole, hasPermission } = useSupabaseAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerification && !user.email_confirmed_at) {
    return <EmailVerificationRequired />;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AccessDenied
        reason={`This area requires ${requiredRole} access.`}
        requiredRole={requiredRole}
      />
    );
  }

  // Check permission requirements
  const missingPermissions = requiredPermissions.filter((permission) => !hasPermission(permission));

  if (missingPermissions.length > 0) {
    return (
      <AccessDenied
        reason="You don't have the required permissions to access this area."
        missingPermissions={missingPermissions}
      />
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

// Specific route protection components for common use cases

// Admin only routes
interface AdminRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

export function AdminRoute({ children, requireEmailVerification = true }: AdminRouteProps) {
  return (
    <ProtectedRoute requiredRole="admin" requireEmailVerification={requireEmailVerification}>
      {children}
    </ProtectedRoute>
  );
}

// Manager or admin routes
interface ManagerRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

export function ManagerRoute({ children, requireEmailVerification = true }: ManagerRouteProps) {
  const { hasAnyRole } = useSupabaseAuth();

  return (
    <ProtectedRoute requireEmailVerification={requireEmailVerification}>
      {hasAnyRole(['admin', 'manager']) ? (
        children
      ) : (
        <AccessDenied
          reason="This area requires manager or admin access."
          requiredRole="manager or admin"
        />
      )}
    </ProtectedRoute>
  );
}

// Routes that require specific permissions
interface PermissionRouteProps {
  children: ReactNode;
  permissions: string[];
  requireEmailVerification?: boolean;
}

export function PermissionRoute({
  children,
  permissions,
  requireEmailVerification = true,
}: PermissionRouteProps) {
  return (
    <ProtectedRoute
      requiredPermissions={permissions}
      requireEmailVerification={requireEmailVerification}
    >
      {children}
    </ProtectedRoute>
  );
}

// Routes for verified users only (any role)
interface VerifiedRouteProps {
  children: ReactNode;
}

export function VerifiedRoute({ children }: VerifiedRouteProps) {
  return <ProtectedRoute requireEmailVerification={true}>{children}</ProtectedRoute>;
}

// Public route that redirects to dashboard if authenticated
interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// Higher-order component for conditional rendering based on permissions
interface ConditionalRenderProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  fallback?: ReactNode;
  showToUnauthorized?: boolean;
}

export function ConditionalRender({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback = null,
  showToUnauthorized = false,
}: ConditionalRenderProps) {
  const { isAuthenticated, user, hasRole, hasPermission } = useSupabaseAuth();

  // Not authenticated
  if (!isAuthenticated || !user) {
    return showToUnauthorized ? <>{children}</> : <>{fallback}</>;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check permission requirements
  const hasAllPermissions = requiredPermissions.every((permission) => hasPermission(permission));

  if (!hasAllPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
