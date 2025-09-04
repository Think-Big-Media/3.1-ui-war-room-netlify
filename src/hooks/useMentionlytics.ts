/**
 * Mentionlytics React Hooks
 * Custom hooks for accessing Mentionlytics data with mock/live support
 */

import { useState, useEffect, useCallback } from 'react';
import { mentionlyticsService } from '../services/mentionlytics/mentionlyticsService';
import type {
  MentionlyticsSentiment,
  MentionlyticsLocation,
  MentionlyticsMention,
  MentionlyticsInfluencer,
  ShareOfVoiceData,
} from '../services/mentionlytics/mockData';

// Generic hook for async Mentionlytics data
function useMentionlyticsData<T>(fetchFunction: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataMode, setDataMode] = useState(mentionlyticsService.getDataMode());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setDataMode(mentionlyticsService.getDataMode());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Mentionlytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, dataMode };
}

// Sentiment Analysis Hook
export function useSentimentAnalysis(period: string = '7days') {
  return useMentionlyticsData(() => mentionlyticsService.getSentimentAnalysis(period), [period]);
}

// Geographic Mentions Hook
export function useGeographicMentions() {
  return useMentionlyticsData(() => mentionlyticsService.getGeographicMentions());
}

// Live Feed Hook with real-time updates
export function useLiveMentionsFeed(limit: number = 10) {
  const [mentions, setMentions] = useState<MentionlyticsMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataMode, setDataMode] = useState(mentionlyticsService.getDataMode());

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const data = await mentionlyticsService.getMentionsFeed(limit);
        setMentions(data);
        setDataMode(mentionlyticsService.getDataMode());
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch mentions'));
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // Subscribe to live updates
    const unsubscribe = mentionlyticsService.subscribeToLiveFeed((newMention) => {
      setMentions((prev) => {
        const updated = [newMention, ...prev].slice(0, limit);
        return updated;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [limit]);

  return { mentions, loading, error, dataMode };
}

// Top Influencers Hook
export function useTopInfluencers(limit: number = 10) {
  return useMentionlyticsData(() => mentionlyticsService.getTopInfluencers(limit), [limit]);
}

// Share of Voice Hook
export function useShareOfVoice() {
  return useMentionlyticsData(() => mentionlyticsService.getShareOfVoice());
}

// Sentiment Trends Hook
export function useSentimentTrends(days: number = 7) {
  return useMentionlyticsData(() => mentionlyticsService.getSentimentTrends(days), [days]);
}

// Trending Topics Hook
export function useTrendingTopics(period: string = '24hours') {
  return useMentionlyticsData(() => mentionlyticsService.getTrendingTopics(period), [period]);
}

// Crisis Alerts Hook
export function useCrisisAlerts() {
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await mentionlyticsService.getCrisisAlerts();
        setAlerts(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  return { alerts, loading, error };
}

// Combined Dashboard Hook - All Mentionlytics data
export function useMentionlyticsDashboard() {
  const sentiment = useSentimentAnalysis();
  const geographic = useGeographicMentions();
  const liveFeed = useLiveMentionsFeed(5);
  const influencers = useTopInfluencers(5);
  const shareOfVoice = useShareOfVoice();
  const trends = useSentimentTrends();
  const crisis = useCrisisAlerts();

  const loading =
    sentiment.loading ||
    geographic.loading ||
    liveFeed.loading ||
    influencers.loading ||
    shareOfVoice.loading ||
    trends.loading;

  const error =
    sentiment.error ||
    geographic.error ||
    liveFeed.error ||
    influencers.error ||
    shareOfVoice.error ||
    trends.error;

  return {
    sentiment: sentiment.data,
    geographic: geographic.data,
    mentions: liveFeed.mentions,
    influencers: influencers.data,
    shareOfVoice: shareOfVoice.data,
    trends: trends.data,
    crisis: crisis.alerts,
    loading,
    error,
    dataMode: sentiment.dataMode,
    refetch: async () => {
      await Promise.all([
        sentiment.refetch(),
        geographic.refetch(),
        influencers.refetch(),
        shareOfVoice.refetch(),
        trends.refetch(),
      ]);
    },
  };
}

// Hook to check and toggle data mode
export function useMentionlyticsMode() {
  const [mode, setMode] = useState(mentionlyticsService.getDataMode());

  const toggleMode = useCallback(() => {
    const newMode = mode === 'MOCK' ? 'LIVE' : 'MOCK';
    mentionlyticsService.setDataMode(newMode === 'MOCK');
    setMode(newMode);
    // Reload to refresh all data
    setTimeout(() => window.location.reload(), 500);
  }, [mode]);

  return { mode, toggleMode, isMock: mode === 'MOCK' };
}
