/**
 * Enterprise-Grade API Client with Token Management
 * Chairman's Mandate: Secure token handling with automatic refresh and graceful logout
 */

import { BaseQueryFn, FetchArgs, FetchBaseQueryError, fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';
import React from 'react';

// Create a mutex to prevent multiple simultaneous token refresh attempts
const mutex = new Mutex();

/**
 * Token Storage Strategy (Chairman's Mandate)
 * - Access token: In memory (Redux store) for security
 * - Refresh token: localStorage (temporary MVP, documented tech debt)
 * TODO: Move refresh token to HttpOnly cookie in production
 */
interface TokenStore {
  accessToken: string | null;
  refreshToken: string | null;
}

class TokenManager {
  private accessToken: string | null = null;
  
  getAccessToken(): string | null {
    // Try memory first, fall back to localStorage for MVP
    return this.accessToken || localStorage.getItem('access_token');
  }
  
  setAccessToken(token: string): void {
    this.accessToken = token;
    // Also store in localStorage for MVP (to be removed)
    localStorage.setItem('access_token', token);
  }
  
  getRefreshToken(): string | null {
    // MVP: Using localStorage, production should use HttpOnly cookie
    return localStorage.getItem('refresh_token');
  }
  
  setRefreshToken(token: string): void {
    // MVP: Using localStorage, production should use HttpOnly cookie
    localStorage.setItem('refresh_token', token);
  }
  
  clearTokens(): void {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export const tokenManager = new TokenManager();

/**
 * Base query with automatic token attachment
 */
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_ENCORE_API_URL || '',
  prepareHeaders: (headers) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  },
  // Chairman's Mandate: 20-second timeout for Netlify proxy (26s limit)
  timeout: 20000,
});

/**
 * Refresh token endpoint call
 */
async function refreshAccessToken(): Promise<{ access_token: string } | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

/**
 * Enhanced base query with automatic token refresh on 401
 * Chairman's Mandate: Automatic refresh with graceful logout
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait until the mutex is available
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);
  
  // Check for 401 Unauthorized
  if (result.error && result.error.status === 401) {
    // Check if another instance is already refreshing
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        console.log('🔄 Attempting automatic token refresh...');
        const refreshResult = await refreshAccessToken();
        
        if (refreshResult && refreshResult.access_token) {
          // Success! Update token and retry original request
          tokenManager.setAccessToken(refreshResult.access_token);
          console.log('✅ Token refreshed successfully');
          
          // Retry the original request
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed - clear tokens and redirect to login
          console.log('❌ Token refresh failed - logging out');
          tokenManager.clearTokens();
          
          // Dispatch logout action if using Redux
          // api.dispatch(logoutUser());
          
          // Redirect to login with message
          window.location.href = '/login?session_expired=true';
        }
      } finally {
        release();
      }
    } else {
      // Wait for the ongoing refresh to complete
      await mutex.waitForUnlock();
      // Retry the request with potentially new token
      result = await baseQuery(args, api, extraOptions);
    }
  }
  
  return result;
};

/**
 * Error handler for API responses
 * Provides user-friendly error messages
 */
export function getErrorMessage(error: FetchBaseQueryError): string {
  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    if (error.status === 'TIMEOUT_ERROR') {
      return 'Request timed out. The server may be busy, please try again.';
    }
    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status === 500) {
      return 'Server error. Our team has been notified.';
    }
    if (typeof error.status === 'number' && error.status >= 400) {
      return error.data?.message || `Request failed with status ${error.status}`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Loading state component for consistent UX
 */
export const LoadingStates = {
  skeleton: (lines: number = 3) => (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" />
      ))}
    </div>
  ),
  
  spinner: () => (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  
  card: () => (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 rounded-lg" />
    </div>
  ),
};

/**
 * Error state component for consistent UX
 */
export const ErrorState = ({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-red-800">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  </div>
);

/**
 * Hook for handling API states in components
 * Chairman's Mandate: Every component must handle loading, error, and success states
 */
export function useApiState<T>(query: {
  data?: T;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error?: FetchBaseQueryError;
  refetch: () => void;
}) {
  const { data, isLoading, isFetching, isError, error, refetch } = query;
  
  const errorMessage = error ? getErrorMessage(error) : null;
  
  return {
    data,
    isInitialLoading: isLoading,
    isRefreshing: isFetching && !isLoading,
    isError,
    errorMessage,
    retry: refetch,
    
    // Render helpers
    renderLoading: (loader = LoadingStates.spinner) => isLoading ? loader() : null,
    renderError: () => isError ? <ErrorState message={errorMessage || 'An error occurred'} onRetry={refetch} /> : null,
    renderData: (renderer: (data: T) => React.ReactNode) => {
      if (isLoading) return LoadingStates.spinner();
      if (isError) return <ErrorState message={errorMessage || 'An error occurred'} onRetry={refetch} />;
      if (data) return renderer(data);
      return null;
    },
  };
}