/**
 * Hook to access Meta API client and services
 */

import { createContext, useContext, useMemo } from 'react';
import { MetaAPIClient } from '@/api/meta/client';
import { MetaCampaignService } from '@/api/meta/campaigns';
import { MetaAdService } from '@/api/meta/ads';
import { MetaAdSetService } from '@/api/meta/adsets';
import { MetaAudienceService } from '@/api/meta/audiences';
import { MetaAuthManager } from '@/api/meta/auth';
import { RateLimiter } from '@/api/meta/rateLimiter';
import { CircuitBreaker } from '@/api/meta/circuitBreaker';
import { useMetaAuth } from './useMetaAuth';

interface MetaClientContextValue {
  client: MetaAPIClient;
  authManager: MetaAuthManager;
  campaignService: MetaCampaignService;
  adService: MetaAdService;
  adSetService: MetaAdSetService;
  audienceService: MetaAudienceService;
  isAuthenticated: boolean;
  accountId?: string;
}

const MetaClientContext = createContext<MetaClientContextValue | null>(null);

/**
 * Provider component that initializes Meta API services
 */
export function MetaClientProvider({ children }: { children: React.ReactNode }) {
  const { token, accountId, isAuthenticated } = useMetaAuth();

  const services = useMemo(() => {
    // Initialize core services
    const config = {
      appId: import.meta.env.VITE_META_APP_ID || '',
      appSecret: import.meta.env.VITE_META_APP_SECRET || '',
      apiVersion: 'v19.0',
      redirectUri: `${window.location.origin}/meta/callback`,
    };
    const authManager = new MetaAuthManager(config);

    const rateLimiter = new RateLimiter();
    const circuitBreaker = new CircuitBreaker();

    // Initialize API client
    const client = new MetaAPIClient(config, authManager, rateLimiter, circuitBreaker);

    // Token is managed through auth manager, not directly on client

    // Initialize services
    const campaignService = new MetaCampaignService(client, rateLimiter, circuitBreaker);
    const adService = new MetaAdService(client, rateLimiter, circuitBreaker);
    const adSetService = new MetaAdSetService(client, rateLimiter, circuitBreaker);
    const audienceService = new MetaAudienceService(client, rateLimiter, circuitBreaker);

    return {
      client,
      authManager,
      campaignService,
      adService,
      adSetService,
      audienceService,
    };
  }, [token]);

  const value: MetaClientContextValue = {
    ...services,
    isAuthenticated,
    accountId: accountId || undefined,
  };

  return <MetaClientContext.Provider value={value}>{children}</MetaClientContext.Provider>;
}

/**
 * Hook to access Meta API client and services
 */
export function useMetaClient() {
  const context = useContext(MetaClientContext);

  if (!context) {
    throw new Error('useMetaClient must be used within MetaClientProvider');
  }

  return context;
}

/**
 * Hook to check if Meta is authenticated
 */
export function useIsMetaAuthenticated() {
  const { isAuthenticated } = useMetaClient();
  return isAuthenticated;
}

/**
 * Hook to get current Meta account ID
 */
export function useMetaAccountId() {
  const { accountId } = useMetaClient();
  return accountId;
}
