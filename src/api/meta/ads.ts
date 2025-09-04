/**
 * Meta Business API Ad Management Service
 * Handles CRUD operations for ads within ad sets
 */

import { type MetaAPIClient } from './client';
import { type Ad, type MetaAPIResponse, type Creative } from './types';
import { MetaAPIError } from './errors';
import { type RateLimiter } from './rateLimiter';
import { type CircuitBreaker } from './circuitBreaker';

export interface AdCreateParams {
  name: string;
  adset_id: string;
  creative: AdCreativeParams;
  status?: 'ACTIVE' | 'PAUSED';
  tracking_specs?: TrackingSpec[];
  conversion_specs?: ConversionSpec[];
  bid_amount?: string; // In cents
  billing_event?: 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT' | 'VIDEO_VIEWS';
}

export interface AdCreativeParams {
  name: string;
  object_story_spec?: {
    page_id: string;
    link_data?: {
      link: string;
      message: string;
      name?: string;
      description?: string;
      call_to_action?: {
        type: string;
        value: {
          link?: string;
          app_link?: string;
        };
      };
    };
    photo_data?: {
      image_hash: string;
      caption?: string;
    };
    video_data?: {
      video_id: string;
      message?: string;
      title?: string;
      call_to_action?: {
        type: string;
        value: {
          link?: string;
        };
      };
    };
  };
  title?: string;
  body?: string;
  link_url?: string;
  image_url?: string;
  video_id?: string;
}

export interface TrackingSpec {
  action_type: string[];
  fb_pixel?: string[];
  application?: string[];
  post?: string[];
  page?: string[];
}

export interface ConversionSpec {
  action_type: string[];
  fb_pixel?: string[];
  application?: string[];
}

export interface AdUpdateParams {
  name?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  bid_amount?: string;
  creative?: { creative_id: string };
  tracking_specs?: TrackingSpec[];
}

export interface AdListParams {
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

export interface AdInsightsParams {
  fields?: string[];
  date_preset?: string;
  time_range?: {
    since: string;
    until: string;
  };
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  breakdowns?: string[];
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

export class MetaAdService {
  constructor(
    private client: MetaAPIClient,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker
  ) {}

  /**
   * Create a new ad
   */
  async createAd(accountId: string, params: AdCreateParams): Promise<Ad> {
    try {
      // Check rate limits
      await this.rateLimiter.checkLimit(`ads:create:${accountId}`);

      // First create the creative if provided inline
      let creativeId: string;
      if (params.creative) {
        const creative = await this.createAdCreative(accountId, params.creative);
        creativeId = creative.id;
      }

      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ id: string }>(`act_${accountId}/ads`, {
          method: 'POST',
          body: {
            name: params.name,
            adset_id: params.adset_id,
            creative: { creative_id: creativeId },
            status: params.status || 'PAUSED',
            tracking_specs: params.tracking_specs,
            conversion_specs: params.conversion_specs,
            bid_amount: params.bid_amount,
            billing_event: params.billing_event,
          },
        });
      });

      // Track usage
      await this.rateLimiter.trackUsage(`ads:create:${accountId}`);

      // Fetch the created ad details
      return await this.getAd(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(
        `Failed to create ad: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Create an ad creative
   */
  async createAdCreative(accountId: string, params: AdCreativeParams): Promise<Creative> {
    try {
      await this.rateLimiter.checkLimit(`creatives:create:${accountId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ id: string }>(`act_${accountId}/adcreatives`, {
          method: 'POST',
          body: {
            ...params,
          },
        });
      });

      // Fetch the created creative details
      return await this.getAdCreative(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(
        `Failed to create ad creative: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }

  /**
   * Get a single ad by ID
   */
  async getAd(
    adId: string,
    fields: string[] = [
      'id',
      'name',
      'status',
      'effective_status',
      'creative',
      'adset_id',
      'campaign_id',
      'created_time',
      'updated_time',
      'bid_amount',
      'billing_event',
      'tracking_specs',
      'conversion_specs',
    ]
  ): Promise<Ad> {
    try {
      await this.rateLimiter.checkLimit(`ads:read:${adId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<Ad>(`${adId}`, {
          method: 'GET',
          params: {
            fields: fields.join(','),
          },
        });
      });

      await this.rateLimiter.trackUsage(`ads:read:${adId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get ad: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get an ad creative by ID
   */
  async getAdCreative(
    creativeId: string,
    fields: string[] = [
      'id',
      'name',
      'object_story_spec',
      'title',
      'body',
      'image_url',
      'link_url',
      'video_id',
      'call_to_action_type',
      'effective_object_story_id',
    ]
  ): Promise<Creative> {
    try {
      await this.rateLimiter.checkLimit(`creatives:read:${creativeId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<Creative>(`/${creativeId}?fields=${fields.join(',')}`);
      });

      await this.rateLimiter.trackUsage(`creatives:read:${creativeId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get ad creative: ${(error as Error).message}`, 500);
    }
  }

  /**
   * List ads for an ad account or ad set
   */
  async listAds(
    parentId: string,
    parentType: 'account' | 'adset',
    params: AdListParams = {}
  ): Promise<MetaAPIResponse<Ad[]>> {
    try {
      await this.rateLimiter.checkLimit(`ads:list:${parentId}`);

      const defaultFields = [
        'id',
        'name',
        'status',
        'effective_status',
        'creative',
        'created_time',
        'updated_time',
      ];

      const path = parentType === 'account' ? `/act_${parentId}/ads` : `/${parentId}/ads`;

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
        return this.client.request<MetaAPIResponse<Ad[]>>(`${path}?${queryParams.toString()}`);
      });

      await this.rateLimiter.trackUsage(`ads:list:${parentId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to list ads: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update an existing ad
   */
  async updateAd(adId: string, params: AdUpdateParams): Promise<Ad> {
    try {
      await this.rateLimiter.checkLimit(`ads:update:${adId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${adId}`, {
          method: 'POST',
          body: params,
        });
      });

      await this.rateLimiter.trackUsage(`ads:update:${adId}`);

      // Return updated ad
      return await this.getAd(adId);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to update ad: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete an ad
   */
  async deleteAd(adId: string): Promise<void> {
    try {
      await this.rateLimiter.checkLimit(`ads:delete:${adId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${adId}`, { method: 'DELETE' });
      });

      await this.rateLimiter.trackUsage(`ads:delete:${adId}`);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to delete ad: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Pause an ad
   */
  async pauseAd(adId: string): Promise<Ad> {
    return this.updateAd(adId, { status: 'PAUSED' });
  }

  /**
   * Resume an ad
   */
  async resumeAd(adId: string): Promise<Ad> {
    return this.updateAd(adId, { status: 'ACTIVE' });
  }

  /**
   * Archive an ad
   */
  async archiveAd(adId: string): Promise<Ad> {
    return this.updateAd(adId, { status: 'ARCHIVED' });
  }

  /**
   * Get ad insights/analytics
   */
  async getAdInsights(
    adId: string,
    params: AdInsightsParams = {}
  ): Promise<MetaAPIResponse<any[]>> {
    try {
      await this.rateLimiter.checkLimit(`ads:insights:${adId}`);

      const defaultFields = [
        'impressions',
        'clicks',
        'spend',
        'reach',
        'frequency',
        'ctr',
        'cpc',
        'cpm',
        'cpp',
        'actions',
        'conversions',
        'conversion_values',
      ];

      const response = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          fields: (params.fields || defaultFields).join(','),
          ...(params.date_preset && { date_preset: params.date_preset }),
          ...(params.time_range && { time_range: JSON.stringify(params.time_range) }),
          ...(params.level && { level: params.level }),
          ...(params.breakdowns && { breakdowns: params.breakdowns.join(',') }),
          ...(params.filtering && { filtering: JSON.stringify(params.filtering) }),
        });
        return this.client.request<MetaAPIResponse<any[]>>(
          `/${adId}/insights?${queryParams.toString()}`
        );
      });

      await this.rateLimiter.trackUsage(`ads:insights:${adId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get ad insights: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Duplicate an ad
   */
  async duplicateAd(
    adId: string,
    newName: string,
    targetAdSetId?: string,
    modifications?: Partial<AdCreateParams>
  ): Promise<Ad> {
    try {
      // Get original ad
      const original = await this.getAd(adId, [
        'id',
        'name',
        'adset_id',
        'creative',
        'status',
        'tracking_specs',
        'conversion_specs',
        'bid_amount',
        'billing_event',
      ]);

      // Extract account ID from ad set
      const adsetResponse = await this.client.request<{ account_id: string }>(
        `/${original.adset_id}?fields=account_id`
      );

      const accountId = adsetResponse.account_id.replace('act_', '');

      // Create new ad with original settings + modifications
      const newAdParams: AdCreateParams = {
        name: newName,
        adset_id: targetAdSetId || original.adset_id,
        creative: (original.creative as any)?.creative_id || '',
        status: 'PAUSED', // Always create as paused
        tracking_specs: original.tracking_specs as TrackingSpec[],
        conversion_specs: original.conversion_specs,
        bid_amount: original.bid_amount,
        billing_event: original.billing_event,
        ...modifications,
      };

      return await this.createAd(accountId, newAdParams);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to duplicate ad: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get ad preview
   */
  async getAdPreview(
    adId: string,
    format:
      | 'DESKTOP_FEED_STANDARD'
      | 'MOBILE_FEED_STANDARD'
      | 'INSTAGRAM_STANDARD' = 'DESKTOP_FEED_STANDARD'
  ): Promise<{ body: string }> {
    try {
      await this.rateLimiter.checkLimit(`ads:preview:${adId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ body: string }>(`/${adId}/previews?ad_format=${format}`);
      });

      await this.rateLimiter.trackUsage(`ads:preview:${adId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get ad preview: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Batch create multiple ads
   */
  async batchCreateAds(
    accountId: string,
    ads: AdCreateParams[]
  ): Promise<Array<{ id?: string; success: boolean; error?: string }>> {
    const results = [];

    for (const ad of ads) {
      try {
        const created = await this.createAd(accountId, ad);
        results.push({ id: created.id, success: true });
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Get ad performance summary
   */
  async getAdPerformanceSummary(
    adId: string,
    datePreset = 'last_7d'
  ): Promise<{
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
  }> {
    try {
      const insights = await this.getAdInsights(adId, {
        date_preset: datePreset,
        fields: ['impressions', 'clicks', 'spend', 'ctr', 'cpc', 'actions', 'purchase_roas'],
      });

      const data = insights.data[0] || {};
      const conversions =
        data.actions?.find((action: any) => action.action_type === 'purchase')?.value || 0;

      return {
        impressions: parseInt(data.impressions || '0'),
        clicks: parseInt(data.clicks || '0'),
        spend: parseFloat(data.spend || '0'),
        ctr: parseFloat(data.ctr || '0'),
        cpc: parseFloat(data.cpc || '0'),
        conversions: parseInt(conversions),
        roas: parseFloat(data.purchase_roas?.[0]?.value || '0'),
      };
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(
        `Failed to get ad performance summary: ${(error as Error).message}`,
        500
      );
    }
  }
}
