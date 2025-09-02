// Google Ads Insights and Reporting Service

import { type GoogleAdsClient } from './client';
import {
  type CustomerQuery,
  type ReportingQuery,
  type Metrics,
  type Campaign,
  type AdGroup,
  type GoogleAdsRow,
  SearchGoogleAdsResponse,
} from './types';
import { GoogleAdsValidationError } from './errors';

export class GoogleAdsInsightsService {
  constructor(private client: GoogleAdsClient) {}

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(
    customerId: string,
    params: {
      dateRange?: ReportingQuery['dateRange'];
      campaignIds?: string[];
      metrics?: string[];
      segments?: string[];
      orderBy?: string;
      limit?: number;
    } = {}
  ): Promise<Array<GoogleAdsRow & { campaign: Campaign; metrics: Metrics }>> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr',
      'metrics.average_cpc',
      'metrics.average_cpm',
      'metrics.conversion_rate',
    ];

    const query = this.buildQuery({
      entity: 'campaign',
      metrics: params.metrics || defaultMetrics,
      segments: params.segments,
      dateRange: params.dateRange || { predefinedRange: 'LAST_30_DAYS' },
      where: params.campaignIds ? `campaign.id IN (${params.campaignIds.join(', ')})` : undefined,
      orderBy: params.orderBy,
      limit: params.limit,
    });

    const response = await this.client.search<GoogleAdsRow>(customerId, { query });

    return this.transformResults(response.results);
  }

  /**
   * Get ad group performance metrics
   */
  async getAdGroupPerformance(
    customerId: string,
    params: {
      dateRange?: ReportingQuery['dateRange'];
      campaignId?: string;
      adGroupIds?: string[];
      metrics?: string[];
      segments?: string[];
      orderBy?: string;
      limit?: number;
    } = {}
  ): Promise<Array<GoogleAdsRow & { adGroup: AdGroup; metrics: Metrics }>> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr',
      'metrics.average_cpc',
    ];

    const whereConditions = [];
    if (params.campaignId) {
      whereConditions.push(`campaign.id = ${params.campaignId}`);
    }
    if (params.adGroupIds) {
      whereConditions.push(`ad_group.id IN (${params.adGroupIds.join(', ')})`);
    }

    const query = this.buildQuery({
      entity: 'ad_group',
      metrics: params.metrics || defaultMetrics,
      segments: params.segments,
      dateRange: params.dateRange || { predefinedRange: 'LAST_30_DAYS' },
      where: whereConditions.length > 0 ? whereConditions.join(' AND ') : undefined,
      orderBy: params.orderBy,
      limit: params.limit,
    });

    const response = await this.client.search<GoogleAdsRow>(customerId, { query });

    return this.transformResults(response.results);
  }

  /**
   * Get keyword performance metrics
   */
  async getKeywordPerformance(
    customerId: string,
    params: {
      dateRange?: ReportingQuery['dateRange'];
      campaignId?: string;
      adGroupId?: string;
      keywordIds?: string[];
      metrics?: string[];
      segments?: string[];
      orderBy?: string;
      limit?: number;
    } = {}
  ): Promise<GoogleAdsRow[]> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr',
      'metrics.average_cpc',
      'metrics.search_impression_share',
    ];

    const whereConditions = [];
    if (params.campaignId) {
      whereConditions.push(`campaign.id = ${params.campaignId}`);
    }
    if (params.adGroupId) {
      whereConditions.push(`ad_group.id = ${params.adGroupId}`);
    }
    if (params.keywordIds) {
      whereConditions.push(`ad_group_criterion.criterion_id IN (${params.keywordIds.join(', ')})`);
    }

    const query = this.buildQuery({
      entity: 'keyword',
      metrics: params.metrics || defaultMetrics,
      segments: params.segments,
      dateRange: params.dateRange || { predefinedRange: 'LAST_30_DAYS' },
      where: whereConditions.length > 0 ? whereConditions.join(' AND ') : undefined,
      orderBy: params.orderBy || 'metrics.impressions DESC',
      limit: params.limit,
    });

    const response = await this.client.search<GoogleAdsRow>(customerId, { query });

    return this.transformResults(response.results);
  }

  /**
   * Get account-level performance summary
   */
  async getAccountSummary(
    customerId: string,
    dateRange: ReportingQuery['dateRange'] = { predefinedRange: 'LAST_30_DAYS' }
  ): Promise<{
    customer: any;
    metrics: Metrics;
    summary: {
      totalSpend: number;
      totalClicks: number;
      totalImpressions: number;
      averageCTR: number;
      averageCPC: number;
      totalConversions: number;
      conversionRate: number;
    };
  }> {
    const query = this.buildQuery({
      entity: 'customer',
      metrics: [
        'metrics.impressions',
        'metrics.clicks',
        'metrics.cost_micros',
        'metrics.conversions',
        'metrics.all_conversions',
        'metrics.ctr',
        'metrics.average_cpc',
        'metrics.conversion_rate',
      ],
      dateRange,
    });

    const response = await this.client.search<GoogleAdsRow>(customerId, { query });

    if (response.results.length === 0) {
      throw new GoogleAdsValidationError('No data found for customer');
    }

    const result = response.results[0];
    const metrics = result.metrics!;

    // Convert micros to currency
    const totalSpend = parseInt(metrics.costMicros || '0') / 1_000_000;

    return {
      customer: result.customer,
      metrics,
      summary: {
        totalSpend,
        totalClicks: parseInt(metrics.clicks || '0'),
        totalImpressions: parseInt(metrics.impressions || '0'),
        averageCTR: metrics.ctr || 0,
        averageCPC: metrics.averageCpc || 0,
        totalConversions: metrics.conversions || 0,
        conversionRate: metrics.conversionRate || 0,
      },
    };
  }

  /**
   * Get performance by date segments
   */
  async getPerformanceByDate(
    customerId: string,
    params: {
      entity: 'campaign' | 'ad_group' | 'customer';
      dateRange: ReportingQuery['dateRange'];
      metrics?: string[];
      entityId?: string;
      granularity?: 'DAY' | 'WEEK' | 'MONTH';
    }
  ): Promise<Array<GoogleAdsRow & { date: string }>> {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
    ];

    const segments =
      params.granularity === 'MONTH'
        ? ['segments.month']
        : params.granularity === 'WEEK'
          ? ['segments.week']
          : ['segments.date'];

    const whereConditions = [];
    if (params.entityId) {
      const idField = params.entity === 'campaign' ? 'campaign.id' : 'ad_group.id';
      whereConditions.push(`${idField} = ${params.entityId}`);
    }

    const query = this.buildQuery({
      entity: params.entity,
      metrics: params.metrics || defaultMetrics,
      segments,
      dateRange: params.dateRange,
      where: whereConditions.length > 0 ? whereConditions.join(' AND ') : undefined,
      orderBy: `${segments[0]} DESC`,
    });

    const response = await this.client.search<GoogleAdsRow>(customerId, { query });

    return this.transformResults(response.results);
  }

  /**
   * Get search terms report
   */
  async getSearchTermsReport(
    customerId: string,
    params: {
      dateRange?: ReportingQuery['dateRange'];
      campaignId?: string;
      adGroupId?: string;
      limit?: number;
    } = {}
  ): Promise<
    Array<{
      searchTerm: string;
      campaign: Campaign;
      adGroup: AdGroup;
      metrics: Metrics;
    }>
  > {
    const whereConditions = ['search_term_view.status = "ADDED"'];

    if (params.campaignId) {
      whereConditions.push(`campaign.id = ${params.campaignId}`);
    }
    if (params.adGroupId) {
      whereConditions.push(`ad_group.id = ${params.adGroupId}`);
    }

    const query = `
      SELECT
        search_term_view.search_term,
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM search_term_view
      WHERE ${whereConditions.join(' AND ')}
      ${this.getDateRangeClause(params.dateRange || { predefinedRange: 'LAST_30_DAYS' })}
      ORDER BY metrics.impressions DESC
      ${params.limit ? `LIMIT ${params.limit}` : ''}
    `;

    const response = await this.client.search<any>(customerId, { query });

    return response.results.map((row) => ({
      searchTerm: row.searchTermView.searchTerm,
      campaign: row.campaign,
      adGroup: row.adGroup,
      metrics: row.metrics,
    }));
  }

  /**
   * Stream large result sets
   */
  async *streamInsights(
    customerId: string,
    query: CustomerQuery,
    batchSize = 1000
  ): AsyncGenerator<GoogleAdsRow[], void, unknown> {
    const queryWithLimit: CustomerQuery = {
      ...query,
      pageSize: batchSize,
    };

    for await (const batch of this.client.searchStream<GoogleAdsRow>(customerId, queryWithLimit)) {
      yield this.transformResults(batch);
    }
  }

  /**
   * Build GAQL query from parameters
   */
  private buildQuery(params: ReportingQuery): string {
    const fields: string[] = [];

    // Add entity fields
    switch (params.entity) {
      case 'campaign':
        fields.push('campaign.id', 'campaign.name', 'campaign.status');
        break;
      case 'ad_group':
        fields.push(
          'ad_group.id',
          'ad_group.name',
          'ad_group.status',
          'campaign.id',
          'campaign.name'
        );
        break;
      case 'customer':
        fields.push('customer.id', 'customer.descriptive_name', 'customer.currency_code');
        break;
    }

    // Add metrics
    fields.push(...params.metrics);

    // Add segments
    if (params.segments) {
      fields.push(...params.segments);
    }

    // Build query
    let query = `SELECT ${fields.join(', ')} FROM ${params.entity}`;

    // Add WHERE clause
    const whereConditions = [];
    if (params.where) {
      whereConditions.push(params.where);
    }

    // Add date range
    const dateRangeClause = this.getDateRangeClause(params.dateRange);
    if (dateRangeClause) {
      whereConditions.push(dateRangeClause);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (params.orderBy) {
      query += ` ORDER BY ${params.orderBy}`;
    }

    // Add LIMIT
    if (params.limit) {
      query += ` LIMIT ${params.limit}`;
    }

    return query;
  }

  /**
   * Get date range clause for GAQL
   */
  private getDateRangeClause(dateRange: ReportingQuery['dateRange']): string {
    if ('predefinedRange' in dateRange) {
      return `segments.date DURING ${dateRange.predefinedRange}`;
    }
    return `segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`;
  }

  /**
   * Transform API results to consistent format
   */
  private transformResults(results: any[]): any[] {
    return results.map((row) => {
      // Convert cost from micros to currency
      if (row.metrics?.costMicros) {
        row.metrics.cost = parseInt(row.metrics.costMicros) / 1_000_000;
      }

      // Convert CPC from micros
      if (row.metrics?.averageCpc) {
        row.metrics.averageCpc = row.metrics.averageCpc / 1_000_000;
      }

      // Convert CPM from micros
      if (row.metrics?.averageCpm) {
        row.metrics.averageCpm = row.metrics.averageCpm / 1_000_000;
      }

      return row;
    });
  }

  /**
   * Get campaign insights (alias for getCampaignPerformance)
   */
  async getCampaignInsights(customerId: string, campaignId: string, params: any = {}) {
    return this.getCampaignPerformance(customerId, {
      ...params,
      campaignIds: [campaignId],
    });
  }

  /**
   * Get customer overview (implementation of missing method)
   */
  async getCustomerOverview(customerId: string, params: any = {}) {
    const defaultMetrics = [
      'metrics.impressions',
      'metrics.clicks',
      'metrics.cost_micros',
      'metrics.conversions',
      'metrics.ctr',
      'metrics.average_cpc',
    ];

    const query = `
      SELECT customer.id, customer.descriptive_name, customer.currency_code,
             ${(params.metrics || defaultMetrics).join(', ')}
      FROM customer
      WHERE customer.id = ${customerId}
      ${this.getDateRangeClause(params.dateRange || { predefinedRange: 'LAST_30_DAYS' })}
    `;

    const response = await this.client.search<any>(customerId, { query });
    const result = response.results[0];

    if (!result?.metrics) {
      throw new GoogleAdsValidationError('No customer data found');
    }

    const { metrics } = result;
    const totalSpend = parseInt(metrics.costMicros || '0') / 1_000_000;

    return {
      customer: result.customer,
      metrics,
      summary: {
        totalSpend,
        totalClicks: parseInt(metrics.clicks || '0'),
        totalImpressions: parseInt(metrics.impressions || '0'),
        averageCTR: metrics.ctr || 0,
        averageCPC: metrics.averageCpc || 0,
        totalConversions: metrics.conversions || 0,
        conversionRate: metrics.conversionRate || 0,
      },
    };
  }

  /**
   * Get account insights (alias for getCustomerOverview)
   */
  async getAccountInsights(customerId: string, params: any = {}) {
    return this.getCustomerOverview(customerId, params);
  }
}
