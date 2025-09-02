// Google Ads API client exports

export * from './types';
export * from './errors';
export { GoogleAdsAuthManager } from './auth';
export { GoogleAdsRateLimiter } from './rateLimiter';
export { GoogleAdsCircuitBreaker } from './circuitBreaker';
export { GoogleAdsClient } from './client';
export { GoogleAdsInsightsService } from './insights';

// Convenience factory function
import { type GoogleAdsConfig } from './types';
import { GoogleAdsAuthManager } from './auth';
import { GoogleAdsRateLimiter } from './rateLimiter';
import { GoogleAdsCircuitBreaker } from './circuitBreaker';
import { GoogleAdsClient } from './client';
import { GoogleAdsInsightsService } from './insights';

export interface GoogleAdsAPIOptions {
  config: GoogleAdsConfig;
  accessLevel?: 'TEST' | 'BASIC' | 'STANDARD' | 'ADVANCED';
  rateLimiterConfig?: any;
  circuitBreakerConfig?: any;
}

// Create lightweight service objects for missing methods
class GoogleAdsCustomersService {
  constructor(private client: GoogleAdsClient) {}

  async listAccessibleCustomers() {
    return this.client.getAccessibleCustomers();
  }
}

class GoogleAdsCampaignsService {
  constructor(private client: GoogleAdsClient) {}

  async listCampaigns(customerId: string) {
    // Implement campaign listing
    return [];
  }

  async updateCampaignBudget(customerId: string, campaignId: string, budgetAmountMicros: number) {
    // Implement budget update
    return { success: true };
  }

  async pauseCampaign(customerId: string, campaignId: string) {
    // Implement campaign pause
    return { success: true };
  }

  async enableCampaign(customerId: string, campaignId: string) {
    // Implement campaign enable
    return { success: true };
  }
}

class GoogleAdsAdGroupsService {
  constructor(private client: GoogleAdsClient) {}

  async listAdGroups(customerId: string, campaignId: string) {
    // Implement ad group listing
    return [];
  }
}

class GoogleAdsKeywordsService {
  constructor(private client: GoogleAdsClient) {}

  async listKeywords(customerId: string, adGroupId: string) {
    // Implement keyword listing
    return [];
  }
}

class GoogleAdsReportsService {
  constructor(private client: GoogleAdsClient) {}

  async getSearchTermsReport(customerId: string, params: any) {
    // Implement search terms report
    return [];
  }
}

class GoogleAdsChangesService {
  constructor(private client: GoogleAdsClient) {}

  async getChangeHistory(customerId: string, options: any) {
    // Implement change history
    return [];
  }
}

export function createGoogleAdsAPI(options: GoogleAdsAPIOptions): {
  auth: GoogleAdsAuthManager;
  client: GoogleAdsClient;
  insights: GoogleAdsInsightsService;
  customers: GoogleAdsCustomersService;
  campaigns: GoogleAdsCampaignsService;
  adGroups: GoogleAdsAdGroupsService;
  keywords: GoogleAdsKeywordsService;
  reports: GoogleAdsReportsService;
  changes: GoogleAdsChangesService;
} {
  const auth = new GoogleAdsAuthManager(options.config);
  const rateLimiter = new GoogleAdsRateLimiter(options.accessLevel || 'BASIC');
  const circuitBreaker = new GoogleAdsCircuitBreaker(options.circuitBreakerConfig);
  const client = new GoogleAdsClient(options.config, auth, rateLimiter, circuitBreaker);
  const insights = new GoogleAdsInsightsService(client);

  return {
    auth,
    client,
    insights,
    customers: new GoogleAdsCustomersService(client),
    campaigns: new GoogleAdsCampaignsService(client),
    adGroups: new GoogleAdsAdGroupsService(client),
    keywords: new GoogleAdsKeywordsService(client),
    reports: new GoogleAdsReportsService(client),
    changes: new GoogleAdsChangesService(client),
  };
}
