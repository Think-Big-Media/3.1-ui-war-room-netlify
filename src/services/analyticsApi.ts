/**
 * RTK Query API slice for analytics endpoints.
 * Handles caching, real-time updates, and background refetching.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AnalyticsDashboard,
  MetricCard,
  ExportJobRequest,
  ExportJobResponse,
  DateRangeEnum,
  VolunteerChart,
  EventChart,
  DonationChart,
  GeographicData,
} from '../types/analytics';

// Define tag types for cache invalidation
const tagTypes = ['Analytics', 'Metrics', 'Charts', 'Export'] as const;

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/analytics',
    prepareHeaders: (headers) => {
      // Get token from localStorage or Redux store
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes,
  endpoints: (builder) => ({
    // Get full dashboard data
    getDashboard: builder.query<
      AnalyticsDashboard,
      {
        dateRange: DateRangeEnum;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: ({ dateRange, startDate, endDate }) => ({
        url: '/summary', // Backend provides /summary, not /dashboard
        params: {
          date_range: dateRange,
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
        },
      }),
      providesTags: ['Analytics'],
      // Keep data fresh with polling (use keepUnusedDataFor instead)
      keepUnusedDataFor: 300, // 5 minutes in seconds
    }),

    // Get metric cards
    getMetricCards: builder.query<MetricCard[], { dateRange: DateRangeEnum }>({
      query: ({ dateRange }) => ({
        url: '/sentiment', // Backend provides /sentiment for metrics
        params: { date_range: dateRange },
      }),
      providesTags: ['Metrics'],
    }),

    // Get volunteer chart data
    getVolunteerChart: builder.query<VolunteerChart, { dateRange: DateRangeEnum }>({
      query: ({ dateRange }) => ({
        url: '/charts/volunteers',
        params: { date_range: dateRange },
      }),
      providesTags: ['Charts'],
    }),

    // Get event chart data
    getEventChart: builder.query<EventChart, { dateRange: DateRangeEnum }>({
      query: ({ dateRange }) => ({
        url: '/charts/events',
        params: { date_range: dateRange },
      }),
      providesTags: ['Charts'],
    }),

    // Get donation chart data
    getDonationChart: builder.query<DonationChart, { dateRange: DateRangeEnum }>({
      query: ({ dateRange }) => ({
        url: '/charts/donations',
        params: { date_range: dateRange },
      }),
      providesTags: ['Charts'],
    }),

    // Get geographic data
    getGeographicData: builder.query<GeographicData, { dateRange: DateRangeEnum }>({
      query: ({ dateRange }) => ({
        url: '/geographic',
        params: { date_range: dateRange },
      }),
      providesTags: ['Analytics'],
    }),

    // Export analytics data
    exportAnalytics: builder.mutation<ExportJobResponse, ExportJobRequest>({
      query: (exportRequest) => ({
        url: '/export',
        method: 'POST',
        body: exportRequest,
      }),
      invalidatesTags: ['Export'],
    }),

    // Get export job status
    getExportStatus: builder.query<ExportJobResponse, string>({
      query: (jobId) => `/export/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: 'Export', id: jobId }],
      // Use keepUnusedDataFor for cache control
      keepUnusedDataFor: 60, // 1 minute
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetDashboardQuery,
  useGetMetricCardsQuery,
  useGetVolunteerChartQuery,
  useGetEventChartQuery,
  useGetDonationChartQuery,
  useGetGeographicDataQuery,
  useExportAnalyticsMutation,
  useGetExportStatusQuery,
} = analyticsApi;

// Helper function to invalidate analytics cache
export const invalidateAnalyticsCache = (dispatch: any) => {
  dispatch(analyticsApi.util.invalidateTags(['Analytics', 'Metrics', 'Charts']));
};

// Subscription endpoint for real-time updates via WebSocket
export const subscribeToAnalyticsUpdates = (
  dispatch: any,
  { orgId, metrics }: { orgId: string; metrics: string[] }
) => {
  // This will be used with the WebSocket hook to update cache
  return {
    unsubscribe: () => {
      // Cleanup logic
    },
  };
};
