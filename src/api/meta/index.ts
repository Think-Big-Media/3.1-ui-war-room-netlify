// Meta Business API client exports

export * from './types';
export * from './errors';
export { MetaAuthManager } from './auth';
export { MetaRateLimiter } from './rateLimiter';
export { MetaCircuitBreaker } from './circuitBreaker';
export { MetaAPIClient } from './client';
export { MetaInsightsService } from './insights';
export { MetaAccountsService } from './accounts';
export { MetaCampaignService } from './campaigns';

// Convenience factory function
import { type MetaConfig } from './types';
import { MetaAuthManager } from './auth';
import { MetaRateLimiter } from './rateLimiter';
import { MetaCircuitBreaker } from './circuitBreaker';
import { MetaAPIClient } from './client';
import { MetaInsightsService } from './insights';
import { MetaAccountsService } from './accounts';
import { MetaCampaignService } from './campaigns';

export interface MetaAPIOptions {
  config: MetaConfig;
  rateLimiterConfig?: any;
  circuitBreakerConfig?: any;
}

export function createMetaAPI(options: MetaAPIOptions): {
  auth: MetaAuthManager;
  client: MetaAPIClient;
  insights: MetaInsightsService;
  accounts: MetaAccountsService;
  campaigns: MetaCampaignService;
} {
  const auth = new MetaAuthManager(options.config);
  const rateLimiter = new MetaRateLimiter(options.rateLimiterConfig);
  const circuitBreaker = new MetaCircuitBreaker(options.circuitBreakerConfig);
  const client = new MetaAPIClient(options.config, auth, rateLimiter, circuitBreaker);
  const insights = new MetaInsightsService(client);
  const accounts = new MetaAccountsService(client);
  const campaigns = new MetaCampaignService(client, rateLimiter, circuitBreaker);

  return {
    auth,
    client,
    insights,
    accounts,
    campaigns,
  };
}
