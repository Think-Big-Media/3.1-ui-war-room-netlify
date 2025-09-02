// Content Calendar types
export interface ContentCard {
  id: string;
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube';
  content: string;
  time: string;
  status: 'published' | 'scheduled' | 'draft';
  type: 'post' | 'story' | 'reel' | 'video';
  engagement?: number;
}

export interface TimeSlot {
  hour: number;
  label: string;
}

export interface DayColumn {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  content: ContentCard[];
}

export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarStats {
  totalPosts: number;
  scheduled: number;
  published: number;
  engagement: number;
}
