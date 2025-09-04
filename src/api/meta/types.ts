// Meta Business API TypeScript Type Definitions

export interface MetaConfig {
  appId: string;
  appSecret: string;
  apiVersion: string;
  redirectUri: string;
}

export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface MetaError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
}

export interface MetaAPIResponse<T> {
  data: T;
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
  error?: MetaError;
}

export interface InsightsParams {
  accountId: string;
  fields?: string[];
  level?: 'ad' | 'adset' | 'campaign' | 'account';
  date_preset?:
    | 'today'
    | 'yesterday'
    | 'this_month'
    | 'last_month'
    | 'this_quarter'
    | 'lifetime'
    | 'last_3d'
    | 'last_7d'
    | 'last_14d'
    | 'last_28d'
    | 'last_30d'
    | 'last_90d';
  time_range?: {
    since: string;
    until: string;
  };
  filtering?: Array<{
    field: string;
    operator:
      | 'EQUAL'
      | 'NOT_EQUAL'
      | 'GREATER_THAN'
      | 'LESS_THAN'
      | 'CONTAIN'
      | 'NOT_CONTAIN'
      | 'IN'
      | 'NOT_IN';
    value: string | number | string[];
  }>;
  breakdowns?: string[];
  action_attribution_windows?: string[];
  limit?: number;
  after?: string;
}

export interface InsightsData {
  account_id: string;
  account_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach?: string;
  frequency?: string;
  cpm?: string;
  cpp?: string;
  cpc?: string;
  ctr?: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  conversions?: Array<{
    action_type: string;
    value: string;
  }>;
  date_start: string;
  date_stop: string;
}

export interface Campaign {
  id: string;
  name: string;
  account_id?: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  objective:
    | 'AWARENESS'
    | 'TRAFFIC'
    | 'ENGAGEMENT'
    | 'LEADS'
    | 'APP_PROMOTION'
    | 'SALES'
    | 'CONVERSIONS';
  buying_type?: 'AUCTION' | 'RESERVED';
  budget_remaining?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: string;
  special_ad_categories?: string[];
  promoted_object?: {
    pixel_id?: string;
    custom_event_type?: string;
    application_id?: string;
    object_store_url?: string;
    page_id?: string;
  };
  created_time: string;
  updated_time: string;
}

export interface RateLimitInfo {
  call_count: number;
  total_cputime: number;
  total_time: number;
  type: string;
  estimated_time_to_regain_access?: number;
}

export interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
}

export interface BatchRequest {
  method: 'GET' | 'POST' | 'DELETE';
  relative_url: string;
  body?: Record<string, any>;
}

export interface BatchResponse {
  code: number;
  headers: Array<{ name: string; value: string }>;
  body: string;
}

// Additional types for enhanced integration
export interface AdSet {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  campaign_id: string;
  targeting?: Record<string, any>;
  bid_amount?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  start_time?: string;
  end_time?: string;
  billing_event?: 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT' | 'VIDEO_VIEWS';
  optimization_goal?: OptimizationGoal;
  bid_strategy?: string;
  promoted_object?: Record<string, any>;
  attribution_spec?: AttributionSpec[];
  daily_spend_cap?: string;
  created_time: string;
  updated_time: string;
}

export interface Ad {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  adset_id: string;
  creative?: Creative;
  tracking_specs?: Record<string, any>;
  conversion_specs?: ConversionSpec[];
  bid_amount?: string;
  billing_event?: 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT' | 'VIDEO_VIEWS';
  created_time: string;
  updated_time: string;
}

export interface Creative {
  id: string;
  name: string;
  title?: string;
  body?: string;
  image_url?: string;
  video_url?: string;
  call_to_action?: {
    type: string;
    value: {
      link: string;
      link_caption?: string;
    };
  };
}

export interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  created_time: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface BusinessUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface CustomAudience {
  id: string;
  name: string;
  description?: string;
  subtype: string;
  approximate_count?: number;
  time_created: string;
  time_updated: string;
  data_source?: {
    type: string;
    sub_type?: string;
  };
}

export interface CreativeAsset {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url?: string;
  created_time: string;
}

// Additional types for missing interfaces
export interface LookalikeAudience {
  id: string;
  name: string;
  origin_audience_id: string;
  lookalike_spec: {
    type: string;
    country: string;
    ratio: number;
  };
  subtype: string;
  approximate_count?: number;
  time_created: string;
  time_updated: string;
}

export interface SavedAudience {
  id: string;
  name: string;
  description?: string;
  targeting: Record<string, any>;
  approximate_count?: number;
  time_created: string;
  time_updated: string;
}

export interface TrackingSpec {
  action_type: string[];
  fb_pixel_id?: string;
  page_id?: string;
}

export interface ConversionSpec {
  action_type: string[];
  fb_pixel_id?: string;
  page_id?: string;
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
      image_url?: string;
      call_to_action?: {
        type: string;
        value: {
          link?: string;
          app_link?: string;
        };
      };
    };
  };
}

export interface TargetingSpec {
  geo_locations?: {
    countries?: string[];
    cities?: Array<{
      key: string;
      radius?: number;
      distance_unit?: string;
    }>;
    regions?: Array<{
      key: string;
    }>;
  };
  age_min?: number;
  age_max?: number;
  genders?: number[];
  interests?: Array<{
    id: string;
    name?: string;
  }>;
  behaviors?: Array<{
    id: string;
    name?: string;
  }>;
  custom_audiences?: Array<{
    id: string;
    name?: string;
  }>;
  excluded_custom_audiences?: Array<{
    id: string;
    name?: string;
  }>;
}

export interface AttributionSpec {
  event_type: string;
  window_days: number;
}

export interface BillingEvent {
  IMPRESSIONS: 'IMPRESSIONS';
  CLICKS: 'CLICKS';
  LINK_CLICKS: 'LINK_CLICKS';
  POST_ENGAGEMENT: 'POST_ENGAGEMENT';
  VIDEO_VIEWS: 'VIDEO_VIEWS';
}

export type OptimizationGoal =
  | 'AD_RECALL_LIFT'
  | 'APP_INSTALLS'
  | 'APP_INSTALLS_AND_OFFSITE_CONVERSIONS'
  | 'CONVERSATIONS'
  | 'DERIVED_EVENTS'
  | 'ENGAGED_USERS'
  | 'EVENT_RESPONSES'
  | 'IMPRESSIONS'
  | 'IN_APP_VALUE'
  | 'LANDING_PAGE_VIEWS'
  | 'LEAD_GENERATION'
  | 'LINK_CLICKS'
  | 'NONE'
  | 'OFFSITE_CONVERSIONS'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'QUALITY_CALL'
  | 'QUALITY_LEAD'
  | 'REACH'
  | 'SOCIAL_IMPRESSIONS'
  | 'THRUPLAY'
  | 'VALUE'
  | 'VIDEO_VIEWS'
  | 'VISIT_INSTAGRAM_PROFILE';

export interface AudienceRule {
  inclusions?: Array<{
    or: Array<{
      and: Array<{
        operator: string;
        params: Record<string, any>;
      }>;
    }>;
  }>;
  exclusions?: Array<{
    or: Array<{
      and: Array<{
        operator: string;
        params: Record<string, any>;
      }>;
    }>;
  }>;
}
