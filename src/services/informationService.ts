import {
  type InformationItem,
  type InformationFilters,
  type InformationStats,
} from '../types/information';

// Mock data generators
const generatePoliticalNews = (): InformationItem[] => [
  {
    id: 'pn-1',
    category: 'political-news',
    title: 'Healthcare Policy Debate',
    text: 'New healthcare legislation gaining bipartisan support in Congress',
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    priority: 'high',
    deepLink: '/real-time-monitoring?filter=healthcare',
    actionable: true,
    status: 'unread',
    metadata: {
      source: 'Political Wire',
      tags: ['healthcare', 'congress', 'bipartisan'],
    },
    icon: 'Globe',
  },
  {
    id: 'pn-2',
    category: 'political-news',
    title: 'Election Security Update',
    text: 'New voter registration systems implemented in 5 swing states',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    priority: 'medium',
    deepLink: '/real-time-monitoring?filter=election-security',
    actionable: false,
    status: 'unread',
    metadata: {
      source: 'Election News',
      tags: ['election', 'security', 'swing-states'],
    },
    icon: 'Shield',
  },
  {
    id: 'pn-3',
    category: 'political-news',
    title: 'Economic Policy Shift',
    text: 'Federal Reserve signals potential interest rate changes affecting campaign messaging',
    timestamp: new Date(Date.now() - 2700000).toISOString(), // 45 min ago
    priority: 'medium',
    deepLink: '/real-time-monitoring?filter=economy',
    actionable: true,
    status: 'read',
    metadata: {
      source: 'Economic Times',
      tags: ['economy', 'federal-reserve', 'messaging'],
    },
    icon: 'DollarSign',
  },
];

const generateSmartRecommendations = (): InformationItem[] => [
  {
    id: 'sr-1',
    category: 'smart-recommendations',
    title: 'Optimize Healthcare Messaging',
    text: 'Suburban voters respond 35% better to healthcare messaging on weekends - schedule more content',
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    priority: 'high',
    deepLink: '/campaign-control?project=healthcare-messaging',
    actionable: true,
    status: 'unread',
    metadata: {
      tags: ['healthcare', 'messaging', 'suburban', 'optimization'],
    },
    icon: 'Target',
  },
  {
    id: 'sr-2',
    category: 'smart-recommendations',
    title: 'Increase Video Content',
    text: 'Video testimonials showing 3x higher engagement - consider creating more video content',
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
    priority: 'medium',
    deepLink: '/campaign-control?tab=assets&filter=video',
    actionable: true,
    status: 'unread',
    metadata: {
      tags: ['video', 'testimonials', 'engagement'],
    },
    icon: 'Video',
  },
  {
    id: 'sr-3',
    category: 'smart-recommendations',
    title: 'Budget Reallocation Opportunity',
    text: 'District 3 ads underperforming - consider reallocating 15% budget to District 7',
    timestamp: new Date(Date.now() - 2100000).toISOString(), // 35 min ago
    priority: 'high',
    deepLink: '/campaign-control?tab=projects&filter=budget',
    actionable: true,
    status: 'unread',
    metadata: {
      tags: ['budget', 'districts', 'performance', 'reallocation'],
    },
    icon: 'DollarSign',
  },
];

const generateTeamAlerts = (): InformationItem[] => [
  {
    id: 'ta-1',
    category: 'team-alerts',
    title: 'Crisis Response Needed',
    text: 'Opposition attack ad trending - immediate response required',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    priority: 'critical',
    deepLink: '/alert-center?alert=ta-1',
    actionable: true,
    status: 'unread',
    metadata: {
      assignee: 'Communications Team',
      tags: ['crisis', 'response', 'urgent'],
    },
    icon: 'AlertCircle',
  },
  {
    id: 'ta-2',
    category: 'team-alerts',
    title: 'New Volunteer Sign-ups',
    text: 'Sarah Chen: 47 new volunteers registered in District 3',
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    priority: 'medium',
    deepLink: '/campaign-control?tab=activity&user=sarah-chen',
    actionable: false,
    status: 'unread',
    metadata: {
      assignee: 'Sarah Chen',
      tags: ['volunteers', 'district-3', 'registration'],
    },
    icon: 'Users',
  },
  {
    id: 'ta-3',
    category: 'team-alerts',
    title: 'Content Calendar Updated',
    text: 'Mike Rodriguez: Healthcare policy video scheduled for tomorrow 2 PM',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    priority: 'low',
    deepLink: '/campaign-control?tab=activity&user=mike-rodriguez',
    actionable: false,
    status: 'read',
    metadata: {
      assignee: 'Mike Rodriguez',
      tags: ['content', 'healthcare', 'video'],
    },
    icon: 'Calendar',
  },
];

// Main service class
export class InformationService {
  private static instance: InformationService;
  private items: InformationItem[] = [];

  private constructor() {
    this.refreshData();
  }

  static getInstance(): InformationService {
    if (!InformationService.instance) {
      InformationService.instance = new InformationService();
    }
    return InformationService.instance;
  }

  refreshData(): void {
    this.items = [
      ...generatePoliticalNews(),
      ...generateSmartRecommendations(),
      ...generateTeamAlerts(),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getItems(filters?: InformationFilters): InformationItem[] {
    let filteredItems = [...this.items];

    if (filters?.category && filters.category !== 'all') {
      filteredItems = filteredItems.filter((item) => item.category === filters.category);
    }

    if (filters?.priority && filters.priority !== 'all') {
      filteredItems = filteredItems.filter((item) => item.priority === filters.priority);
    }

    if (filters?.status && filters.status !== 'all') {
      filteredItems = filteredItems.filter((item) => item.status === filters.status);
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.text.toLowerCase().includes(searchLower) ||
          item.metadata?.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filteredItems = filteredItems.filter((item) => new Date(item.timestamp) >= cutoff);
    }

    return filteredItems;
  }

  getStats(): InformationStats {
    const total = this.items.length;
    const unread = this.items.filter((item) => item.status === 'unread').length;

    const byCategory = {
      'political-news': this.items.filter((item) => item.category === 'political-news').length,
      'smart-recommendations': this.items.filter(
        (item) => item.category === 'smart-recommendations'
      ).length,
      'team-alerts': this.items.filter((item) => item.category === 'team-alerts').length,
    };

    const byPriority = {
      low: this.items.filter((item) => item.priority === 'low').length,
      medium: this.items.filter((item) => item.priority === 'medium').length,
      high: this.items.filter((item) => item.priority === 'high').length,
      critical: this.items.filter((item) => item.priority === 'critical').length,
    };

    return { total, unread, byCategory, byPriority };
  }

  markAsRead(id: string): void {
    const item = this.items.find((item) => item.id === id);
    if (item) {
      item.status = 'read';
    }
  }

  markAllAsRead(category?: string): void {
    this.items.forEach((item) => {
      if (!category || item.category === category) {
        item.status = 'read';
      }
    });
  }

  getItemById(id: string): InformationItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  // For ticker tape - get mixed recent items
  getTickerItems(limit = 10): InformationItem[] {
    return this.items.slice(0, limit);
  }

  // Get team alerts for bell notification
  getTeamAlerts(): InformationItem[] {
    return this.items.filter((item) => item.category === 'team-alerts');
  }
}

// Export singleton instance
export const informationService = InformationService.getInstance();
