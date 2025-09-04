// Ad Insights service for Meta Business API

import { type MetaAPIClient } from './client';
import { type InsightsParams, type InsightsData, type MetaAPIResponse } from './types';
import { MetaValidationError } from './errors';

export class MetaInsightsService {
  constructor(private client: MetaAPIClient) {}

  /**
   * Get insights for an ad account
   */
  async getAccountInsights(params: InsightsParams): Promise<InsightsData[]> {
    this.validateParams(params);

    const endpoint = `act_${params.accountId}/insights`;
    const queryParams = this.buildQueryParams(params);

    const response = await this.client.request<MetaAPIResponse<InsightsData[]>>(endpoint, {
      params: queryParams,
    });

    return this.transformInsightsData(response.data);
  }

  /**
   * Get insights for specific campaigns
   */
  async getCampaignInsights(
    campaignId: string,
    params: Omit<InsightsParams, 'accountId' | 'level'>
  ): Promise<InsightsData[]> {
    const endpoint = `${campaignId}/insights`;
    const queryParams = this.buildQueryParams({ ...params, level: 'campaign' });

    const response = await this.client.request<MetaAPIResponse<InsightsData[]>>(endpoint, {
      params: queryParams,
    });

    return this.transformInsightsData(response.data);
  }

  /**
   * Get insights for ad sets
   */
  async getAdSetInsights(
    adSetId: string,
    params: Omit<InsightsParams, 'accountId' | 'level'>
  ): Promise<InsightsData[]> {
    const endpoint = `${adSetId}/insights`;
    const queryParams = this.buildQueryParams({ ...params, level: 'adset' });

    const response = await this.client.request<MetaAPIResponse<InsightsData[]>>(endpoint, {
      params: queryParams,
    });

    return this.transformInsightsData(response.data);
  }

  /**
   * Get insights for individual ads
   */
  async getAdInsights(
    adId: string,
    params: Omit<InsightsParams, 'accountId' | 'level'>
  ): Promise<InsightsData[]> {
    const endpoint = `${adId}/insights`;
    const queryParams = this.buildQueryParams({ ...params, level: 'ad' });

    const response = await this.client.request<MetaAPIResponse<InsightsData[]>>(endpoint, {
      params: queryParams,
    });

    return this.transformInsightsData(response.data);
  }

  /**
   * Get aggregated insights across multiple campaigns
   */
  async getAggregatedInsights(params: InsightsParams & { campaignIds?: string[] }): Promise<{
    summary: {
      totalSpend: number;
      totalImpressions: number;
      totalClicks: number;
      averageCTR: number;
      averageCPC: number;
      averageCPM: number;
    };
    byDate: InsightsData[];
  }> {
    let allInsights: InsightsData[] = [];

    if (params.campaignIds && params.campaignIds.length > 0) {
      // Get insights for specific campaigns
      const promises = params.campaignIds.map((campaignId) =>
        this.getCampaignInsights(campaignId, params)
      );

      const results = await Promise.all(promises);
      allInsights = results.flat();
    } else {
      // Get all account insights
      allInsights = await this.getAccountInsights(params);
    }

    // Calculate aggregated metrics
    const summary = this.calculateSummaryMetrics(allInsights);

    return {
      summary,
      byDate: allInsights,
    };
  }

  /**
   * Stream real-time insights (polling-based)
   */
  async *streamInsights(
    params: InsightsParams,
    pollInterval = 300000 // 5 minutes
  ): AsyncGenerator<InsightsData[], void, unknown> {
    while (true) {
      try {
        const insights = await this.getAccountInsights(params);
        yield insights;

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error streaming insights:', error);
        // Continue streaming after error
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }
  }

  /**
   * Get insights with custom breakdowns
   */
  async getInsightsWithBreakdowns(
    params: InsightsParams & {
      breakdowns: string[];
    }
  ): Promise<Map<string, InsightsData[]>> {
    const insights = await this.getAccountInsights(params);

    // Group by breakdown dimensions
    const grouped = new Map<string, InsightsData[]>();

    insights.forEach((insight) => {
      // Create a key from breakdown values
      const key = params.breakdowns
        .map((breakdown) => (insight as any)[breakdown] || 'unknown')
        .join('|');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)!.push(insight);
    });

    return grouped;
  }

  /**
   * Validate insights parameters
   */
  private validateParams(params: InsightsParams): void {
    if (!params.accountId) {
      throw new MetaValidationError('Account ID is required');
    }

    if (params.accountId && !params.accountId.match(/^\d+$/)) {
      throw new MetaValidationError('Invalid account ID format');
    }

    if (params.time_range) {
      const since = new Date(params.time_range.since);
      const until = new Date(params.time_range.until);

      if (isNaN(since.getTime()) || isNaN(until.getTime())) {
        throw new MetaValidationError('Invalid date format in time_range');
      }

      if (since > until) {
        throw new MetaValidationError('since date must be before until date');
      }
    }

    if (params.limit && (params.limit < 1 || params.limit > 5000)) {
      throw new MetaValidationError('Limit must be between 1 and 5000');
    }
  }

  /**
   * Build query parameters for insights request
   */
  private buildQueryParams(params: any): Record<string, string> {
    const queryParams: Record<string, string> = {};

    // Default fields if not specified
    const defaultFields = [
      'account_id',
      'account_name',
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      'cpm',
      'cpp',
      'cpc',
      'ctr',
      'actions',
      'conversions',
      'date_start',
      'date_stop',
    ];

    queryParams.fields = (params.fields || defaultFields).join(',');

    if (params.level) {
      queryParams.level = params.level;
    }

    if (params.date_preset) {
      queryParams.date_preset = params.date_preset;
    } else if (params.time_range) {
      queryParams.time_range = JSON.stringify(params.time_range);
    }

    if (params.filtering && params.filtering.length > 0) {
      queryParams.filtering = JSON.stringify(params.filtering);
    }

    if (params.breakdowns && params.breakdowns.length > 0) {
      queryParams.breakdowns = params.breakdowns.join(',');
    }

    if (params.action_attribution_windows) {
      queryParams.action_attribution_windows = JSON.stringify(params.action_attribution_windows);
    }

    if (params.limit) {
      queryParams.limit = String(params.limit);
    }

    if (params.after) {
      queryParams.after = params.after;
    }

    return queryParams;
  }

  /**
   * Transform and validate insights data
   */
  private transformInsightsData(data: InsightsData[]): InsightsData[] {
    return data.map((insight) => ({
      ...insight,
      // Convert string numbers to ensure consistency
      impressions: String(insight.impressions || '0'),
      clicks: String(insight.clicks || '0'),
      spend: String(insight.spend || '0'),
      reach: String(insight.reach || '0'),
      // Calculate derived metrics if not provided
      ctr: insight.ctr || this.calculateCTR(insight),
      cpc: insight.cpc || this.calculateCPC(insight),
      cpm: insight.cpm || this.calculateCPM(insight),
    }));
  }

  /**
   * Calculate summary metrics from insights data
   */
  private calculateSummaryMetrics(insights: InsightsData[]): {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averageCPC: number;
    averageCPM: number;
  } {
    const totals = insights.reduce(
      (acc, insight) => ({
        spend: acc.spend + parseFloat(insight.spend || '0'),
        impressions: acc.impressions + parseInt(insight.impressions || '0'),
        clicks: acc.clicks + parseInt(insight.clicks || '0'),
      }),
      { spend: 0, impressions: 0, clicks: 0 }
    );

    return {
      totalSpend: totals.spend,
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      averageCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      averageCPC: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      averageCPM: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    };
  }

  private calculateCTR(insight: InsightsData): string {
    const impressions = parseInt(insight.impressions || '0');
    const clicks = parseInt(insight.clicks || '0');

    if (impressions === 0) {
      return '0';
    }

    return ((clicks / impressions) * 100).toFixed(2);
  }

  private calculateCPC(insight: InsightsData): string {
    const spend = parseFloat(insight.spend || '0');
    const clicks = parseInt(insight.clicks || '0');

    if (clicks === 0) {
      return '0';
    }

    return (spend / clicks).toFixed(2);
  }

  private calculateCPM(insight: InsightsData): string {
    const spend = parseFloat(insight.spend || '0');
    const impressions = parseInt(insight.impressions || '0');

    if (impressions === 0) {
      return '0';
    }

    return ((spend / impressions) * 1000).toFixed(2);
  }
}
