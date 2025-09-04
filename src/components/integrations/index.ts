// Force components to be included in build
import MetaIntegrationComponent from './MetaIntegration';
import GoogleAdsIntegrationComponent from './GoogleAdsIntegration';

// Add diagnostics
console.log('[BUILD] OAuth components loaded:', {
  Meta: !!MetaIntegrationComponent,
  GoogleAds: !!GoogleAdsIntegrationComponent,
});

export const MetaIntegration = MetaIntegrationComponent;
export const GoogleAdsIntegration = GoogleAdsIntegrationComponent;
