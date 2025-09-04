import React from 'react';
import { CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';

// Get category color for content formats
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'blog':
      return 'blue';
    case 'social':
      return 'green';
    case 'audio-video':
      return 'orange';
    default:
      return 'gray';
  }
};

// Get category background classes
export const getCategoryBgClass = (category: string) => {
  switch (category) {
    case 'blog':
      return 'bg-blue-500/20 border-blue-500/30';
    case 'social':
      return 'bg-green-500/20 border-green-500/30';
    case 'audio-video':
      return 'bg-orange-500/20 border-orange-500/30';
    default:
      return 'bg-gray-500/20 border-gray-500/30';
  }
};

// Get status icon component
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ready':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'in-progress':
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case 'scheduled':
      return <Calendar className="w-4 h-4 text-blue-400" />;
    case 'published':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

// Get status text
export const getStatusText = (status: string) => {
  switch (status) {
    case 'ready':
      return 'Ready ✅';
    case 'in-progress':
      return 'In Progress 🟡';
    case 'scheduled':
      return 'Scheduled 📅';
    case 'published':
      return 'Published 🔴';
    default:
      return 'Unknown';
  }
};

// Platform icons mapping
export const platformIcons = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

// Format week display
export const formatWeekDisplay = (weekOffset: number) => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const weekStart = new Date(baseDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
};
