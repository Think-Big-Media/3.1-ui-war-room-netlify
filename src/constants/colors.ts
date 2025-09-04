/**
 * Centralized color constants for War Room UI
 * Using modern Tailwind CSS color tokens for consistency
 */

export const COLORS = {
  // Sentiment colors - used across sentiment analysis
  sentiment: {
    positive: 'emerald-400',
    positiveHover: 'emerald-500',
    positiveBg: 'emerald-400/20',
    negative: 'rose-400',
    negativeHover: 'rose-500',
    negativeBg: 'rose-400/20',
    neutral: 'slate-400',
    neutralHover: 'slate-500',
    neutralBg: 'slate-400/20',
  },

  // Data mode indicators
  status: {
    mock: 'amber-400',
    mockBg: 'amber-400/20',
    mockBorder: 'amber-400/30',
    mockText: 'amber-400/80',
    live: 'emerald-400',
    liveBg: 'emerald-400/20',
    liveBorder: 'emerald-400/30',
    liveText: 'emerald-400',
    error: 'rose-400',
    errorBg: 'rose-400/20',
    errorBorder: 'rose-400/30',
  },

  // Metrics and data visualization
  metrics: {
    primary: 'sky-400',
    primaryHover: 'sky-500',
    primaryBg: 'sky-400/20',
    secondary: 'violet-400',
    secondaryHover: 'violet-500',
    secondaryBg: 'violet-400/20',
    warning: 'amber-400',
    warningHover: 'amber-500',
    warningBg: 'amber-400/20',
    success: 'emerald-400',
    successHover: 'emerald-500',
    successBg: 'emerald-400/20',
  },

  // Platform-specific colors
  platforms: {
    twitter: 'sky-400',
    facebook: 'blue-500',
    instagram: 'pink-400',
    linkedin: 'blue-600',
    tiktok: 'rose-400',
    youtube: 'red-500',
  },

  // Emotion analysis colors
  emotions: {
    joy: 'amber-400',
    trust: 'sky-400',
    fear: 'violet-400',
    anger: 'rose-400',
    sadness: 'blue-400',
    surprise: 'orange-400',
    disgust: 'green-600',
  },
} as const;

// Helper function to get Tailwind class names
export const getColorClass = (color: string, prefix: 'bg' | 'text' | 'border' = 'text') => {
  return `${prefix}-${color}`;
};

// Type-safe color getter
export type ColorCategory = keyof typeof COLORS;
export type SentimentColor = keyof typeof COLORS.sentiment;
export type StatusColor = keyof typeof COLORS.status;
export type MetricColor = keyof typeof COLORS.metrics;
export type PlatformColor = keyof typeof COLORS.platforms;
export type EmotionColor = keyof typeof COLORS.emotions;
