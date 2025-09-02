/**
 * Mock data matching Mentionlytics API structure
 * Use this for UI development before connecting real API
 */

export interface MentionlyticsSentiment {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  period: string;
}

export interface MentionlyticsLocation {
  state: string;
  mentions: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topKeywords: string[];
}

export interface MentionlyticsMention {
  id: string;
  text: string;
  author: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'news' | 'blog';
  sentiment: 'positive' | 'negative' | 'neutral';
  reach: number;
  engagement: number;
  timestamp: string;
  url: string;
  location?: string;
}

export interface MentionlyticsInfluencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  engagement_rate: number;
  avatar?: string;
}

export interface ShareOfVoiceData {
  brand: string;
  percentage: number;
  mentions: number;
  reach: number;
  engagement: number;
}

// Mock Sentiment Data - Based on your Mentionlytics trial data
export const mockSentimentData: MentionlyticsSentiment = {
  positive: 341,
  negative: 504,
  neutral: 194,
  total: 1039,
  period: '7days',
};

// Mock Geographic Data (US Swing States)
export const mockGeographicData: MentionlyticsLocation[] = [
  {
    state: 'Pennsylvania',
    mentions: 156,
    sentiment: { positive: 67, negative: 52, neutral: 37 },
    topKeywords: ['economy', 'healthcare', 'jobs'],
  },
  {
    state: 'Michigan',
    mentions: 142,
    sentiment: { positive: 45, negative: 68, neutral: 29 },
    topKeywords: ['manufacturing', 'auto', 'economy'],
  },
  {
    state: 'Wisconsin',
    mentions: 98,
    sentiment: { positive: 34, negative: 41, neutral: 23 },
    topKeywords: ['dairy', 'agriculture', 'healthcare'],
  },
  {
    state: 'Arizona',
    mentions: 121,
    sentiment: { positive: 58, negative: 39, neutral: 24 },
    topKeywords: ['immigration', 'water', 'economy'],
  },
  {
    state: 'Georgia',
    mentions: 189,
    sentiment: { positive: 92, negative: 61, neutral: 36 },
    topKeywords: ['voting', 'economy', 'infrastructure'],
  },
  {
    state: 'Nevada',
    mentions: 76,
    sentiment: { positive: 28, negative: 31, neutral: 17 },
    topKeywords: ['tourism', 'gaming', 'economy'],
  },
  {
    state: 'Florida',
    mentions: 234,
    sentiment: { positive: 89, negative: 98, neutral: 47 },
    topKeywords: ['insurance', 'climate', 'economy'],
  },
  {
    state: 'North Carolina',
    mentions: 145,
    sentiment: { positive: 62, negative: 53, neutral: 30 },
    topKeywords: ['tech', 'education', 'healthcare'],
  },
  {
    state: 'Ohio',
    mentions: 167,
    sentiment: { positive: 71, negative: 66, neutral: 30 },
    topKeywords: ['manufacturing', 'energy', 'jobs'],
  },
  {
    state: 'Texas',
    mentions: 298,
    sentiment: { positive: 134, negative: 112, neutral: 52 },
    topKeywords: ['energy', 'border', 'tech'],
  },
];

// Mock Live Feed - Mix of political content
export const mockMentionsFeed: MentionlyticsMention[] = [
  {
    id: '1',
    text: 'Great leadership shown on healthcare reform! This is exactly what Pennsylvania needs.',
    author: 'John Smith',
    platform: 'twitter',
    sentiment: 'positive',
    reach: 15420,
    engagement: 342,
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    url: 'https://twitter.com/example/1',
    location: 'Pennsylvania',
  },
  {
    id: '2',
    text: 'Disappointed with the recent policy decisions. Michigan deserves better solutions.',
    author: 'Sarah Johnson',
    platform: 'facebook',
    sentiment: 'negative',
    reach: 8930,
    engagement: 189,
    timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
    url: 'https://facebook.com/example/2',
    location: 'Michigan',
  },
  {
    id: '3',
    text: "Interesting perspective on economic policy shared in today's press conference.",
    author: 'News Channel 5',
    platform: 'news',
    sentiment: 'neutral',
    reach: 45000,
    engagement: 782,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    url: 'https://news.example.com/article/3',
    location: 'Georgia',
  },
  {
    id: '4',
    text: 'The infrastructure plan is a game-changer for Arizona! #Progress',
    author: 'Mike Davis',
    platform: 'instagram',
    sentiment: 'positive',
    reach: 6750,
    engagement: 423,
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    url: 'https://instagram.com/p/example4',
    location: 'Arizona',
  },
  {
    id: '5',
    text: 'Analysis: Mixed reactions to the new budget proposal across party lines in Wisconsin.',
    author: 'Political Blog Daily',
    platform: 'blog',
    sentiment: 'neutral',
    reach: 12300,
    engagement: 156,
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    url: 'https://blog.example.com/post/5',
    location: 'Wisconsin',
  },
];

// Mock Influencers - Political figures and media
export const mockInfluencers: MentionlyticsInfluencer[] = [
  {
    id: '1',
    name: 'Political Analyst Pro',
    handle: '@politicalanalyst',
    platform: 'twitter',
    followers: 125000,
    mentions: 45,
    sentiment: 'positive',
    engagement_rate: 4.2,
  },
  {
    id: '2',
    name: 'News Network PA',
    handle: 'newsnetworkpa',
    platform: 'facebook',
    followers: 890000,
    mentions: 38,
    sentiment: 'neutral',
    engagement_rate: 2.8,
  },
  {
    id: '3',
    name: 'Grassroots Movement',
    handle: '@grassroots_us',
    platform: 'twitter',
    followers: 45000,
    mentions: 67,
    sentiment: 'positive',
    engagement_rate: 6.5,
  },
  {
    id: '4',
    name: 'Opposition Voice',
    handle: '@oppositionvoice',
    platform: 'twitter',
    followers: 78000,
    mentions: 52,
    sentiment: 'negative',
    engagement_rate: 5.1,
  },
  {
    id: '5',
    name: 'Local Michigan News',
    handle: 'localnews_mi',
    platform: 'instagram',
    followers: 234000,
    mentions: 29,
    sentiment: 'neutral',
    engagement_rate: 3.7,
  },
  {
    id: '6',
    name: 'Policy Expert',
    handle: '@policy_expert',
    platform: 'twitter',
    followers: 67000,
    mentions: 41,
    sentiment: 'positive',
    engagement_rate: 4.8,
  },
  {
    id: '7',
    name: 'Youth Activist Network',
    handle: '@youth_activist',
    platform: 'instagram',
    followers: 156000,
    mentions: 33,
    sentiment: 'mixed',
    engagement_rate: 7.2,
  },
  {
    id: '8',
    name: 'Economic Forum',
    handle: 'econ_forum',
    platform: 'facebook',
    followers: 445000,
    mentions: 28,
    sentiment: 'neutral',
    engagement_rate: 2.3,
  },
];

// Mock Share of Voice - Campaign comparison
export const mockShareOfVoice: ShareOfVoiceData[] = [
  {
    brand: 'Jack Ciattarelli',
    percentage: 35,
    mentions: 2847,
    reach: 1234000,
    engagement: 45678,
  },
  {
    brand: 'Mikie Sherrill',
    percentage: 28,
    mentions: 2276,
    reach: 987000,
    engagement: 34567,
  },
  {
    brand: 'Josh Gottheimer',
    percentage: 22,
    mentions: 1789,
    reach: 756000,
    engagement: 28901,
  },
  {
    brand: 'Others',
    percentage: 15,
    mentions: 1220,
    reach: 523000,
    engagement: 19876,
  },
];

// Mock sentiment trend data (last 7 days)
export const mockSentimentTrend = [
  { date: '2025-08-25', positive: 45, negative: 38, neutral: 17 },
  { date: '2025-08-26', positive: 52, negative: 35, neutral: 13 },
  { date: '2025-08-27', positive: 48, negative: 42, neutral: 10 },
  { date: '2025-08-28', positive: 56, negative: 32, neutral: 12 },
  { date: '2025-08-29', positive: 61, negative: 29, neutral: 10 },
  { date: '2025-08-30', positive: 43, negative: 45, neutral: 12 },
  { date: '2025-08-31', positive: 49, negative: 36, neutral: 15 },
];

// Helper function to generate real-time updates
export function generateLiveMention(): MentionlyticsMention {
  const platforms: MentionlyticsMention['platform'][] = [
    'twitter',
    'facebook',
    'instagram',
    'news',
    'blog',
  ];
  const states = [
    'Pennsylvania',
    'Michigan',
    'Wisconsin',
    'Arizona',
    'Georgia',
    'Nevada',
    'Florida',
    'Ohio',
    'North Carolina',
  ];

  const templates = [
    { text: 'Great job on the recent policy announcement! #Leadership', sentiment: 'positive' },
    { text: "Concerned about the direction we're heading. Need change.", sentiment: 'negative' },
    { text: "Interesting developments in today's press conference.", sentiment: 'neutral' },
    { text: 'This is exactly the leadership we need! #Progress', sentiment: 'positive' },
    { text: 'Not impressed with the latest decisions. Disappointing.', sentiment: 'negative' },
    { text: 'Following the campaign with interest. Time will tell.', sentiment: 'neutral' },
    { text: 'Strong stance on healthcare! Finally someone who gets it.', sentiment: 'positive' },
    { text: 'The economic policy needs serious reconsideration.', sentiment: 'negative' },
    { text: 'Campaign rally scheduled for next week in town.', sentiment: 'neutral' },
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: Date.now().toString(),
    text: template.text,
    author: `User${Math.floor(Math.random() * 1000)}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    sentiment: template.sentiment as MentionlyticsMention['sentiment'],
    reach: Math.floor(Math.random() * 50000) + 1000,
    engagement: Math.floor(Math.random() * 1000) + 10,
    timestamp: new Date().toISOString(),
    url: 'https://example.com/' + Date.now(),
    location: states[Math.floor(Math.random() * states.length)],
  };
}

// Generate mock crisis alert
export function generateCrisisAlert() {
  const severities = ['low', 'medium', 'high', 'critical'];
  const topics = [
    'Negative sentiment spike detected',
    'Misinformation spreading rapidly',
    'Competitor attack campaign identified',
    'Viral negative post gaining traction',
    'Media criticism intensifying',
  ];

  return {
    id: Date.now().toString(),
    severity: severities[Math.floor(Math.random() * severities.length)],
    topic: topics[Math.floor(Math.random() * topics.length)],
    description: `Alert: Unusual activity detected in social media mentions`,
    timestamp: new Date().toISOString(),
    affected_states: ['Pennsylvania', 'Michigan'].slice(0, Math.floor(Math.random() * 2) + 1),
    recommended_action: 'Review and respond to trending topics immediately',
  };
}
