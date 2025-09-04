// Information Center Types
export interface InformationItem {
  id: string;
  category: 'political-news' | 'smart-recommendations' | 'team-alerts';
  title: string;
  text: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deepLink: string;
  actionable: boolean;
  status: 'unread' | 'read' | 'archived';
  metadata?: {
    source?: string;
    tags?: string[];
    assignee?: string;
    relatedItems?: string[];
  };
  icon?: string;
}

export interface InformationFilters {
  category?: 'all' | 'political-news' | 'smart-recommendations' | 'team-alerts';
  priority?: 'all' | 'low' | 'medium' | 'high' | 'critical';
  status?: 'all' | 'unread' | 'read' | 'archived';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  searchTerm?: string;
}

export interface InformationStats {
  total: number;
  unread: number;
  byCategory: {
    'political-news': number;
    'smart-recommendations': number;
    'team-alerts': number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}
