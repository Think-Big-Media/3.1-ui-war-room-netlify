/**
 * Unified Information Routing System
 * Routes 5 types of information to appropriate dashboard components
 */

import React from 'react';
import { mentionlyticsService } from './mentionlytics/mentionlyticsService';
import { getEnvironmentConfig } from '../config/apiConfig';
import OpenAI from 'openai';
import { safeParseJSON } from '../utils/localStorage';
import { CampaignSetupData, CampaignCompetitor, defaultCampaignData } from '../types/campaign';

// Information Types
export enum InfoType {
  GENERAL = 'general', // General news → Ticker
  KEYWORDS = 'keywords', // Keyword mentions → PhraseCloud + Ticker
  ACCOUNT = 'account', // Account activity → Dashboard KPIs
  CRISIS = 'crisis', // Alerts → Alert Center + Notifications
  STRATEGIC = 'strategic', // SWOT items → SWOT Radar + Intelligence Feed
}

// Information Priority Levels
export enum Priority {
  CRITICAL = 1, // Immediate action required
  HIGH = 2, // Important, address soon
  MEDIUM = 3, // Standard priority
  LOW = 4, // Background information
  INFO = 5, // FYI only
}

// Base Information Item
export interface InfoItem {
  id: string;
  type: InfoType;
  priority: Priority;
  title: string;
  content: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  swotCategory?: 'strength' | 'weakness' | 'opportunity' | 'threat';
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
  location?: string;
  reach?: number;
  engagement?: number;
}

// Routing destinations
export interface RouteDestination {
  component: string;
  updateMethod: string;
  priority: number;
}

// OpenAI client for classification
const config = getEnvironmentConfig();
const openai = config.openai.apiKey
  ? new OpenAI({
      apiKey: config.openai.apiKey,
      dangerouslyAllowBrowser: true, // For development only
    })
  : null;

export class InformationRouter {
  private static instance: InformationRouter;
  private subscribers: Map<string, Set<(item: InfoItem) => void>> = new Map();
  private queue: InfoItem[] = [];
  private processing = false;
  private processedItems: InfoItem[] = []; // Store processed items for retrieval

  private constructor() {
    // Start processing loop
    this.startProcessing();

    // Seed with initial data after a short delay
    setTimeout(() => this.seedInitialData(), 1000);
  }

  // Seed with initial mock data
  private async seedInitialData() {
    const initialItems = [
      {
        type: InfoType.KEYWORDS,
        content: 'Healthcare reform gaining momentum in swing states',
        source: 'Twitter',
        sentiment: 'positive' as const,
        priority: Priority.HIGH,
        reach: 15000,
      },
      {
        type: InfoType.CRISIS,
        content: 'Negative campaign ad targeting our education policy',
        source: 'Facebook',
        sentiment: 'negative' as const,
        priority: Priority.CRITICAL,
        reach: 45000,
      },
      {
        type: InfoType.STRATEGIC,
        content: 'Opportunity: Youth voter registration up 23% in key districts',
        source: 'News',
        sentiment: 'positive' as const,
        priority: Priority.HIGH,
        reach: 8000,
      },
      {
        type: InfoType.GENERAL,
        content: 'Economic indicators show positive trend ahead of election',
        source: 'Reuters',
        sentiment: 'neutral' as const,
        priority: Priority.MEDIUM,
        reach: 25000,
      },
      {
        type: InfoType.ACCOUNT,
        content: 'Campaign fundraising surpasses Q3 goals by 15%',
        source: 'Internal',
        sentiment: 'positive' as const,
        priority: Priority.MEDIUM,
        reach: 5000,
      },
    ];

    for (const item of initialItems) {
      await this.processInformation(item);
    }
  }

  static getInstance(): InformationRouter {
    if (!InformationRouter.instance) {
      InformationRouter.instance = new InformationRouter();
    }
    return InformationRouter.instance;
  }

  // Subscribe to specific information types
  subscribe(destination: string, callback: (item: InfoItem) => void) {
    if (!this.subscribers.has(destination)) {
      this.subscribers.set(destination, new Set());
    }
    this.subscribers.get(destination)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(destination)?.delete(callback);
    };
  }

  // Route information based on type and content
  async routeInformation(item: InfoItem) {
    // Add to queue for processing
    this.queue.push(item);
  }

  // Process queued items
  private async startProcessing() {
    setInterval(async () => {
      if (this.processing || this.queue.length === 0) return;

      this.processing = true;
      const batch = this.queue.splice(0, 10); // Process up to 10 items at once

      for (const item of batch) {
        await this.processItem(item);
      }

      this.processing = false;
    }, 1000); // Process every second
  }

  // Process individual item
  private async processItem(item: InfoItem) {
    // Classify if needed
    if (!item.swotCategory && item.type === InfoType.KEYWORDS) {
      item.swotCategory = await this.classifySWOT(item);
    }

    // Store processed item
    this.processedItems.unshift(item);
    // Keep only last 100 items
    if (this.processedItems.length > 100) {
      this.processedItems = this.processedItems.slice(0, 100);
    }

    // Determine routing based on type
    const routes = this.determineRoutes(item);

    // Send to each destination
    for (const route of routes) {
      this.sendToDestination(route, item);
    }
  }

  // Classify mention into SWOT category using OpenAI
  private async classifySWOT(
    item: InfoItem
  ): Promise<'strength' | 'weakness' | 'opportunity' | 'threat'> {
    if (!openai) {
      // Fallback classification based on sentiment
      if (item.sentiment === 'positive') {
        return item.source.includes('competitor') ? 'opportunity' : 'strength';
      } else if (item.sentiment === 'negative') {
        return item.source.includes('competitor') ? 'threat' : 'weakness';
      }
      return 'opportunity';
    }

    try {
      const campaignData = safeParseJSON<CampaignSetupData>('warRoomCampaignSetup', {
        fallback: defaultCampaignData,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a political campaign strategist. Classify mentions into SWOT categories.
            Campaign: ${campaignData?.candidateName || 'Unknown'}
            Competitors: ${campaignData?.competitors?.map((c: CampaignCompetitor) => c.name).join(', ') || 'Unknown'}`,
          },
          {
            role: 'user',
            content: `Classify this mention:
            Text: "${item.content}"
            Sentiment: ${item.sentiment}
            Source: ${item.source}
            
            Return only one word: strength, weakness, opportunity, or threat`,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const category = response.choices[0].message.content?.toLowerCase().trim();
      if (['strength', 'weakness', 'opportunity', 'threat'].includes(category as string)) {
        return category as 'strength' | 'weakness' | 'opportunity' | 'threat';
      }
    } catch (error) {
      console.error('OpenAI classification failed:', error);
    }

    // Fallback
    return 'opportunity';
  }

  // Determine where to route information
  private determineRoutes(item: InfoItem): RouteDestination[] {
    const routes: RouteDestination[] = [];

    switch (item.type) {
      case InfoType.GENERAL:
        routes.push({ component: 'TickerTape', updateMethod: 'addItem', priority: 1 });
        break;

      case InfoType.KEYWORDS:
        routes.push({ component: 'PhraseCloud', updateMethod: 'updatePhrase', priority: 1 });
        routes.push({ component: 'TickerTape', updateMethod: 'addItem', priority: 2 });
        if (item.swotCategory) {
          routes.push({ component: 'SWOTRadar', updateMethod: 'addPoint', priority: 1 });
        }
        if (item.location) {
          routes.push({ component: 'PoliticalMap', updateMethod: 'updateState', priority: 2 });
        }
        break;

      case InfoType.ACCOUNT:
        routes.push({ component: 'DashboardKPIs', updateMethod: 'updateMetric', priority: 1 });
        routes.push({ component: 'PerformanceMetrics', updateMethod: 'update', priority: 2 });
        break;

      case InfoType.CRISIS:
        routes.push({ component: 'AlertCenter', updateMethod: 'addAlert', priority: 1 });
        routes.push({ component: 'NotificationSystem', updateMethod: 'notify', priority: 1 });
        routes.push({ component: 'SWOTRadar', updateMethod: 'addThreat', priority: 2 });
        routes.push({ component: 'TickerTape', updateMethod: 'addUrgent', priority: 1 });
        break;

      case InfoType.STRATEGIC:
        routes.push({ component: 'SWOTRadar', updateMethod: 'addPoint', priority: 1 });
        routes.push({ component: 'IntelligenceFeed', updateMethod: 'addInsight', priority: 1 });
        if (item.priority <= Priority.HIGH) {
          routes.push({ component: 'TickerTape', updateMethod: 'addItem', priority: 3 });
        }
        break;
    }

    return routes;
  }

  // Send to specific destination
  private sendToDestination(route: RouteDestination, item: InfoItem) {
    const subscribers = this.subscribers.get(route.component);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(item);
        } catch (error) {
          console.error(`Error sending to ${route.component}:`, error);
        }
      });
    }
  }

  // Batch process Mentionlytics data
  async processMentionlyticsFeed() {
    try {
      const mentions = await mentionlyticsService.getMentionsFeed(20);
      const campaignData = safeParseJSON<CampaignSetupData>('warRoomCampaignSetup', {
        fallback: defaultCampaignData,
      });

      for (const mention of mentions) {
        // Check if it's about a keyword
        const isKeywordMention = campaignData.keywords?.some((kw: string) =>
          mention.text.toLowerCase().includes(kw.toLowerCase())
        );

        // Check if it's crisis level
        const isCrisis =
          mention.sentiment === 'negative' && mention.reach > 50000 && mention.engagement > 1000;

        // Determine type
        let type = InfoType.GENERAL;
        if (isCrisis) {
          type = InfoType.CRISIS;
        } else if (isKeywordMention) {
          type = InfoType.KEYWORDS;
        } else if (mention.reach > 10000) {
          type = InfoType.STRATEGIC;
        }

        // Create info item
        const infoItem: InfoItem = {
          id: mention.id,
          type,
          priority: isCrisis
            ? Priority.CRITICAL
            : mention.reach > 20000
              ? Priority.HIGH
              : mention.reach > 5000
                ? Priority.MEDIUM
                : Priority.LOW,
          title: `${mention.platform} mention`,
          content: mention.text,
          source: mention.platform,
          timestamp: new Date(mention.timestamp),
          sentiment: mention.sentiment,
          keywords: campaignData.keywords?.filter((kw: string) =>
            mention.text.toLowerCase().includes(kw.toLowerCase())
          ),
          location: mention.location,
          reach: mention.reach,
          engagement: mention.engagement,
          metadata: {
            author: mention.author,
            url: mention.url,
          },
        };

        await this.routeInformation(infoItem);
      }
    } catch (error) {
      console.error('Error processing Mentionlytics feed:', error);
    }
  }

  // Get items by type (for components that need direct access)
  getByType(type: InfoType, limit: number = 10): InfoItem[] {
    return this.processedItems.filter((item) => item.type === type).slice(0, limit);
  }

  // Get all recent items
  getAllItems(limit: number = 20): InfoItem[] {
    return this.processedItems.slice(0, limit);
  }

  // Process a single information item (for external use)
  async processInformation(
    item: Partial<InfoItem> & { content: string; source: string; type?: InfoType }
  ) {
    const fullItem: InfoItem = {
      id: item.id || `info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: item.type || InfoType.GENERAL,
      priority: item.priority || Priority.MEDIUM,
      title: item.title || item.content.substring(0, 50) + '...',
      content: item.content,
      source: item.source,
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      metadata: item.metadata,
      swotCategory: item.swotCategory,
      sentiment: item.sentiment,
      keywords: item.keywords,
      location: item.location,
      reach: item.reach,
      engagement: item.engagement,
    };

    await this.routeInformation(fullItem);
  }

  // Get stats about information flow
  getStats() {
    return {
      queueSize: this.queue.length,
      subscriberCount: this.subscribers.size,
      processing: this.processing,
      destinations: Array.from(this.subscribers.keys()),
      processedCount: this.processedItems.length,
    };
  }
}

// Export singleton instance
export const informationRouter = InformationRouter.getInstance();

// Helper hook for React components
export function useInformationSubscription(
  component: string,
  callback: (item: InfoItem) => void,
  deps: React.DependencyList = []
) {
  const { useEffect } = require('react');

  useEffect(() => {
    const unsubscribe = informationRouter.subscribe(component, callback);
    return unsubscribe;
  }, deps);
}
