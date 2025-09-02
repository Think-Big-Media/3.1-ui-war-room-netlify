/**
 * Authentication API service for War Room platform
 * Handles all auth-related API calls to backend endpoints
 */

import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { API_BASE_URL, API_VERSION } from '@/config/constants';

// API Base URL with version
const API_URL = `${API_BASE_URL}${API_VERSION}`;

// Types
export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  username: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  org_id: string;
  created_at: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Custom base query with auth token injection
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/v1/auth`,
    prepareHeaders: (headers, { getState }) => {
      // Get token from localStorage or state
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  });

  const result = await baseQuery(args, api, extraOptions);

  // Handle token refresh on 401
  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      // Try to refresh token
      const refreshResult = await baseQuery(
        {
          url: '/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const tokenData = refreshResult.data as TokenResponse;

        // Store new tokens
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);

        // Retry original request
        const retryResult = await baseQuery(args, api, extraOptions);
        return retryResult;
      }
      // Refresh failed, clear tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return result;
};

// RTK Query API slice
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Session'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
          client_id: credentials.deviceName || 'Web App',
          grant_type: 'password',
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      }),
      invalidatesTags: ['User', 'Session'],
    }),

    register: builder.mutation<UserProfile, RegisterRequest>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Session'],
    }),

    logoutAllDevices: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Session'],
    }),

    refreshToken: builder.mutation<TokenResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: '/refresh',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User', 'Session'],
    }),

    // Profile endpoints
    getCurrentUser: builder.query<UserProfile, void>({
      query: () => '/me',
      providesTags: ['User'],
    }),

    // Password management
    forgotPassword: builder.mutation<{ message: string }, PasswordResetRequest>({
      query: (data) => ({
        url: '/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation<{ message: string }, PasswordResetConfirm>({
      query: (data) => ({
        url: '/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (data) => ({
        url: '/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Email verification
    verifyEmail: builder.mutation<{ message: string }, { token: string }>({
      query: ({ token }) => ({
        url: `/verify-email/${token}`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    resendVerification: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/resend-verification',
        method: 'POST',
      }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllDevicesMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;

// Auth utility functions
export const authUtils = {
  // Token management
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  setTokens: (tokens: { access_token: string; refresh_token: string }) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  },

  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // User management
  getCurrentUser: (): UserProfile | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: UserProfile) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Authentication checks
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return Boolean(token && user);
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },

  // Permission checks
  hasPermission: (permission: string): boolean => {
    const user = authUtils.getCurrentUser();
    if (!user) {
      return false;
    }

    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }

    return user.permissions.includes(permission);
  },

  hasRole: (role: string): boolean => {
    const user = authUtils.getCurrentUser();
    return user?.role === role;
  },

  hasAnyRole: (roles: string[]): boolean => {
    const user = authUtils.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  },
};
