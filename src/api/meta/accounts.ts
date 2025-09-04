/**
 * Meta Business API Accounts Service
 * Handles operations for ad accounts
 */

import { type MetaAPIClient } from './client';
import { type AdAccount, type MetaAPIResponse } from './types';
import { MetaAPIError } from './errors';

export class MetaAccountsService {
  constructor(private client: MetaAPIClient) {}

  /**
   * List accessible ad accounts
   */
  async list(accessToken: string): Promise<AdAccount[]> {
    try {
      const response = await this.client.request<{ data: AdAccount[] }>('/me/adaccounts', {
        method: 'GET',
        params: {
          access_token: accessToken,
          fields: 'id,account_id,name,currency,account_status,business,timezone_name',
        },
      });

      return response.data || [];
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to list ad accounts: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get a single ad account by ID
   */
  async get(accountId: string, accessToken: string): Promise<AdAccount> {
    try {
      const response = await this.client.request<AdAccount>(`/act_${accountId}`, {
        method: 'GET',
        params: {
          access_token: accessToken,
          fields:
            'id,account_id,name,currency,account_status,business,timezone_name,spend_cap,amount_spent',
        },
      });

      return response;
    } catch (error) {
      if (error instanceof MetaAPIError) {
        throw error;
      }
      throw new MetaAPIError(`Failed to get ad account: ${(error as Error).message}`, 500);
    }
  }
}
