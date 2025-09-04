/**
 * Unified Color Palette for War Room Dashboard
 * Consistent colors that match the navigation and overall theme
 */

// Primary Brand Colors (from navigation)
export const BRAND_COLORS = {
  // Core brand colors - these match our navigation
  orange: '#D97706', // Dashboard Orange (amber-700)
  green: '#4ade80', // Live Monitoring Green (green-400)
  salmon: '#d7484f', // War Room Salmon
  blue: '#60A5FA', // Intelligence Blue (sky-400)
  yellow: '#FACC15', // Alert Center Yellow (yellow-400)
  purple: '#818CF8', // Settings Mauve (violet-400)
  cyan: '#22d3ee', // Cyan accent (cyan-400)
} as const;

// Semantic Colors for Data Visualization
export const SEMANTIC_COLORS = {
  // Positive/Negative/Neutral - softer, more professional
  positive: {
    strong: '#4ade80', // green-400 - matches nav
    medium: '#86efac', // green-300
    light: '#bbf7d0', // green-200
    background: 'rgba(74, 222, 128, 0.1)', // green-400/10
    border: 'rgba(74, 222, 128, 0.3)', // green-400/30
  },
  negative: {
    strong: '#f87171', // red-400 - softer than red-500
    medium: '#fca5a5', // red-300
    light: '#fecaca', // red-200
    background: 'rgba(248, 113, 113, 0.1)', // red-400/10
    border: 'rgba(248, 113, 113, 0.3)', // red-400/30
  },
  neutral: {
    strong: '#9ca3af', // gray-400
    medium: '#d1d5db', // gray-300
    light: '#e5e7eb', // gray-200
    background: 'rgba(156, 163, 175, 0.1)', // gray-400/10
    border: 'rgba(156, 163, 175, 0.3)', // gray-400/30
  },
  warning: {
    strong: '#fb923c', // orange-400 - matches nav orange tone
    medium: '#fdba74', // orange-300
    light: '#fed7aa', // orange-200
    background: 'rgba(251, 146, 60, 0.1)', // orange-400/10
    border: 'rgba(251, 146, 60, 0.3)', // orange-400/30
  },
} as const;

// Status Colors
export const STATUS_COLORS = {
  live: '#4ade80', // green-400
  breaking: '#f87171', // red-400 (softer than harsh red)
  trending: '#60A5FA', // blue-400
  new: '#FACC15', // yellow-400
  mock: '#fbbf24', // yellow-400
} as const;

// Map Sentiment Color Scale (for d3-scale)
export const MAP_SENTIMENT_COLORS = [
  '#dc2626', // red-600 - very negative
  '#f87171', // red-400 - negative
  '#9ca3af', // gray-400 - neutral
  '#4ade80', // green-400 - positive
  '#22c55e', // green-500 - very positive
] as const;

// Tailwind Class Names for consistency
export const COLOR_CLASSES = {
  positive: {
    text: 'text-green-400',
    bg: 'bg-green-400',
    bgLight: 'bg-green-400/20',
    border: 'border-green-400/30',
  },
  negative: {
    text: 'text-red-400',
    bg: 'bg-red-400',
    bgLight: 'bg-red-400/20',
    border: 'border-red-400/30',
  },
  neutral: {
    text: 'text-gray-400',
    bg: 'bg-gray-400',
    bgLight: 'bg-gray-400/20',
    border: 'border-gray-400/30',
  },
  warning: {
    text: 'text-orange-400',
    bg: 'bg-orange-400',
    bgLight: 'bg-orange-400/20',
    border: 'border-orange-400/30',
  },
  info: {
    text: 'text-blue-400',
    bg: 'bg-blue-400',
    bgLight: 'bg-blue-400/20',
    border: 'border-blue-400/30',
  },
  live: {
    text: 'text-green-400',
    bg: 'bg-green-400',
    bgLight: 'bg-green-400/20',
    border: 'border-green-400/30',
  },
  breaking: {
    text: 'text-red-400',
    bg: 'bg-red-400',
    bgLight: 'bg-red-400/20',
    border: 'border-red-400/30',
  },
  mock: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-400',
    bgLight: 'bg-yellow-400/20',
    border: 'border-yellow-400/30',
  },
} as const;

// Helper function to get sentiment color classes
export function getSentimentColorClasses(sentiment: 'positive' | 'negative' | 'neutral') {
  return COLOR_CLASSES[sentiment];
}

// Helper function to get status color classes
export function getStatusColorClasses(status: 'live' | 'breaking' | 'mock') {
  return COLOR_CLASSES[status];
}
