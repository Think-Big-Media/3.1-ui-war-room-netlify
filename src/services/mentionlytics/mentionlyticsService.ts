/**
 * Mentionlytics Service with Mock/Live Data Support
 * Follows the War Room pattern: Mock data for testing, Live data for production
 */

import axios from 'axios';
import { getAPIEndpoints, getEnvironmentConfig } from '../../config/apiConfig';

// Import mock data
import {
  mockSentimentData,
  mockGeographicData,
  mockMentionsFeed,
  mockInfluencers,
  mockShareOfVoice,
  mockSentimentTrend,
  generateLiveMention,
  type MentionlyticsSentiment,
  type MentionlyticsLocation,
  type MentionlyticsMention,
  type MentionlyticsInfluencer,
  type ShareOfVoiceData,
} from './mockData';

class MentionlyticsService {
  private isMockMode: boolean;
  private endpoints: ReturnType<typeof getAPIEndpoints>;
  private config: ReturnType<typeof getEnvironmentConfig>;

  constructor() {
    this.config = getEnvironmentConfig();
    this.endpoints = getAPIEndpoints();
    // Check if we're in mock mode from localStorage or env
    this.isMockMode =
      localStorage.getItem('VITE_USE_MOCK_DATA') === 'true' ||
      this.config.features.mockMode ||
      !this.config.mentionlytics.apiToken;
  }

  // Toggle between mock and live data
  setDataMode(useMock: boolean) {
    this.isMockMode = useMock;
    localStorage.setItem('VITE_USE_MOCK_DATA', useMock.toString());
  }

  getDataMode() {
    return this.isMockMode ? 'MOCK' : 'LIVE';
  }

  // Sentiment Analysis
  async getSentimentAnalysis(period: string = '7days'): Promise<MentionlyticsSentiment> {
    if (this.isMockMode) {
      // Return mock data with slight variations to simulate real-time changes
      const variance = Math.random() * 10 - 5; // ±5 variation
      return {
        ...mockSentimentData,
        positive: Math.round(mockSentimentData.positive + variance),
        negative: Math.round(mockSentimentData.negative - variance),
        period,
      };
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.sentiment, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      // Fallback to mock data if API fails
      return mockSentimentData;
    }
  }

  // Geographic Distribution
  async getGeographicMentions(): Promise<MentionlyticsLocation[]> {
    if (this.isMockMode) {
      // Add slight variations to mock data
      return mockGeographicData.map((location) => ({
        ...location,
        mentions: location.mentions + Math.floor(Math.random() * 20 - 10),
      }));
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.geo);
      return response.data;
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      return mockGeographicData;
    }
  }

  // Live Mentions Feed
  async getMentionsFeed(limit: number = 10): Promise<MentionlyticsMention[]> {
    if (this.isMockMode) {
      // Mix existing mock data with newly generated mentions
      const newMentions = Array(2)
        .fill(null)
        .map(() => generateLiveMention());
      return [...newMentions, ...mockMentionsFeed].slice(0, limit);
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.feed, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mentions feed:', error);
      return mockMentionsFeed.slice(0, limit);
    }
  }

  // Influencers
  async getTopInfluencers(limit: number = 10): Promise<MentionlyticsInfluencer[]> {
    if (this.isMockMode) {
      return mockInfluencers.slice(0, limit);
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.influencers, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching influencers:', error);
      return mockInfluencers.slice(0, limit);
    }
  }

  // Share of Voice
  async getShareOfVoice(): Promise<ShareOfVoiceData[]> {
    if (this.isMockMode) {
      // Add slight variations to percentages
      const total = 100;
      const data = [...mockShareOfVoice];
      const variance = Math.random() * 5;
      data[0].percentage += variance;
      data[1].percentage -= variance;
      return data;
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.shareOfVoice);
      return response.data;
    } catch (error) {
      console.error('Error fetching share of voice:', error);
      return mockShareOfVoice;
    }
  }

  // Sentiment Trends
  async getSentimentTrends(days: number = 7): Promise<typeof mockSentimentTrend> {
    if (this.isMockMode) {
      return mockSentimentTrend.slice(-days);
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.sentiment, {
        params: { trend: true, days },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      return mockSentimentTrend.slice(-days);
    }
  }

  // Trending Topics
  async getTrendingTopics(period: string = '24hours'): Promise<any> {
    if (this.isMockMode) {
      return [
        { topic: 'Healthcare Reform', mentions: 342, sentiment: 'positive', growth: '+23%' },
        { topic: 'Economic Policy', mentions: 289, sentiment: 'neutral', growth: '+12%' },
        { topic: 'Infrastructure', mentions: 267, sentiment: 'positive', growth: '+45%' },
        { topic: 'Education', mentions: 198, sentiment: 'negative', growth: '-8%' },
        { topic: 'Climate', mentions: 176, sentiment: 'neutral', growth: '+5%' },
      ];
    }

    try {
      const response = await axios.get(this.endpoints.data.mentionlytics.trending, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  // Available Keywords for Campaign Setup
  async getAvailableKeywords(): Promise<string[]> {
    if (this.isMockMode) {
      return [
        'Healthcare Reform',
        'Economic Policy',
        'Infrastructure',
        'Education',
        'Climate Change',
        'Immigration',
        'Public Safety',
        'Tax Reform',
        'Social Security',
        'Veterans Affairs',
        'Technology',
        'Rural Development',
        'Urban Planning',
        'Energy Policy',
        'Foreign Policy',
      ];
    }

    try {
      const response = await axios.get(`${this.endpoints.data.mentionlytics.mentions}/keywords`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available keywords:', error);
      // Fallback to trending topics as keywords
      const topics = await this.getTrendingTopics();
      return topics.map((t: any) => t.topic);
    }
  }

  // WebSocket for real-time updates (simulated in mock mode)
  subscribeToLiveFeed(callback: (mention: MentionlyticsMention) => void): () => void {
    if (this.isMockMode) {
      // Simulate live updates every 30-60 seconds (much less frequent)
      const interval = setInterval(
        () => {
          const newMention = generateLiveMention();
          callback(newMention);
        },
        Math.random() * 30000 + 30000 // 30-60 seconds instead of 5-15
      );

      return () => clearInterval(interval);
    }

    // In live mode, would set up WebSocket connection
    // For now, poll the API
    const interval = setInterval(async () => {
      const mentions = await this.getMentionsFeed(1);
      if (mentions.length > 0) {
        callback(mentions[0]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }

  // Crisis Detection
  async getCrisisAlerts(): Promise<any> {
    if (this.isMockMode) {
      return {
        hasActiveCrisis: Math.random() > 0.8,
        alerts: [
          {
            id: '1',
            severity: 'medium',
            topic: 'Negative sentiment spike',
            description: 'Negative mentions increased by 45% in the last hour',
            timestamp: new Date().toISOString(),
            affected_states: ['Pennsylvania', 'Michigan'],
          },
        ],
      };
    }

    try {
      const response = await axios.get(`${this.endpoints.data.mentionlytics.mentions}/crisis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching crisis alerts:', error);
      return { hasActiveCrisis: false, alerts: [] };
    }
  }
}

// Export singleton instance
export const mentionlyticsService = new MentionlyticsService();

// Export mock data for UI component development
export * from './mockData';
