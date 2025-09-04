// Real-Time Monitoring Utility Functions

import React from 'react';
import {
  MessageSquare,
  Users,
  Globe,
  BarChart3,
  Eye,
  Play,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from 'lucide-react';

import { type Platform, type Sentiment } from '../../types/monitoring';

// Platform icon utilities
export const getPlatformIcon = (platform: Platform) => {
  switch (platform) {
    case 'twitter':
      return <MessageSquare className="w-4 h-4 text-blue-400" />;
    case 'facebook':
      return <Users className="w-4 h-4 text-blue-600" />;
    case 'reddit':
      return <Globe className="w-4 h-4 text-orange-500" />;
    case 'news':
      return <BarChart3 className="w-4 h-4 text-green-500" />;
    case 'instagram':
      return <Eye className="w-4 h-4 text-pink-500" />;
    case 'tiktok':
      return <Play className="w-4 h-4 text-purple-500" />;
    default:
      return <MessageSquare className="w-4 h-4 text-gray-400" />;
  }
};

// Sentiment color utilities
export const getSentimentColor = (sentiment: Sentiment): string => {
  switch (sentiment) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    case 'neutral':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

// Sentiment icon utilities
export const getSentimentIcon = (sentiment: Sentiment) => {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    case 'neutral':
      return <MoreHorizontal className="w-4 h-4 text-gray-400" />;
    default:
      return <MoreHorizontal className="w-4 h-4 text-gray-400" />;
  }
};

// Trend change color utility
export const getTrendColor = (change: number): string => {
  return change > 0 ? 'text-green-400' : 'text-red-400';
};

// Format number with thousands separator
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Get sentiment percentage width for progress bars
export const getSentimentWidth = (percentage: number): string => {
  if (percentage >= 75) {
    return 'w-3/4';
  }
  if (percentage >= 50) {
    return 'w-1/2';
  }
  if (percentage >= 25) {
    return 'w-1/4';
  }
  if (percentage >= 20) {
    return 'w-1/5';
  }
  if (percentage >= 12) {
    return 'w-1/12';
  }
  return 'w-0';
};
