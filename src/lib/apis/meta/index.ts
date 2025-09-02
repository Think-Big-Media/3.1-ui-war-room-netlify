/**
 * Meta Business API Integration
 * Main export file
 */

export * from './types';
export * from './auth';
export * from './client';
export * from './endpoints';
export * from './rateLimiter';
export * from './cache';

import { createMetaAuth } from './auth';
import { createMetaApiClient } from './client';
import { createMetaEndpoints } from './endpoints';
import { type MetaConfig } from './types';

/**
 * Create complete Meta API instance
 */
export function createMetaApi(config?: Partial<MetaConfig>) {
  const auth = createMetaAuth(config);
  const client = createMetaApiClient(config);
  const endpoints = createMetaEndpoints(client);

  return {
    auth,
    client,
    endpoints,
    // Convenience methods
    getAuthUrl: (state: string, scopes?: string[]) => auth.getAuthorizationUrl(state, scopes),
    exchangeCode: (code: string) => auth.exchangeCodeForToken(code),
    setToken: (token: any) => auth.setToken(token),
    // Direct endpoint access
    getAdAccounts: () => endpoints.getAdAccounts(),
    getCampaigns: (accountId: string) => endpoints.getCampaigns(accountId),
    getAccountInsights: (accountId: string, params?: any) =>
      endpoints.getAccountInsights(accountId, params),
    getCampaignInsights: (campaignId: string, params?: any) =>
      endpoints.getCampaignInsights(campaignId, params),
    getAggregatedInsights: (accountId: string, campaignIds?: string[], params?: any) =>
      endpoints.getAggregatedInsights(accountId, campaignIds, params),
  };
}

// Default instance (can be used directly)
export const metaApi = createMetaApi();
