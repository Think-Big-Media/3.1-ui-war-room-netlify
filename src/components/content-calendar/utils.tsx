import React from 'react';
import {
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  CheckCircle,
  Clock,
  Edit3,
} from 'lucide-react';
import { type ContentCard, type DayColumn } from '../../types/calendar';

// Get platform icon
export const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'instagram':
      return Instagram;
    case 'twitter':
      return Twitter;
    case 'linkedin':
      return Linkedin;
    case 'facebook':
      return Facebook;
    case 'youtube':
      return Youtube;
    default:
      return Instagram;
  }
};

// Get platform color
export const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'instagram':
      return 'bg-gradient-to-r from-purple-600 to-pink-600';
    case 'twitter':
      return 'bg-gradient-to-r from-blue-400 to-blue-600';
    case 'linkedin':
      return 'bg-gradient-to-r from-blue-700 to-blue-900';
    case 'facebook':
      return 'bg-gradient-to-r from-blue-600 to-blue-800';
    case 'youtube':
      return 'bg-gradient-to-r from-red-600 to-red-800';
    default:
      return 'bg-gradient-to-r from-gray-600 to-gray-800';
  }
};

// Get status icon
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'published':
      return <CheckCircle className="w-3 h-3 text-green-300" />;
    case 'scheduled':
      return <Clock className="w-3 h-3 text-yellow-300" />;
    case 'draft':
      return <Edit3 className="w-3 h-3 text-gray-300" />;
    default:
      return null;
  }
};

// Generate week data
export const generateWeekData = (currentWeek: number, content: ContentCard[]): DayColumn[] => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + currentWeek * 7);

  const weekData: DayColumn[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);

    weekData.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[i],
      dayNumber: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      content: i === 0 || i === 3 || i === 5 ? content : [], // Sample distribution
    });
  }

  return weekData;
};

// Generate month data
export const generateMonthData = (): number[] => {
  const monthData: number[] = [];
  for (let i = 0; i < 35; i++) {
    if (i >= 3 && i <= 33) {
      monthData.push(i - 2);
    } else {
      monthData.push(0);
    }
  }
  return monthData;
};

// Format month name
export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Format week range
export const formatWeekRange = (weekOffset: number): string => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
};
