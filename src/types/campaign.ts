/**
 * Campaign-related TypeScript interfaces for type safety
 * Prevents runtime crashes from undefined properties and any types
 */

export interface CampaignCompetitor {
  name: string;
  party: string;
  isMainCompetitor: boolean;
  keywords: string[];
}

export interface CampaignSetupData {
  campaignName: string;
  candidateName: string;
  candidateParty: 'Democrat' | 'Republican' | 'Independent' | 'Other';
  competitors: CampaignCompetitor[];
  keywords: string[];
  trackingGoals: string[];
}

/**
 * Type guard to check if data is a valid CampaignSetupData object
 */
export function isCampaignSetupData(data: any): data is CampaignSetupData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.campaignName === 'string' &&
    typeof data.candidateName === 'string' &&
    ['Democrat', 'Republican', 'Independent', 'Other'].includes(data.candidateParty) &&
    Array.isArray(data.competitors) &&
    Array.isArray(data.keywords) &&
    Array.isArray(data.trackingGoals)
  );
}

/**
 * Safe default campaign data for fallbacks
 */
export const defaultCampaignData: CampaignSetupData = {
  campaignName: '',
  candidateName: '',
  candidateParty: 'Republican',
  competitors: [],
  keywords: [],
  trackingGoals: [],
};

// Additional API response types that were using 'any'
export interface MetaInsightAction {
  action_type: string;
  value: string;
}

export interface MetaInsights {
  actions?: MetaInsightAction[];
  impressions?: string;
  clicks?: string;
  spend?: string;
}

export interface GoogleCustomer {
  customerId: string;
  descriptiveName: string;
  currencyCode?: string;
  timeZone?: string;
}

export interface GoogleInsightsSummary {
  totalConversions?: number;
  totalImpressions?: number;
  totalClicks?: number;
  totalCost?: number;
}

export interface GoogleInsights {
  summary?: GoogleInsightsSummary;
  campaigns?: any[]; // Can be further typed if needed
}

/**
 * Type guards for API responses
 */
export function isMetaInsights(data: any): data is MetaInsights {
  return typeof data === 'object' && data !== null;
}

export function isGoogleCustomer(data: any): data is GoogleCustomer {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.customerId === 'string' &&
    typeof data.descriptiveName === 'string'
  );
}
