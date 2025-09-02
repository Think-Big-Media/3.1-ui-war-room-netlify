/**
 * Meta Business API Audience Management Service
 * Handles custom audiences, lookalike audiences, and saved audiences
 */

import { type MetaAPIClient } from './client';
import {
  type CustomAudience,
  type LookalikeAudience,
  type SavedAudience,
  type MetaAPIResponse,
} from './types';
import { MetaAPIError } from './errors';
import { type RateLimiter } from './rateLimiter';
import { type CircuitBreaker } from './circuitBreaker';

export interface CustomAudienceCreateParams {
  name: string;
  description?: string;
  subtype:
    | 'CUSTOM'
    | 'WEBSITE'
    | 'APP'
    | 'OFFLINE_CONVERSION'
    | 'CLAIM'
    | 'PARTNER'
    | 'MANAGED'
    | 'VIDEO'
    | 'LOOKALIKE'
    | 'ENGAGEMENT'
    | 'DATA_SET'
    | 'BAG_OF_ACCOUNTS'
    | 'STUDY_RULE_AUDIENCE'
    | 'FOX';
  customer_file_source?: 'USER_PROVIDED' | 'PARTNER_PROVIDED' | 'BOTH_USER_AND_PARTNER_PROVIDED';
  retention_days?: number; // 1-180 days
  rule?: AudienceRule;
  pixel_id?: string;
  prefill?: boolean;
  is_value_based?: boolean;
  opt_out_link?: string;
}

export interface AudienceRule {
  inclusions?: RuleItem;
  exclusions?: RuleItem;
}

export interface RuleItem {
  operator: 'or' | 'and';
  rules: Array<{
    event_sources?: Array<{ id: string; type: string }>;
    retention_seconds?: number;
    filter?: {
      operator: 'and' | 'or';
      filters: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    };
  }>;
}

export interface CustomAudienceUpdateParams {
  name?: string;
  description?: string;
  opt_out_link?: string;
  retention_days?: number;
}

export interface LookalikeAudienceCreateParams {
  name: string;
  origin_audience_id: string;
  lookalike_spec: {
    type: 'similarity' | 'reach';
    country: string;
    ratio?: number; // 0.01 to 0.20 (1% to 20%)
    starting_ratio?: number;
    ending_ratio?: number;
  };
  subtype?: 'LOOKALIKE';
}

export interface SavedAudienceCreateParams {
  name: string;
  description?: string;
  targeting: {
    geo_locations?: any;
    age_min?: number;
    age_max?: number;
    genders?: number[];
    interests?: Array<{ id: string; name: string }>;
    behaviors?: Array<{ id: string; name: string }>;
    custom_audiences?: Array<{ id: string }>;
    excluded_custom_audiences?: Array<{ id: string }>;
  };
}

export interface AudienceListParams {
  fields?: string[];
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  limit?: number;
  after?: string;
}

export interface AudienceInsightsParams {
  fields?: string[];
  targeting_spec?: any;
  date_preset?: string;
  time_range?: {
    since: string;
    until: string;
  };
}

export class MetaAudienceService {
  constructor(
    private client: MetaAPIClient,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker
  ) {}

  /**
   * Create a custom audience
   */
  async createCustomAudience(
    accountId: string,
    params: CustomAudienceCreateParams
  ): Promise<CustomAudience> {
    try {
      // Validate required fields
      if (!params.name) {
        throw new MetaAPIError('name is required', 400);
      }
      if (!params.subtype) {
        throw new MetaAPIError('subtype is required', 400);
      }

      // Check rate limits
      await this.rateLimiter.checkLimit(`audiences:create:${accountId}`);

      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ id: string }>(`/act_${accountId}/customaudiences`, {
          method: 'POST',
          body: {
            ...params,
            ...(params.rule && { rule: JSON.stringify(params.rule) }),
          },
        });
      });

      // Track usage
      await this.rateLimiter.trackUsage(`audiences:create:${accountId}`);

      // Fetch the created audience details
      return await this.getCustomAudience(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to create custom audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Create a lookalike audience
   */
  async createLookalikeAudience(
    accountId: string,
    params: LookalikeAudienceCreateParams
  ): Promise<LookalikeAudience> {
    try {
      // Validate required fields
      if (!params.name) {
        throw new MetaAPIError('name is required', 400);
      }
      if (!params.origin_audience_id) {
        throw new MetaAPIError('origin_audience_id is required', 400);
      }
      if (!params.lookalike_spec) {
        throw new MetaAPIError('lookalike_spec is required', 400);
      }

      // Check rate limits
      await this.rateLimiter.checkLimit(`lookalike:create:${accountId}`);

      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ id: string }>(`/act_${accountId}/customaudiences`, {
          method: 'POST',
          body: {
            name: params.name,
            subtype: 'LOOKALIKE',
            origin_audience_id: params.origin_audience_id,
            lookalike_spec: JSON.stringify(params.lookalike_spec),
          },
        });
      });

      // Track usage
      await this.rateLimiter.trackUsage(`lookalike:create:${accountId}`);

      // Fetch the created audience details
      return await this.getLookalikeAudience(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(
        `Failed to create lookalike audience: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Create a saved audience
   */
  async createSavedAudience(
    accountId: string,
    params: SavedAudienceCreateParams
  ): Promise<SavedAudience> {
    try {
      // Validate required fields
      if (!params.name) {
        throw new MetaAPIError('name is required', 400);
      }
      if (!params.targeting) {
        throw new MetaAPIError('targeting is required', 400);
      }

      // Check rate limits
      await this.rateLimiter.checkLimit(`saved:create:${accountId}`);

      // Execute through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<{ id: string }>(`/act_${accountId}/saved_audiences`, {
          method: 'POST',
          body: {
            name: params.name,
            description: params.description,
            targeting: JSON.stringify(params.targeting),
          },
        });
      });

      // Track usage
      await this.rateLimiter.trackUsage(`saved:create:${accountId}`);

      // Fetch the created audience details
      return await this.getSavedAudience(response.id);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to create saved audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a custom audience by ID
   */
  async getCustomAudience(
    audienceId: string,
    fields: string[] = [
      'id',
      'name',
      'description',
      'subtype',
      'time_created',
      'time_updated',
      'approximate_count',
      'retention_days',
      'customer_file_source',
      'delivery_status',
      'operation_status',
      'permission_for_actions',
    ]
  ): Promise<CustomAudience> {
    try {
      await this.rateLimiter.checkLimit(`audiences:read:${audienceId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<CustomAudience>(`/${audienceId}?fields=${fields.join(',')}`);
      });

      await this.rateLimiter.trackUsage(`audiences:read:${audienceId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get custom audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a lookalike audience by ID
   */
  async getLookalikeAudience(audienceId: string, fields?: string[]): Promise<LookalikeAudience> {
    const defaultFields = [
      'id',
      'name',
      'subtype',
      'lookalike_spec',
      'origin_audience_id',
      'time_created',
      'time_updated',
      'approximate_count',
    ];

    return this.getCustomAudience(
      audienceId,
      fields || defaultFields
    ) as Promise<LookalikeAudience>;
  }

  /**
   * Get a saved audience by ID
   */
  async getSavedAudience(
    audienceId: string,
    fields: string[] = [
      'id',
      'name',
      'description',
      'targeting',
      'time_created',
      'time_updated',
      'approximate_count',
    ]
  ): Promise<SavedAudience> {
    try {
      await this.rateLimiter.checkLimit(`saved:read:${audienceId}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<SavedAudience>(`/${audienceId}?fields=${fields.join(',')}`);
      });

      await this.rateLimiter.trackUsage(`saved:read:${audienceId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get saved audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * List custom audiences for an ad account
   */
  async listCustomAudiences(
    accountId: string,
    params: AudienceListParams = {}
  ): Promise<MetaAPIResponse<CustomAudience[]>> {
    try {
      await this.rateLimiter.checkLimit(`audiences:list:${accountId}`);

      const defaultFields = [
        'id',
        'name',
        'description',
        'subtype',
        'approximate_count',
        'time_created',
        'time_updated',
        'delivery_status',
      ];

      const response = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          fields: (params.fields || defaultFields).join(','),
          limit: String(params.limit || 25),
          ...(params.after && { after: params.after }),
          ...(params.filtering && { filtering: JSON.stringify(params.filtering) }),
        });
        return this.client.request<MetaAPIResponse<CustomAudience[]>>(
          `/act_${accountId}/customaudiences?${queryParams}`
        );
      });

      await this.rateLimiter.trackUsage(`audiences:list:${accountId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to list custom audiences: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Update a custom audience
   */
  async updateCustomAudience(
    audienceId: string,
    params: CustomAudienceUpdateParams
  ): Promise<CustomAudience> {
    try {
      await this.rateLimiter.checkLimit(`audiences:update:${audienceId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${audienceId}`, {
          method: 'POST',
          body: {
            ...params,
          },
        });
      });

      await this.rateLimiter.trackUsage(`audiences:update:${audienceId}`);

      // Return updated audience
      return await this.getCustomAudience(audienceId);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to update custom audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Delete a custom audience
   */
  async deleteCustomAudience(audienceId: string): Promise<void> {
    try {
      await this.rateLimiter.checkLimit(`audiences:delete:${audienceId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${audienceId}`, {
          method: 'DELETE',
        });
      });

      await this.rateLimiter.trackUsage(`audiences:delete:${audienceId}`);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to delete custom audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Add users to a custom audience
   */
  async addUsersToAudience(
    audienceId: string,
    users: Array<{
      email?: string;
      phone?: string;
      madid?: string;
      fn?: string; // First name
      ln?: string; // Last name
      ct?: string; // City
      st?: string; // State
      zip?: string;
      country?: string;
    }>,
    schema: string[] = ['EMAIL', 'PHONE']
  ): Promise<{ audience_id: string; session_id: string; num_received: number }> {
    try {
      await this.rateLimiter.checkLimit(`audiences:add_users:${audienceId}`);

      // Hash user data as required by Meta
      const hashedUsers = users.map((user) => {
        const hashedUser: any = [];
        schema.forEach((field) => {
          const value = user[field.toLowerCase() as keyof typeof user];
          if (value) {
            // In production, implement proper hashing (SHA256)
            hashedUser.push(this.hashValue(value));
          } else {
            hashedUser.push(null);
          }
        });
        return hashedUser;
      });

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<any>(`/${audienceId}/users`, {
          method: 'POST',
          body: {
            payload: {
              schema,
              data: hashedUsers,
            },
          },
        });
      });

      await this.rateLimiter.trackUsage(`audiences:add_users:${audienceId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to add users to audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Remove users from a custom audience
   */
  async removeUsersFromAudience(
    audienceId: string,
    users: Array<{ email?: string; phone?: string }>,
    schema: string[] = ['EMAIL', 'PHONE']
  ): Promise<{ audience_id: string; session_id: string; num_received: number }> {
    try {
      await this.rateLimiter.checkLimit(`audiences:remove_users:${audienceId}`);

      // Hash user data
      const hashedUsers = users.map((user) => {
        const hashedUser: any = [];
        schema.forEach((field) => {
          const value = user[field.toLowerCase() as keyof typeof user];
          if (value) {
            hashedUser.push(this.hashValue(value));
          } else {
            hashedUser.push(null);
          }
        });
        return hashedUser;
      });

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<any>(`/${audienceId}/users`, {
          method: 'DELETE',
          body: {
            payload: {
              schema,
              data: hashedUsers,
            },
          },
        });
      });

      await this.rateLimiter.trackUsage(`audiences:remove_users:${audienceId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(
        `Failed to remove users from audience: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Get audience insights
   */
  async getAudienceInsights(accountId: string, params: AudienceInsightsParams = {}): Promise<any> {
    try {
      await this.rateLimiter.checkLimit(`insights:audience:${accountId}`);

      const response = await this.circuitBreaker.execute(async () => {
        const queryParams = new URLSearchParams({
          ...(params.fields && { fields: params.fields.join(',') }),
          ...(params.targeting_spec && {
            targeting_spec: JSON.stringify(params.targeting_spec),
          }),
          ...(params.date_preset && { date_preset: params.date_preset }),
          ...(params.time_range && { time_range: JSON.stringify(params.time_range) }),
        });
        return this.client.request<any>(`/act_${accountId}/audience_insights?${queryParams}`);
      });

      await this.rateLimiter.trackUsage(`insights:audience:${accountId}`);
      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get audience insights: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Share an audience with another ad account
   */
  async shareAudience(audienceId: string, targetAccountIds: string[]): Promise<void> {
    try {
      await this.rateLimiter.checkLimit(`audiences:share:${audienceId}`);

      await this.circuitBreaker.execute(async () => {
        return this.client.request(`/${audienceId}/adaccounts`, {
          method: 'POST',
          body: {
            adaccounts: targetAccountIds,
          },
        });
      });

      await this.rateLimiter.trackUsage(`audiences:share:${audienceId}`);
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to share audience: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get audience overlap between two audiences
   */
  async getAudienceOverlap(
    audienceId1: string,
    audienceId2: string
  ): Promise<{ overlap_count: number; overlap_percentage: number }> {
    try {
      await this.rateLimiter.checkLimit(`audiences:overlap:${audienceId1}`);

      const response = await this.circuitBreaker.execute(async () => {
        return this.client.request<any>(
          `/${audienceId1}/audienceoverlap?comparison_audience_id=${audienceId2}`
        );
      });

      await this.rateLimiter.trackUsage(`audiences:overlap:${audienceId1}`);
      return {
        overlap_count: response.data?.overlap_count || 0,
        overlap_percentage: response.data?.overlap_percentage || 0,
      };
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get audience overlap: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Helper method to hash values (simplified - use proper SHA256 in production)
   */
  private hashValue(value: string): string {
    // This is a simplified version. In production, use proper SHA256 hashing
    // and normalize the data according to Meta's requirements
    return value.toLowerCase().trim();
  }
}
