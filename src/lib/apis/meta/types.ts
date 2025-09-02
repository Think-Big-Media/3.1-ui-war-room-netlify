/**
 * Meta Business API Types
 * Facebook Marketing API v19.0
 */

export interface MetaConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  apiVersion: string;
}

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface MetaUser {
  id: string;
  name: string;
  email?: string;
}

export interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business?: {
    id: string;
    name: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  updated_time: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface InsightMetric {
  spend: string;
  impressions: string;
  clicks: string;
  cpm: string;
  cpc: string;
  ctr: string;
  conversions?: string;
  cost_per_conversion?: string;
}

export interface InsightData extends InsightMetric {
  date_start: string;
  date_stop: string;
  account_id?: string;
  campaign_id?: string;
  campaign_name?: string;
}

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface RateLimitInfo {
  callCount: number;
  totalTime: number;
  totalCPUTime: number;
  type: string;
}

export interface MetaApiResponse<T> {
  data: T;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
  error?: MetaApiError;
  headers?: {
    'x-business-use-case-usage'?: Record<string, RateLimitInfo[]>;
    'x-app-usage'?: string;
    'x-fb-trace-id'?: string;
  };
}

export interface InsightParams {
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  fields?: string[];
  date_preset?: string;
  time_range?: {
    since: string;
    until: string;
  };
  filtering?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  breakdowns?: string[];
  sort?: string[];
  limit?: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of entries
  namespace: string;
}
