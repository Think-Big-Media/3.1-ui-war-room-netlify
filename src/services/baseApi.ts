/**
 * Base RTK Query API Configuration
 * Chairman's Mandate: All API calls use secure token handling with proper state management
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './apiClient';
import { transformApiResponse } from '../utils/caseTransform';

/**
 * Base API slice that all service-specific APIs extend
 * Provides unified configuration for all API calls
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Auth', 
    'Campaign',
    'Analytics',
    'Metrics',
    'Alerts',
    'Intelligence',
    'Activity',
    'Settings'
  ],
  endpoints: () => ({}),
  // Global response transformation to handle case conversion
  transformResponse: (response: any) => {
    // Chairman's Mandate: Convert backend camelCase to frontend snake_case
    return transformApiResponse(response);
  },
});

/**
 * Example of how to create service-specific API slices
 */
export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkHealth: builder.query<
      { status: string; timestamp: string; services: string[] },
      void
    >({
      query: () => '/api/v1/health',
      // Chairman's Mandate: Health checks should have short cache
      keepUnusedDataFor: 30, // 30 seconds
    }),
  }),
});

export const { useCheckHealthQuery } = healthApi;

/**
 * Auth API endpoints
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      { access_token: string; refresh_token: string; user: any },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
    
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
    
    refreshToken: builder.mutation<
      { access_token: string },
      { refresh_token: string }
    >({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
    
    getCurrentUser: builder.query<any, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
} = authApi;

/**
 * Campaign API endpoints
 */
export const campaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query<any[], void>({
      query: () => '/api/v1/campaigns',
      providesTags: ['Campaign'],
      // Chairman's Mandate: Campaign list should update frequently
      keepUnusedDataFor: 60, // 1 minute
    }),
    
    getCampaignById: builder.query<any, string>({
      query: (id) => `/api/v1/campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: 'Campaign', id }],
    }),
    
    createCampaign: builder.mutation<any, any>({
      query: (campaign) => ({
        url: '/api/v1/campaigns',
        method: 'POST',
        body: campaign,
      }),
      invalidatesTags: ['Campaign'],
    }),
    
    updateCampaign: builder.mutation<any, { id: string; updates: any }>({
      query: ({ id, updates }) => ({
        url: `/api/v1/campaigns/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Campaign', id },
        'Campaign',
      ],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignByIdQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
} = campaignApi;

/**
 * Crisis Alert API endpoints
 */
export const alertApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<any[], { severity?: string; acknowledged?: boolean }>({
      query: (params) => ({
        url: '/api/v1/alerts',
        params,
      }),
      providesTags: ['Alerts'],
      // Chairman's Mandate: Alerts must be near real-time
      keepUnusedDataFor: 10, // 10 seconds
    }),
    
    acknowledgeAlert: builder.mutation<void, string>({
      query: (alertId) => ({
        url: `/api/v1/alerts/${alertId}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: ['Alerts'],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
} = alertApi;