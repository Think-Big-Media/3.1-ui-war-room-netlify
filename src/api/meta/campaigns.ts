/**
 * Meta Business API Campaign Management Service
 * Handles CRUD operations for campaigns
 */

import { type MetaAPIClient } from './client';
import { type Campaign, type MetaAPIResponse } from './types';
import { MetaAPIError } from './errors';
import { type RateLimiter } from './rateLimiter';
import { type CircuitBreaker } from './circuitBreaker';

export interface CampaignCreateParams {
  name: string;
  objective:
    | 'AWARENESS'
    | 'TRAFFIC'
    | 'ENGAGEMENT'
    | 'LEADS'
    | 'APP_PROMOTION'
    | 'SALES'
    | 'CONVERSIONS';
  status?: 'ACTIVE' | 'PAUSED';
  buying_type?: 'AUCTION' | 'RESERVED';
  daily_budget?: string; // In cents
  lifetime_budget?: string; // In cents
  start_time?: string; // ISO 8601
  end_time?: string; // ISO 8601
  bid_strategy?: 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP';
  special_ad_categories?: string[];
  promoted_object?: {
    pixel_id?: string;
    custom_event_type?: string;
    application_id?: string;
    object_store_url?: string;
  };
}

export interface CampaignUpdateParams {
  name?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  daily_budget?: string;
  lifetime_budget?: string;
  end_time?: string;
  bid_strategy?: string;
}

export interface CampaignListParams {
  fields?: string[];
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  limit?: number;
  after?: string;
  effective_status?: string[];
}

export class MetaCampaignService {
  constructor(
    private client: MetaAPIClient,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker
  ) {}

  /**
   * List campaigns for an account
   */
  async list(accountId: string, accessToken: string): Promise<Campaign[]> {
    try {
      const response = await this.client.request<{ data: Campaign[] }>(
        `/act_${accountId}/campaigns`,
        {
          method: 'GET',
          params: {
            access_token: accessToken,
            fields:
              'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget',
          },
        }
      );

      return response.data || [];
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to list campaigns: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Create a new campaign
   */
  async create(
    accountId: string,
    campaignData: Partial<Campaign>,
    accessToken: string
  ): Promise<Campaign> {
    try {
      const response = await this.client.request<{ id: string }>(`/act_${accountId}/campaigns`, {
        method: 'POST',
        params: {
          access_token: accessToken,
        },
        body: campaignData,
      });

      // Get the created campaign
      return await this.get(response.id, accessToken);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to create campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update a campaign
   */
  async update(
    campaignId: string,
    updates: Partial<Campaign>,
    accessToken: string
  ): Promise<Campaign> {
    try {
      await this.client.request(`/${campaignId}`, {
        method: 'POST',
        params: {
          access_token: accessToken,
        },
        body: updates,
      });

      // Get the updated campaign
      return await this.get(campaignId, accessToken);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to update campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete a campaign
   */
  async delete(campaignId: string, accessToken: string): Promise<void> {
    try {
      await this.client.request(`/${campaignId}`, {
        method: 'DELETE',
        params: {
          access_token: accessToken,
        },
      });
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to delete campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a single campaign
   */
  private async get(campaignId: string, accessToken: string): Promise<Campaign> {
    const response = await this.client.request<Campaign>(`/${campaignId}`, {
      method: 'GET',
      params: {
        access_token: accessToken,
        fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget',
      },
    });

    return response;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(accountId: string, params: CampaignCreateParams): Promise<Campaign> {
    try {
      // Check rate limits
      await this.rateLimiter.checkLimit(`campaigns:create:${accountId}`);

      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ id: string }>(`/act_${accountId}/campaigns`, {
          method: 'POST',
          body: {
            ...params,
          },
        });
      });

      // Track usage
      await this.rateLimiter.trackUsage(`campaigns:create:${accountId}`);

      // Fetch the created campaign details
      return await this.getCampaign(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to create campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(
    campaignId: string,
    fields: string[] = [
      'id',
      'name',
      'status',
      'objective',
      'buying_type',
      'daily_budget',
      'lifetime_budget',
      'created_time',
      'updated_time',
      'start_time',
      'stop_time',
      'bid_strategy',
      'budget_remaining',
      'effective_status',
    ]
  ): Promise<Campaign> {
    try {
      await this.rateLimiter.checkLimit(`campaigns:read:${campaignId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<Campaign>(`/${campaignId}?fields=${fields.join(',')}`);
      });

      await this.rateLimiter.trackUsage(`campaigns:read:${campaignId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * List campaigns for an ad account
   */
  async listCampaigns(
    accountId: string,
    params: CampaignListParams = {}
  ): Promise<MetaAPIResponse<Campaign[]>> {
    try {
      await this.rateLimiter.checkLimit(`campaigns:list:${accountId}`);

      const defaultFields = [
        'id',
        'name',
        'status',
        'objective',
        'effective_status',
        'daily_budget',
        'lifetime_budget',
        'created_time',
        'updated_time',
      ];

      const response = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          fields: (params.fields || defaultFields).join(','),
          limit: String(params.limit || 25),
          ...(params.after && { after: params.after }),
          ...(params.filtering && { filtering: JSON.stringify(params.filtering) }),
          ...(params.effective_status && {
            effective_status: JSON.stringify(params.effective_status),
          }),
        });
        return this.client.request<MetaAPIResponse<Campaign[]>>(
          `/act_${accountId}/campaigns?${queryParams}`
        );
      });

      await this.rateLimiter.trackUsage(`campaigns:list:${accountId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to list campaigns: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(campaignId: string, params: CampaignUpdateParams): Promise<Campaign> {
    try {
      await this.rateLimiter.checkLimit(`campaigns:update:${campaignId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${campaignId}`, {
          method: 'POST',
          body: {
            ...params,
          },
        });
      });

      await this.rateLimiter.trackUsage(`campaigns:update:${campaignId}`);

      // Return updated campaign
      return await this.getCampaign(campaignId);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to update campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      await this.rateLimiter.checkLimit(`campaigns:delete:${campaignId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${campaignId}`, {
          method: 'DELETE',
        });
      });

      await this.rateLimiter.trackUsage(`campaigns:delete:${campaignId}`);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to delete campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<Campaign> {
    return this.updateCampaign(campaignId, { status: 'PAUSED' });
  }

  /**
   * Resume a campaign
   */
  async resumeCampaign(campaignId: string): Promise<Campaign> {
    return this.updateCampaign(campaignId, { status: 'ACTIVE' });
  }

  /**
   * Archive a campaign
   */
  async archiveCampaign(campaignId: string): Promise<Campaign> {
    return this.updateCampaign(campaignId, { status: 'ARCHIVED' });
  }

  /**
   * Duplicate a campaign
   */
  async duplicateCampaign(
    campaignId: string,
    newName: string,
    modifications?: Partial<CampaignCreateParams>
  ): Promise<Campaign> {
    try {
      // Get original campaign
      const original = await this.getCampaign(campaignId, [
        'id',
        'name',
        'objective',
        'buying_type',
        'daily_budget',
        'lifetime_budget',
        'bid_strategy',
        'special_ad_categories',
        'promoted_object',
        'account_id',
      ]);

      // Extract account ID
      const accountId = original.account_id?.replace('act_', '') || '';

      // Create new campaign with original settings + modifications
      const newCampaignParams: CampaignCreateParams = {
        name: newName,
        objective: original.objective,
        buying_type: original.buying_type,
        daily_budget: original.daily_budget,
        lifetime_budget: original.lifetime_budget,
        bid_strategy: original.bid_strategy as
          | 'LOWEST_COST_WITHOUT_CAP'
          | 'LOWEST_COST_WITH_BID_CAP'
          | 'COST_CAP'
          | undefined,
        special_ad_categories: original.special_ad_categories,
        promoted_object: original.promoted_object,
        ...modifications,
      };

      return await this.createCampaign(accountId, newCampaignParams);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to duplicate campaign: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get campaign budget utilization
   */
  async getCampaignBudgetUtilization(campaignId: string): Promise<{
    daily_budget: string;
    lifetime_budget: string;
    budget_remaining: string;
    budget_spent_percentage: number;
  }> {
    try {
      const campaign = await this.getCampaign(campaignId, [
        'daily_budget',
        'lifetime_budget',
        'budget_remaining',
      ]);

      const spent = campaign.lifetime_budget
        ? parseFloat(campaign.lifetime_budget) - parseFloat(campaign.budget_remaining || '0')
        : 0;

      const percentage = campaign.lifetime_budget
        ? (spent / parseFloat(campaign.lifetime_budget)) * 100
        : 0;

      return {
        daily_budget: campaign.daily_budget || '0',
        lifetime_budget: campaign.lifetime_budget || '0',
        budget_remaining: campaign.budget_remaining || '0',
        budget_spent_percentage: Math.round(percentage * 100) / 100,
      };
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get budget utilization: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Batch update multiple campaigns
   */
  async batchUpdateCampaigns(
    updates: Array<{ campaignId: string; params: CampaignUpdateParams }>
  ): Promise<Array<{ campaignId: string; success: boolean; error?: string }>> {
    const results = [];

    for (const update of updates) {
      try {
        await this.updateCampaign(update.campaignId, update.params);
        results.push({ campaignId: update.campaignId, success: true });
      } catch (error) {
        results.push({
          campaignId: update.campaignId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }
}
