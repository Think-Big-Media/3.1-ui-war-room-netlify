/**
 * Meta Business API Ad Set Management Service
 * Handles CRUD operations for ad sets within campaigns
 */

import { type MetaAPIClient } from './client';
import { type AdSet, type MetaAPIResponse } from './types';
import { MetaAPIError } from './errors';
import { type RateLimiter } from './rateLimiter';
import { type CircuitBreaker } from './circuitBreaker';

export interface AdSetCreateParams {
  name: string;
  campaign_id: string;
  daily_budget?: string; // In cents
  lifetime_budget?: string; // In cents
  start_time?: string; // ISO 8601
  end_time?: string; // ISO 8601
  status?: 'ACTIVE' | 'PAUSED';
  billing_event?: 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT' | 'VIDEO_VIEWS';
  optimization_goal: OptimizationGoal;
  bid_amount?: string; // In cents
  bid_strategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP';
  targeting: TargetingSpec;
  promoted_object?: {
    pixel_id?: string;
    custom_event_type?: string;
    application_id?: string;
    object_store_url?: string;
    page_id?: string;
  };
  attribution_spec?: AttributionSpec[];
  destination_type?: 'WEBSITE' | 'APP' | 'MESSENGER' | 'APPLINKS_AUTOMATIC';
  rf_prediction_id?: string;
}

export type OptimizationGoal =
  | 'NONE'
  | 'APP_INSTALLS'
  | 'AD_RECALL_LIFT'
  | 'ENGAGED_USERS'
  | 'EVENT_RESPONSES'
  | 'IMPRESSIONS'
  | 'LEAD_GENERATION'
  | 'QUALITY_LEAD'
  | 'LINK_CLICKS'
  | 'OFFSITE_CONVERSIONS'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'QUALITY_CALL'
  | 'REACH'
  | 'LANDING_PAGE_VIEWS'
  | 'VISIT_INSTAGRAM_PROFILE'
  | 'VALUE'
  | 'THRUPLAY'
  | 'DERIVED_EVENTS'
  | 'APP_INSTALLS_AND_OFFSITE_CONVERSIONS'
  | 'CONVERSATIONS'
  | 'IN_APP_VALUE';

export interface TargetingSpec {
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string }>;
    zips?: Array<{ key: string }>;
    location_types?: string[];
  };
  age_min?: number;
  age_max?: number;
  genders?: number[]; // 1=male, 2=female
  locales?: number[];
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  connections?: Array<{ id: string; name: string }>;
  excluded_connections?: Array<{ id: string; name: string }>;
  friends_of_connections?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
  flexible_spec?: Array<{
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    demographics?: Array<{ id: string; name: string }>;
  }>;
  exclusions?: TargetingSpec;
  targeting_optimization?: 'none' | 'expansion_all';
  brand_safety_content_filter_levels?: string[];
}

export interface AttributionSpec {
  event_type: string;
  window_days: number;
}

export interface AdSetUpdateParams {
  name?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  daily_budget?: string;
  lifetime_budget?: string;
  end_time?: string;
  bid_amount?: string;
  bid_strategy?: string;
  targeting?: TargetingSpec;
  attribution_spec?: AttributionSpec[];
}

export interface AdSetListParams {
  fields?: string[];
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  limit?: number;
  after?: string;
  effective_status?: string[];
  date_preset?: string;
  time_range?: {
    since: string;
    until: string;
  };
}

export class MetaAdSetService {
  constructor(
    private client: MetaAPIClient,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker
  ) {}

  /**
   * Create a new ad set
   */
  async createAdSet(accountId: string, params: AdSetCreateParams): Promise<AdSet> {
    try {
      // Validate required fields
      if (!params.campaign_id) {
        throw new MetaAPIError('campaign_id is required', 400);
      }
      if (!params.targeting) {
        throw new MetaAPIError('targeting is required', 400);
      }
      if (!params.optimization_goal) {
        throw new MetaAPIError('optimization_goal is required', 400);
      }

      // Check rate limits
      await this.rateLimiter.checkLimit(`adsets:create:${accountId}`);

      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        const body = {
          ...params,
          targeting: JSON.stringify(params.targeting),
          ...(params.attribution_spec && {
            attribution_spec: JSON.stringify(params.attribution_spec),
          }),
        };
        return this.client.request<{ id: string }>(`/act_${accountId}/adsets`, {
          method: 'POST',
          body,
        });
      });

      // Track usage
      await this.rateLimiter.trackUsage(`adsets:create:${accountId}`);

      // Fetch the created ad set details
      return await this.getAdSet(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to create ad set: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a single ad set by ID
   */
  async getAdSet(
    adSetId: string,
    fields: string[] = [
      'id',
      'name',
      'status',
      'effective_status',
      'campaign_id',
      'daily_budget',
      'lifetime_budget',
      'budget_remaining',
      'created_time',
      'updated_time',
      'start_time',
      'end_time',
      'optimization_goal',
      'billing_event',
      'bid_amount',
      'bid_strategy',
      'targeting',
      'promoted_object',
      'attribution_spec',
    ]
  ): Promise<AdSet> {
    try {
      await this.rateLimiter.checkLimit(`adsets:read:${adSetId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<AdSet>(`/${adSetId}?fields=${fields.join(',')}`);
      });

      await this.rateLimiter.trackUsage(`adsets:read:${adSetId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get ad set: ${(error as Error).message}`, 500);
    }
  }

  /**
   * List ad sets for an ad account or campaign
   */
  async listAdSets(
    parentId: string,
    parentType: 'account' | 'campaign',
    params: AdSetListParams = {}
  ): Promise<MetaAPIResponse<AdSet[]>> {
    try {
      await this.rateLimiter.checkLimit(`adsets:list:${parentId}`);

      const defaultFields = [
        'id',
        'name',
        'status',
        'effective_status',
        'campaign_id',
        'daily_budget',
        'lifetime_budget',
        'budget_remaining',
        'optimization_goal',
        'created_time',
        'updated_time',
      ];

      const path = parentType === 'account' ? `/act_${parentId}/adsets` : `/${parentId}/adsets`;

      const response = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          fields: (params.fields || defaultFields).join(','),
          limit: String(params.limit || 25),
          ...(params.after && { after: params.after }),
          ...(params.filtering && { filtering: JSON.stringify(params.filtering) }),
          ...(params.effective_status && {
            effective_status: JSON.stringify(params.effective_status),
          }),
          ...(params.date_preset && { date_preset: params.date_preset }),
          ...(params.time_range && { time_range: JSON.stringify(params.time_range) }),
        });
        return this.client.request<MetaAPIResponse<AdSet[]>>(`${path}?${queryParams.toString()}`);
      });

      await this.rateLimiter.trackUsage(`adsets:list:${parentId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to list ad sets: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update an existing ad set
   */
  async updateAdSet(adSetId: string, params: AdSetUpdateParams): Promise<AdSet> {
    try {
      await this.rateLimiter.checkLimit(`adsets:update:${adSetId}`);

      const data: any = { ...params };
      if (params.targeting) {
        data.targeting = JSON.stringify(params.targeting);
      }
      if (params.attribution_spec) {
        data.attribution_spec = JSON.stringify(params.attribution_spec);
      }

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${adSetId}`, { method: 'POST', body: data });
      });

      await this.rateLimiter.trackUsage(`adsets:update:${adSetId}`);

      // Return updated ad set
      return await this.getAdSet(adSetId);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to update ad set: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete an ad set
   */
  async deleteAdSet(adSetId: string): Promise<void> {
    try {
      await this.rateLimiter.checkLimit(`adsets:delete:${adSetId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${adSetId}`, { method: 'DELETE' });
      });

      await this.rateLimiter.trackUsage(`adsets:delete:${adSetId}`);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to delete ad set: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Pause an ad set
   */
  async pauseAdSet(adSetId: string): Promise<AdSet> {
    return this.updateAdSet(adSetId, { status: 'PAUSED' });
  }

  /**
   * Resume an ad set
   */
  async resumeAdSet(adSetId: string): Promise<AdSet> {
    return this.updateAdSet(adSetId, { status: 'ACTIVE' });
  }

  /**
   * Archive an ad set
   */
  async archiveAdSet(adSetId: string): Promise<AdSet> {
    return this.updateAdSet(adSetId, { status: 'ARCHIVED' });
  }

  /**
   * Duplicate an ad set
   */
  async duplicateAdSet(
    adSetId: string,
    newName: string,
    targetCampaignId?: string,
    modifications?: Partial<AdSetCreateParams>
  ): Promise<AdSet> {
    try {
      // Get original ad set
      const original = await this.getAdSet(adSetId);

      // Extract account ID
      const campaignResponse = await this.client.request<{ account_id: string }>(
        `/${original.campaign_id}?fields=account_id`
      );

      const accountId = campaignResponse.account_id.replace('act_', '');

      // Create new ad set with original settings + modifications
      const newAdSetParams: AdSetCreateParams = {
        name: newName,
        campaign_id: targetCampaignId || original.campaign_id,
        daily_budget: original.daily_budget,
        lifetime_budget: original.lifetime_budget,
        start_time: original.start_time,
        end_time: original.end_time,
        status: 'PAUSED', // Always create as paused
        billing_event: original.billing_event,
        optimization_goal: (original.optimization_goal || 'LINK_CLICKS') as OptimizationGoal,
        bid_amount: original.bid_amount,
        bid_strategy: original.bid_strategy as
          | 'LOWEST_COST_WITHOUT_CAP'
          | 'LOWEST_COST_WITH_BID_CAP'
          | 'COST_CAP'
          | undefined,
        targeting: original.targeting as TargetingSpec,
        promoted_object: original.promoted_object,
        attribution_spec: original.attribution_spec,
        ...modifications,
      };

      return await this.createAdSet(accountId, newAdSetParams);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to duplicate ad set: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get ad set budget utilization
   */
  async getAdSetBudgetUtilization(adSetId: string): Promise<{
    daily_budget: string;
    lifetime_budget: string;
    budget_remaining: string;
    budget_spent_percentage: number;
    daily_spend_cap: string;
  }> {
    try {
      const adSet = await this.getAdSet(adSetId, [
        'daily_budget',
        'lifetime_budget',
        'budget_remaining',
        'daily_spend_cap',
      ]);

      const spent = adSet.lifetime_budget
        ? parseFloat(adSet.lifetime_budget) - parseFloat(adSet.budget_remaining || '0')
        : 0;

      const percentage = adSet.lifetime_budget
        ? (spent / parseFloat(adSet.lifetime_budget)) * 100
        : 0;

      return {
        daily_budget: adSet.daily_budget || '0',
        lifetime_budget: adSet.lifetime_budget || '0',
        budget_remaining: adSet.budget_remaining || '0',
        budget_spent_percentage: Math.round(percentage * 100) / 100,
        daily_spend_cap: adSet.daily_spend_cap || '0',
      };
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get budget utilization: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update ad set targeting
   */
  async updateTargeting(adSetId: string, targeting: TargetingSpec): Promise<AdSet> {
    return this.updateAdSet(adSetId, { targeting });
  }

  /**
   * Get targeting suggestions
   */
  async getTargetingSuggestions(
    accountId: string,
    interests?: string[],
    behaviors?: string[]
  ): Promise<{
    interests: Array<{ id: string; name: string; audience_size: number }>;
    behaviors: Array<{ id: string; name: string; audience_size: number }>;
  }> {
    try {
      await this.rateLimiter.checkLimit(`targeting:suggestions:${accountId}`);

      const suggestions = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          type: 'adinterest',
          q: interests?.join(' ') || '',
          limit: '10',
        });
        return this.client.request<any>(
          `/act_${accountId}/targetingsearch?${queryParams.toString()}`
        );
      });

      await this.rateLimiter.trackUsage(`targeting:suggestions:${accountId}`);

      return {
        interests: suggestions.data || [],
        behaviors: [], // Would need separate API call for behaviors
      };
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(
        `Failed to get targeting suggestions: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Estimate audience size for targeting
   */
  async estimateAudienceSize(
    accountId: string,
    targeting: TargetingSpec
  ): Promise<{
    users: number;
    estimate_ready: boolean;
    unsupported: boolean;
  }> {
    try {
      await this.rateLimiter.checkLimit(`targeting:estimate:${accountId}`);

      const response = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          targeting_spec: JSON.stringify(targeting),
        });
        return this.client.request<any>(
          `/act_${accountId}/reachestimate?${queryParams.toString()}`
        );
      });

      await this.rateLimiter.trackUsage(`targeting:estimate:${accountId}`);

      return {
        users: response.data?.users || 0,
        estimate_ready: response.data?.estimate_ready || false,
        unsupported: response.data?.unsupported || false,
      };
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to estimate audience size: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Batch update multiple ad sets
   */
  async batchUpdateAdSets(
    updates: Array<{ adSetId: string; params: AdSetUpdateParams }>
  ): Promise<Array<{ adSetId: string; success: boolean; error?: string }>> {
    const results = [];

    for (const update of updates) {
      try {
        await this.updateAdSet(update.adSetId, update.params);
        results.push({ adSetId: update.adSetId, success: true });
      } catch (error) {
        results.push({
          adSetId: update.adSetId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }
}
