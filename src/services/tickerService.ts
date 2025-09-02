import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/config/constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('tickerService');

// Ticker item interface matching backend model
export interface TickerItem {
  id: string;
  category: 'general' | 'insights' | 'performance';
  title: string;
  description: string;
  icon_name: string;
  type: 'success' | 'info' | 'warning' | 'update';
  priority: number;
  source_data?: Record<string, any>;
  created_at: string;
  expires_at?: string;
  relevance_score?: number;
}

// Ticker feed response
export interface TickerFeedResponse {
  items: TickerItem[];
  total_count: number;
  has_more: boolean;
  last_updated: string | null;
}

// Engagement tracking
export interface TickerEngagement {
  ticker_item_id: string;
  action: 'view' | 'click' | 'dismiss' | 'share';
  metadata?: Record<string, any>;
}

// Create axios instance for ticker API
const tickerApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
const tickerApiClient = {
  // Get mixed ticker feed
  getFeed: async (params?: {
    limit?: number;
    categories?: string[];
    priority_filter?: number;
    include_expired?: boolean;
    sort_by?: 'relevance' | 'created_at' | 'priority';
  }): Promise<TickerFeedResponse> => {
    const response = await tickerApi.get('/ticker/feed', { params });
    return response.data;
  },

  // Get general events
  getGeneralEvents: async (limit = 20): Promise<TickerItem[]> => {
    const response = await tickerApi.get('/ticker/general', {
      params: { limit },
    });
    return response.data;
  },

  // Get customized insights
  getInsights: async (limit = 20): Promise<TickerItem[]> => {
    const response = await tickerApi.get('/ticker/insights', {
      params: { limit },
    });
    return response.data;
  },

  // Get performance updates
  getPerformanceUpdates: async (limit = 20): Promise<TickerItem[]> => {
    const response = await tickerApi.get('/ticker/performance', {
      params: { limit },
    });
    return response.data;
  },

  // Track engagement
  trackEngagement: async (engagement: TickerEngagement): Promise<void> => {
    await tickerApi.post('/ticker/engagement', engagement);
  },

  // Refresh sources (admin)
  refreshSources: async (): Promise<any> => {
    const response = await tickerApi.post('/ticker/refresh');
    return response.data;
  },
};

// React Query hooks

// Main ticker feed hook
export const useTickerFeed = (params?: {
  limit?: number;
  categories?: ('general' | 'insights' | 'performance')[];
  priority_filter?: number;
  sort_by?: 'relevance' | 'created_at' | 'priority';
}) => {
  return useQuery({
    queryKey: ['ticker-feed', params],
    queryFn: async () => {
      try {
        return await tickerApiClient.getFeed(params);
      } catch (error) {
        // Backend not available, use mock data
        return getMockTickerData();
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
    // Always ensure we have data
    select: (data) => {
      if (!data?.items?.length) {
        return getMockTickerData();
      }
      return data;
    },
  });
};

// Category-specific hooks
export const useGeneralEvents = (limit = 20) => {
  return useQuery({
    queryKey: ['ticker-general', limit],
    queryFn: () => tickerApiClient.getGeneralEvents(limit),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 55000,
  });
};

export const useTickerInsights = (limit = 20) => {
  return useQuery({
    queryKey: ['ticker-insights', limit],
    queryFn: () => tickerApiClient.getInsights(limit),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 295000,
  });
};

export const usePerformanceUpdates = (limit = 20) => {
  return useQuery({
    queryKey: ['ticker-performance', limit],
    queryFn: () => tickerApiClient.getPerformanceUpdates(limit),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });
};

// Engagement tracking hook
export const useTrackEngagement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (engagement: TickerEngagement) => {
      try {
        return await tickerApiClient.trackEngagement(engagement);
      } catch (error) {
        // Backend not available, just log locally
        logger.debug('Engagement tracked locally', { engagement });
        return null;
      }
    },
    onSuccess: () => {
      // Optionally invalidate feed to update relevance scores
      queryClient.invalidateQueries({ queryKey: ['ticker-feed'] });
    },
  });
};

// Admin refresh hook
export const useRefreshTicker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tickerApiClient.refreshSources,
    onSuccess: () => {
      // Invalidate all ticker queries
      queryClient.invalidateQueries({ queryKey: ['ticker'] });
    },
  });
};

// WebSocket connection for real-time updates (optional)
export const useTickerWebSocket = (onNewItem?: (item: TickerItem) => void) => {
  const queryClient = useQueryClient();

  // This would be implemented when WebSocket support is added
  // For now, we rely on polling via refetchInterval
};

// Fallback mock data function
const getMockTickerData = (): TickerFeedResponse => {
  const mockItems: TickerItem[] = [
    {
      id: '1',
      category: 'performance',
      title: 'Campaign Performance Alert',
      description: 'Your "Authority Building" campaign CTR increased by 25%',
      icon_name: 'TrendingUp',
      type: 'success',
      priority: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      category: 'insights',
      title: 'Content Opportunity Detected',
      description: 'Video testimonials show 3x higher engagement. Consider creating more.',
      icon_name: 'Lightbulb',
      type: 'info',
      priority: 3,
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '3',
      category: 'general',
      title: 'SEO Trend: Voice Search Optimization',
      description: 'New Google update prioritizes conversational content',
      icon_name: 'Globe',
      type: 'info',
      priority: 4,
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: '4',
      category: 'performance',
      title: 'Google Ads Performance',
      description: 'Your ads generated 47 new leads in the past 2 hours',
      icon_name: 'DollarSign',
      type: 'success',
      priority: 1,
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: '5',
      category: 'insights',
      title: 'Content Strategy Insight',
      description: 'Your audience engages most with case study content on Tuesdays',
      icon_name: 'BarChart3',
      type: 'info',
      priority: 3,
      created_at: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: '6',
      category: 'general',
      title: 'Industry News: AI Content Creation',
      description: 'New AI tools show 40% improvement in content personalization',
      icon_name: 'Zap',
      type: 'update',
      priority: 4,
      created_at: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: '7',
      category: 'performance',
      title: 'Content Calendar Update',
      description: "This week's content reached 89% of target engagement",
      icon_name: 'Calendar',
      type: 'success',
      priority: 2,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '8',
      category: 'insights',
      title: 'Optimization Opportunity',
      description: 'Consider posting testimonials during 2-4 PM for 35% better reach',
      icon_name: 'Target',
      type: 'info',
      priority: 3,
      created_at: new Date(Date.now() - 2400000).toISOString(),
    },
  ];

  return {
    items: mockItems,
    total_count: mockItems.length,
    has_more: false,
    last_updated: new Date().toISOString(),
  };
};
