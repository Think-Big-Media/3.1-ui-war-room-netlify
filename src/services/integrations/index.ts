// Export all integration hooks
export * from './useMetaAds';
export * from './useGoogleAds';

// Re-export commonly used hooks for convenience
export {
  useMetaAuth,
  useMetaAccountInsights,
  useMetaCampaignInsights,
  useMetaAdSetInsights,
  useMetaAdInsights,
  useMetaAggregatedInsights,
  useMetaInsightsStream,
  useMetaAPIHealth,
  useMetaErrorHandler,
  metaQueryKeys,
} from './useMetaAds';

export {
  useGoogleAdsAuth,
  useGoogleAdsCustomers,
  useGoogleAdsCampaigns,
  useGoogleAdsCampaignInsights,
  useGoogleAdsAdGroups,
  useGoogleAdsKeywords,
  useGoogleAdsSearchTerms,
  useGoogleAdsAccountInsights,
  useGoogleAdsCampaignMutations,
  useGoogleAdsChangeHistory,
  useGoogleAdsPerformanceStream,
  useGoogleAdsAPIHealth,
  useGoogleAdsErrorHandler,
  useGoogleAdsAggregatedInsights,
  googleAdsQueryKeys,
} from './useGoogleAds';

// Type exports for external use
export type { MetaConfig, InsightsParams as MetaInsightsParams } from '../../api/meta/types';
export type {
  GoogleAdsConfig,
  InsightsParams as GoogleInsightsParams,
} from '../../api/google/types';
