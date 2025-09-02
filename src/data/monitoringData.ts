// Real-Time Monitoring Mock Data

import {
  type Mention,
  type TrendingTopic,
  type Influencer,
  type SentimentData,
  type PlatformPerformance,
} from '../types/monitoring';

export const mockMentions: Mention[] = [
  {
    id: '1',
    username: '@voter_voice_23',
    platform: 'twitter',
    content:
      'Just saw the latest debate performance - really impressed with the healthcare policy stance. Finally someone who gets it! #Healthcare #Politics',
    timestamp: '2m ago',
    engagement: 145,
    sentiment: 'positive',
    region: 'District 3',
    influence: 72,
  },
  {
    id: '2',
    username: 'LocalNewsDaily',
    platform: 'news',
    content:
      "Breaking: New polling data shows significant shift in voter preferences following last week's town hall event...",
    timestamp: '15m ago',
    engagement: 2890,
    sentiment: 'neutral',
    region: 'Statewide',
    influence: 94,
  },
  {
    id: '3',
    username: '@concerned_citizen',
    platform: 'facebook',
    content:
      "Not convinced by the education policy promises. We've heard this before. Show us the concrete plan! #Education #Accountability",
    timestamp: '32m ago',
    engagement: 78,
    sentiment: 'negative',
    region: 'District 7',
    influence: 45,
  },
  {
    id: '4',
    username: 'u/political_analyst',
    platform: 'reddit',
    content:
      "Interesting analysis of the opponent's voting record - there are some real inconsistencies here that voters should know about.",
    timestamp: '1h ago',
    engagement: 324,
    sentiment: 'neutral',
    region: 'Online',
    influence: 63,
  },
];

export const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    keyword: 'Healthcare',
    change: 45,
    mentions: 2847,
    region: 'District 3',
    timeframe: '24h',
  },
  {
    id: '2',
    keyword: 'Education',
    change: -12,
    mentions: 1923,
    region: 'Statewide',
    timeframe: '24h',
  },
  {
    id: '3',
    keyword: 'Economy',
    change: 23,
    mentions: 3456,
    region: 'District 7',
    timeframe: '7d',
  },
  {
    id: '4',
    keyword: 'Infrastructure',
    change: 67,
    mentions: 1234,
    region: 'District 3',
    timeframe: '24h',
  },
];

export const mockInfluencers: Influencer[] = [
  {
    id: '1',
    username: '@political_insider',
    platform: 'twitter',
    followers: 45000,
    reach: 89,
    lastPost: '3h ago',
    engagement: 2.4,
    sentiment: 'positive',
  },
  {
    id: '2',
    username: '@local_voice',
    platform: 'instagram',
    followers: 12000,
    reach: 67,
    lastPost: '1h ago',
    engagement: 4.2,
    sentiment: 'neutral',
  },
  {
    id: '3',
    username: '@youth_advocate',
    platform: 'tiktok',
    followers: 78000,
    reach: 93,
    lastPost: '30m ago',
    engagement: 6.8,
    sentiment: 'positive',
  },
];

export const mockSentimentData: SentimentData = {
  positive: 74,
  neutral: 18,
  negative: 8,
};

export const mockPlatformPerformance: PlatformPerformance[] = [
  {
    platform: 'Twitter',
    percentage: 45,
    icon: 'MessageSquare',
    color: 'platform-social',
  },
  {
    platform: 'Facebook',
    percentage: 28,
    icon: 'Users',
    color: 'platform-social',
  },
  {
    platform: 'Reddit',
    percentage: 15,
    icon: 'Globe',
    color: 'platform-forum',
  },
  {
    platform: 'News',
    percentage: 12,
    icon: 'BarChart3',
    color: 'platform-news',
  },
];
