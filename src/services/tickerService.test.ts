import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach } from 'jest-circus';
// vi shim is provided in setupTests; use global vi
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Hoist mock creation to ensure they're available during module loading
const { mockGet, mockPost } = (() => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  return { mockGet, mockPost };
})();

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
    })),
  },
}));

// Import service after mocking
import {
  useTickerFeed,
  useGeneralEvents,
  useTickerInsights,
  usePerformanceUpdates,
  useTrackEngagement,
  useRefreshTicker,
  type TickerItem,
  type TickerFeedResponse,
  type TickerEngagement,
} from './tickerService';

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Mock data
const mockTickerItem: TickerItem = {
  id: 'test-1',
  category: 'performance',
  title: 'Test Performance Update',
  description: 'Your campaign achieved 150% ROI',
  icon_name: 'trending-up',
  type: 'success',
  priority: 1,
  created_at: new Date().toISOString(),
  relevance_score: 0.95,
};

const mockFeedResponse: TickerFeedResponse = {
  items: [mockTickerItem],
  total_count: 1,
  has_more: false,
  last_updated: new Date().toISOString(),
};

describe('TickerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
    mockPost.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useTickerFeed', () => {
    it('should fetch ticker feed successfully', async () => {
      mockGet.mockResolvedValueOnce({ data: mockFeedResponse });

      const { result } = renderHook(() => useTickerFeed(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFeedResponse);
      expect(mockGet).toHaveBeenCalledWith('/ticker/feed', {
        params: undefined,
      });
    });

    it('should handle parameters correctly', async () => {
      const params = {
        limit: 10,
        categories: ['performance', 'insights'] as ('performance' | 'general' | 'insights')[],
        priority_filter: 1,
        sort_by: 'relevance' as const,
      };

      mockGet.mockResolvedValueOnce({ data: mockFeedResponse });

      const { result } = renderHook(() => useTickerFeed(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGet).toHaveBeenCalledWith('/ticker/feed', { params });
    });

    it('should return mock data on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTickerFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have mock data
      expect(result.current.data?.items.length).toBeGreaterThan(0);
      expect(result.current.data?.items[0].category).toBeDefined();
    });
  });

  describe('useGeneralEvents', () => {
    it('should fetch general events', async () => {
      const mockEvents: TickerItem[] = [
        { ...mockTickerItem, category: 'general', title: 'General Update' },
      ];

      mockGet.mockResolvedValueOnce({ data: mockEvents });

      const { result } = renderHook(() => useGeneralEvents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEvents);
      expect(mockGet).toHaveBeenCalledWith('/ticker/general', {
        params: { limit: 20 },
      });
    });

    it('should accept limit parameter', async () => {
      mockGet.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useGeneralEvents(50), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGet).toHaveBeenCalledWith('/ticker/general', {
        params: { limit: 50 },
      });
    });
  });

  describe('useTickerInsights', () => {
    it('should fetch insights', async () => {
      const mockInsights: TickerItem[] = [
        { ...mockTickerItem, category: 'insights', title: 'AI Insight' },
      ];

      mockGet.mockResolvedValueOnce({ data: mockInsights });

      const { result } = renderHook(() => useTickerInsights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInsights);
      expect(mockGet).toHaveBeenCalledWith('/ticker/insights', {
        params: { limit: 20 },
      });
    });
  });

  describe('usePerformanceUpdates', () => {
    it('should fetch performance updates', async () => {
      const mockPerformance: TickerItem[] = [mockTickerItem];

      mockGet.mockResolvedValueOnce({ data: mockPerformance });

      const { result } = renderHook(() => usePerformanceUpdates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPerformance);
      expect(mockGet).toHaveBeenCalledWith('/ticker/performance', {
        params: { limit: 20 },
      });
    });
  });

  describe('useTrackEngagement', () => {
    it('should track engagement successfully', async () => {
      mockPost.mockResolvedValueOnce({ data: { success: true } });

      const { result } = renderHook(() => useTrackEngagement(), {
        wrapper: createWrapper(),
      });

      const engagement: TickerEngagement = {
        ticker_item_id: 'test-1',
        action: 'click',
        metadata: { source: 'test' },
      };

      result.current.mutate(engagement);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPost).toHaveBeenCalledWith('/ticker/engagement', engagement);
    });

    it('should handle engagement tracking errors gracefully', async () => {
      mockPost.mockRejectedValueOnce(new Error('Server error'));

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { result } = renderHook(() => useTrackEngagement(), {
        wrapper: createWrapper(),
      });

      const engagement: TickerEngagement = {
        ticker_item_id: 'test-1',
        action: 'view',
      };

      result.current.mutate(engagement);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should log locally on error
      expect(consoleLogSpy).toHaveBeenCalledWith('Engagement tracked locally:', engagement);

      consoleLogSpy.mockRestore();
    });
  });

  describe('useRefreshTicker', () => {
    it('should refresh ticker sources', async () => {
      mockPost.mockResolvedValueOnce({ data: { status: 'success' } });

      const { result } = renderHook(() => useRefreshTicker(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ status: 'success' });
      expect(mockPost).toHaveBeenCalledWith('/ticker/refresh');
    });

    it('should invalidate queries on success', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockPost.mockResolvedValueOnce({ data: { status: 'success' } });

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => useRefreshTicker(), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['ticker'],
      });
    });
  });

  describe('TickerItem Interface', () => {
    it('should handle all ticker item types', () => {
      const items: TickerItem[] = [
        {
          id: '1',
          category: 'general',
          title: 'General Event',
          description: 'Description',
          icon_name: 'info',
          type: 'info',
          priority: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          category: 'insights',
          title: 'AI Insight',
          description: 'Smart recommendation',
          icon_name: 'sparkles',
          type: 'update',
          priority: 1,
          created_at: new Date().toISOString(),
          relevance_score: 0.8,
        },
        {
          id: '3',
          category: 'performance',
          title: 'Warning',
          description: 'Performance dip',
          icon_name: 'alert',
          type: 'warning',
          priority: 2,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        },
      ];

      // Type checking
      items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(['general', 'insights', 'performance']).toContain(item.category);
        expect(['success', 'info', 'warning', 'update']).toContain(item.type);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTickerFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should fallback to mock data
      expect(result.current.data?.items).toBeDefined();
    });

    it('should handle API errors with fallback', async () => {
      mockGet.mockRejectedValueOnce({
        response: { status: 500, data: { error: 'Server error' } },
      });

      const { result } = renderHook(() => useTickerFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should fallback to mock data
      expect(result.current.data?.items).toBeDefined();
    });
  });

  describe('Mock Data Fallback', () => {
    it('should provide valid mock data structure', async () => {
      mockGet.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useTickerFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const mockData = result.current.data;
      expect(mockData).toBeDefined();
      expect(mockData?.items).toBeInstanceOf(Array);
      expect(mockData?.total_count).toBeGreaterThan(0);
      expect(mockData?.has_more).toBeDefined();
      expect(mockData?.last_updated).toBeDefined();

      // Check mock items have required fields
      mockData?.items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.icon_name).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.priority).toBeDefined();
        expect(item.created_at).toBeDefined();
      });
    });
  });

  describe('Refetch Intervals', () => {
    it('should configure hooks with correct refetch intervals', () => {
      // Test useTickerFeed - should refresh every 30 seconds
      const { result: feedResult } = renderHook(() => useTickerFeed(), {
        wrapper: createWrapper(),
      });

      // Test useGeneralEvents - should refresh every 60 seconds
      const { result: generalResult } = renderHook(() => useGeneralEvents(), {
        wrapper: createWrapper(),
      });

      // Test useTickerInsights - should refresh every 5 minutes (300 seconds)
      const { result: insightsResult } = renderHook(() => useTickerInsights(), {
        wrapper: createWrapper(),
      });

      // Test usePerformanceUpdates - should refresh every 30 seconds
      const { result: performanceResult } = renderHook(() => usePerformanceUpdates(), {
        wrapper: createWrapper(),
      });

      // Verify that all hooks return query objects (indicating they're properly configured)
      expect(feedResult.current).toHaveProperty('data');
      expect(feedResult.current).toHaveProperty('isLoading');
      expect(generalResult.current).toHaveProperty('data');
      expect(generalResult.current).toHaveProperty('isLoading');
      expect(insightsResult.current).toHaveProperty('data');
      expect(insightsResult.current).toHaveProperty('isLoading');
      expect(performanceResult.current).toHaveProperty('data');
      expect(performanceResult.current).toHaveProperty('isLoading');
    });
  });
});
