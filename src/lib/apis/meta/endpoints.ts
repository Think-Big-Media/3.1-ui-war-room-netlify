/**
 * Meta Business API Endpoints
 * Core endpoints for ad accounts, campaigns, and insights
 */

import { type MetaApiClient } from './client';
import { metaCache, MetaApiCache } from './cache';
import {
  type AdAccount,
  type Campaign,
  type InsightData,
  type InsightParams,
  type MetaUser,
  MetaApiResponse,
} from './types';

export class MetaEndpoints {
  constructor(private client: MetaApiClient) {}

  /**
   * Get current user info
   */
  async getMe(): Promise<MetaUser> {
    const response = await this.client.request<MetaUser>('me', {
      params: { fields: 'id,name,email' },
    });
    return response.data;
  }

  /**
   * Get user's ad accounts
   */
  async getAdAccounts(): Promise<AdAccount[]> {
    const response = await this.client.request<AdAccount[]>('me/adaccounts', {
      params: {
        fields: 'id,account_id,name,currency,timezone_name,account_status,business{id,name}',
        limit: 100,
      },
    });
    return response.data;
  }

  /**
   * Get ad account details
   */
  async getAdAccount(accountId: string): Promise<AdAccount> {
    const response = await this.client.request<AdAccount>(`act_${accountId}`, {
      params: {
        fields: 'id,account_id,name,currency,timezone_name,account_status,business{id,name}',
      },
    });
    return response.data;
  }

  /**
   * Get campaigns for ad account
   */
  async getCampaigns(accountId: string): Promise<Campaign[]> {
    const campaigns: Campaign[] = [];

    for await (const batch of this.client.paginate<Campaign>(`act_${accountId}/campaigns`, {
      fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget',
      limit: 50,
    })) {
      campaigns.push(...batch);
    }

    return campaigns;
  }

  /**
   * Get insights for ad account
   */
  async getAccountInsights(accountId: string, params?: InsightParams): Promise<InsightData[]> {
    // Generate cache key
    const cacheKey = MetaApiCache.generateInsightKey(accountId, params || {});

    const defaultParams: InsightParams = {
      level: 'account',
      fields: ['spend', 'impressions', 'clicks', 'cpm', 'cpc', 'ctr'],
      date_preset: 'last_7d',
      ...params,
    };

    const response = await this.client.request<InsightData[]>(`act_${accountId}/insights`, {
      params: this.formatInsightParams(defaultParams),
      cacheTTL: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return response.data;
  }

  /**
   * Get insights for campaign
   */
  async getCampaignInsights(campaignId: string, params?: InsightParams): Promise<InsightData[]> {
    const defaultParams: InsightParams = {
      level: 'campaign',
      fields: [
        'campaign_id',
        'campaign_name',
        'spend',
        'impressions',
        'clicks',
        'cpm',
        'cpc',
        'ctr',
        'conversions',
        'cost_per_conversion',
      ],
      date_preset: 'last_7d',
      ...params,
    };

    const response = await this.client.request<InsightData[]>(`${campaignId}/insights`, {
      params: this.formatInsightParams(defaultParams),
      cacheTTL: 5 * 60 * 1000,
    });

    return response.data;
  }

  /**
   * Get aggregated insights across multiple campaigns
   */
  async getAggregatedInsights(
    accountId: string,
    campaignIds?: string[],
    params?: InsightParams
  ): Promise<{
    total: InsightData;
    byCampaign: Record<string, InsightData>;
    byDate?: Record<string, InsightData>;
  }> {
    const insightParams: InsightParams = {
      level: 'campaign',
      fields: [
        'campaign_id',
        'campaign_name',
        'spend',
        'impressions',
        'clicks',
        'cpm',
        'cpc',
        'ctr',
        'conversions',
        'cost_per_conversion',
      ],
      date_preset: 'last_30d',
      ...params,
    };

    // Add campaign filter if specific campaigns requested
    if (campaignIds && campaignIds.length > 0) {
      insightParams.filtering = [
        {
          field: 'campaign.id',
          operator: 'IN',
          value: campaignIds,
        },
      ];
    }

    // Get campaign-level insights
    const insights = await this.getAccountInsights(accountId, insightParams);

    // Aggregate totals
    const total: InsightData = {
      date_start: insights[0]?.date_start || '',
      date_stop: insights[0]?.date_stop || '',
      spend: '0',
      impressions: '0',
      clicks: '0',
      cpm: '0',
      cpc: '0',
      ctr: '0',
      conversions: '0',
      cost_per_conversion: '0',
    };

    const byCampaign: Record<string, InsightData> = {};
    const byDate: Record<string, InsightData> = {};

    // Process insights
    insights.forEach((insight) => {
      // Aggregate totals
      total.spend = String(parseFloat(total.spend) + parseFloat(insight.spend || '0'));
      total.impressions = String(
        parseInt(total.impressions) + parseInt(insight.impressions || '0')
      );
      total.clicks = String(parseInt(total.clicks) + parseInt(insight.clicks || '0'));
      total.conversions = String(
        parseInt(total.conversions || '0') + parseInt(insight.conversions || '0')
      );

      // Group by campaign
      if (insight.campaign_id) {
        byCampaign[insight.campaign_id] = insight;
      }

      // Group by date if time breakdown requested
      if (params?.breakdowns?.includes('time_breakdown') && insight.date_start) {
        if (!byDate[insight.date_start]) {
          byDate[insight.date_start] = { ...insight };
        } else {
          // Aggregate for this date
          byDate[insight.date_start].spend = String(
            parseFloat(byDate[insight.date_start].spend) + parseFloat(insight.spend || '0')
          );
          // ... aggregate other metrics
        }
      }
    });

    // Calculate derived metrics
    if (parseInt(total.impressions) > 0) {
      total.cpm = String((parseFloat(total.spend) / parseInt(total.impressions)) * 1000);
    }
    if (parseInt(total.clicks) > 0) {
      total.cpc = String(parseFloat(total.spend) / parseInt(total.clicks));
      total.ctr = String((parseInt(total.clicks) / parseInt(total.impressions)) * 100);
    }
    if (parseInt(total.conversions || '0') > 0) {
      total.cost_per_conversion = String(
        parseFloat(total.spend) / parseInt(total.conversions || '1')
      );
    }

    return { total, byCampaign, byDate };
  }

  /**
   * Get spend trend for account
   */
  async getSpendTrend(
    accountId: string,
    days = 30
  ): Promise<Array<{ date: string; spend: number }>> {
    const insights = await this.getAccountInsights(accountId, {
      level: 'account',
      fields: ['spend'],
      time_range: {
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0],
      },
      breakdowns: ['time_breakdown'],
    });

    return insights.map((insight) => ({
      date: insight.date_start,
      spend: parseFloat(insight.spend || '0'),
    }));
  }

  /**
   * Format insight parameters for API
   */
  private formatInsightParams(params: InsightParams): Record<string, any> {
    const formatted: Record<string, any> = {};

    if (params.level) {
      formatted.level = params.level;
    }
    if (params.fields) {
      formatted.fields = params.fields.join(',');
    }
    if (params.date_preset) {
      formatted.date_preset = params.date_preset;
    }
    if (params.time_range) {
      formatted.time_range = JSON.stringify(params.time_range);
    }
    if (params.filtering) {
      formatted.filtering = JSON.stringify(params.filtering);
    }
    if (params.breakdowns) {
      formatted.breakdowns = params.breakdowns.join(',');
    }
    if (params.sort) {
      formatted.sort = params.sort.join(',');
    }
    if (params.limit) {
      formatted.limit = params.limit;
    }

    return formatted;
  }
}

// Factory function
export function createMetaEndpoints(client: MetaApiClient): MetaEndpoints {
  return new MetaEndpoints(client);
}
