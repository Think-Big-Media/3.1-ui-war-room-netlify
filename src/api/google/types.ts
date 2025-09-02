// Google Ads API TypeScript Type Definitions

export interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  loginCustomerId?: string;
  apiVersion: string;
  redirectUri: string;
}

export interface GoogleOAuthToken {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in?: number;
  expires_at?: number;
}

export interface GoogleAdsError {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      '@type': string;
      errors?: Array<{
        errorCode: {
          [key: string]: string;
        };
        message: string;
        trigger?: {
          stringValue?: string;
        };
        location?: {
          fieldPathElements: Array<{
            fieldName: string;
            index?: number;
          }>;
        };
      }>;
      requestId?: string;
    }>;
  };
}

export interface GoogleAdsHeaders {
  'developer-token': string;
  'login-customer-id'?: string;
  Authorization: string;
  'Content-Type': string;
}

export interface CustomerQuery {
  query: string;
  pageSize?: number;
  pageToken?: string;
  validateOnly?: boolean;
  returnTotalResultsCount?: boolean;
}

export interface SearchGoogleAdsResponse<T> {
  results: T[];
  nextPageToken?: string;
  totalResultsCount?: string;
  fieldMask?: string;
}

export interface Campaign {
  resourceName: string;
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED' | 'UNKNOWN' | 'UNSPECIFIED';
  servingStatus: string;
  advertisingChannelType: string;
  advertisingChannelSubType?: string;
  campaignBudget?: string;
  biddingStrategy?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdGroup {
  resourceName: string;
  id: string;
  name: string;
  campaign: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED' | 'UNKNOWN' | 'UNSPECIFIED';
  type: string;
  cpcBidMicros?: string;
  cpmBidMicros?: string;
}

export interface Metrics {
  clicks: string;
  impressions: string;
  costMicros: string;
  conversions: number;
  allConversions: number;
  viewThroughConversions: string;
  ctr: number;
  averageCpc: number;
  averageCpm: number;
  averageCpv?: number;
  averageCpe?: number;
  conversionRate?: number;
  costPerConversion?: number;
  conversionsFromInteractionsRate?: number;
  videoViews?: string;
  videoViewRate?: number;
  averagePageViews?: number;
  searchImpressionShare?: number;
  searchBudgetLostImpressionShare?: number;
  searchRankLostImpressionShare?: number;
}

export interface Segments {
  date?: string;
  dayOfWeek?: string;
  device?: string;
  adNetworkType?: string;
  conversionActionCategory?: string;
  conversionAction?: string;
  conversionActionName?: string;
  hour?: number;
  month?: string;
  quarter?: string;
  week?: string;
  year?: number;
}

export interface GoogleAdsRow {
  campaign?: Campaign;
  adGroup?: AdGroup;
  metrics?: Metrics;
  segments?: Segments;
  customer?: {
    resourceName: string;
    id: string;
    descriptiveName: string;
    currencyCode: string;
    timeZone: string;
  };
}

export interface ReportingQuery {
  entity: 'campaign' | 'ad_group' | 'ad_group_ad' | 'keyword' | 'customer';
  metrics: string[];
  segments?: string[];
  dateRange:
    | {
        startDate: string;
        endDate: string;
      }
    | {
        predefinedRange:
          | 'TODAY'
          | 'YESTERDAY'
          | 'LAST_7_DAYS'
          | 'LAST_30_DAYS'
          | 'THIS_MONTH'
          | 'LAST_MONTH'
          | 'ALL_TIME';
      };
  where?: string;
  orderBy?: string;
  limit?: number;
}

export interface MutateOperation {
  entity: string;
  operation: 'create' | 'update' | 'remove';
  resource: any;
  updateMask?: string[];
}

export interface MutateResponse {
  results: Array<{
    resourceName: string;
  }>;
  partialFailureError?: GoogleAdsError;
}

export interface RateLimitInfo {
  dailyOperations: number;
  remainingOperations: number;
  resetTime: Date;
  accessLevel: 'TEST' | 'BASIC' | 'STANDARD' | 'ADVANCED';
}

export interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
}

export interface BatchJob {
  resourceName: string;
  id: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  nextAddSequenceToken?: string;
  metadata?: {
    creationDateTime: string;
    completionDateTime?: string;
    estimatedCompletionRatio?: number;
    operationCount?: string;
    executedOperationCount?: string;
  };
}

export interface InsightsParams {
  account_id: string;
  date_preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'lifetime';
  time_range?: {
    since: string;
    until: string;
  };
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  fields?: string[];
  filtering?: any[];
  breakdowns?: string[];
  sort?: string[];
  limit?: number;
}

export interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective?: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach?: number;
  frequency?: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  conversion_rate?: number;
  cost_per_conversion?: number;
  date_start?: string;
  date_stop?: string;
}

export interface AdGroupData {
  id: string;
  name: string;
  campaign_id: string;
  campaign_name?: string;
  status: string;
  bid_amount?: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  conversion_rate?: number;
  quality_score?: number;
}

export interface KeywordData {
  id: string;
  text: string;
  match_type: 'EXACT' | 'PHRASE' | 'BROAD';
  status: string;
  bid_amount: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  position?: number;
  quality_score?: number;
  search_terms?: string[];
}

export interface SearchTermData {
  term: string;
  keyword_id: string;
  match_type: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions?: number;
}

export interface CustomerData {
  id: string;
  descriptive_name: string;
  currency_code: string;
  time_zone: string;
  auto_tagging_enabled: boolean;
  conversion_tracking_id?: string;
  remarketing_setting?: any;
  pay_per_conversion_eligibility_failure_reasons?: string[];
}

export interface AccessToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  scope: string;
}

export interface ReportData {
  columns: string[];
  rows: any[][];
  totals?: any[];
  summary?: {
    [key: string]: number | string;
  };
}

export interface ChangeData {
  resource_name: string;
  change_date_time: string;
  change_resource_name: string;
  change_resource_type: string;
  user_email?: string;
  client_type?: string;
  change_summary?: any;
}
