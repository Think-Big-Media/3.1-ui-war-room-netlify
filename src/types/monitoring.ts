// Real-Time Monitoring Types and Interfaces

export interface Mention {
  id: string;
  username: string;
  platform: 'twitter' | 'facebook' | 'reddit' | 'news';
  content: string;
  timestamp: string;
  engagement: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  region?: string;
  influence: number;
}

export interface TrendingTopic {
  id: string;
  keyword: string;
  change: number;
  mentions: number;
  region: string;
  timeframe: '24h' | '7d';
}

export interface Influencer {
  id: string;
  username: string;
  platform: 'twitter' | 'instagram' | 'tiktok';
  followers: number;
  reach: number;
  lastPost: string;
  engagement: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

export interface PlatformPerformance {
  platform: string;
  percentage: number;
  icon: string;
  color: string;
}

export interface MonitoringFilters {
  source: string;
  sentiment: string;
  region: string;
}

export type Platform = 'twitter' | 'facebook' | 'reddit' | 'news' | 'instagram' | 'tiktok';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type Region = 'District 3' | 'District 7' | 'Statewide' | 'Online';

export interface MonitoringAlert {
  id: string;
  type: 'spike' | 'negative' | 'opportunity';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actionRequired: boolean;
}
