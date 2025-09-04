/**
 * Mock Mode Configuration for War Room Development
 * Automatically detects available credentials and switches between mock/real data
 */

export interface CredentialStatus {
  openai: boolean;
  pinecone: boolean;
  supabase: boolean;
  google: boolean;
}

/**
 * Check if we should use mock data for a specific service
 */
export function shouldUseMockData(service: 'openai' | 'pinecone' | 'supabase' | 'google'): boolean {
  const status = getCredentialStatus();
  const forced = isMockModeForced();

  console.log('[MOCK_MODE] shouldUseMockData called for:', service);
  console.log('[MOCK_MODE] Credential status:', status);
  console.log('[MOCK_MODE] Force mock mode:', forced);

  if (forced) {
    console.log('[MOCK_MODE] ⚠️ Mock mode is FORCED - returning true');
    return true;
  }

  let result: boolean;
  switch (service) {
    case 'openai':
      result = !status.openai;
      break;
    case 'pinecone':
      result = !status.pinecone;
      break;
    case 'supabase':
      result = !status.supabase;
      break;
    case 'google':
      result = !status.google;
      break;
    default:
      result = true;
  }

  console.log('[MOCK_MODE] Service', service, 'should use mock:', result);
  return result;
}

/**
 * Get the status of all credentials
 */
export function getCredentialStatus(): CredentialStatus {
  if (typeof window === 'undefined') {
    // Server-side - check process.env
    return {
      openai: Boolean(process.env.OPENAI_API_KEY) || Boolean(process.env.VITE_OPENAI_API_KEY),
      pinecone: Boolean(process.env.PINECONE_API_KEY) || Boolean(process.env.VITE_PINECONE_API_KEY),
      supabase: Boolean(process.env.SUPABASE_URL) || Boolean(process.env.VITE_SUPABASE_URL),
      google: Boolean(process.env.GOOGLE_CLIENT_ID) || Boolean(process.env.VITE_GOOGLE_CLIENT_ID),
    };
  }

  // Client-side - check import.meta.env (Vite)
  const env = (import.meta as any)?.env || {};

  return {
    openai: Boolean(env.VITE_OPENAI_API_KEY && env.VITE_OPENAI_API_KEY.length > 10),
    pinecone: Boolean(env.VITE_PINECONE_API_KEY && env.VITE_PINECONE_API_KEY.length > 10),
    supabase: Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL.includes('supabase')),
    google: Boolean(env.VITE_GOOGLE_CLIENT_ID && env.VITE_GOOGLE_CLIENT_ID.length > 10),
  };
}

/**
 * Get a summary of which services are available
 */
export function getServicesSummary(): string {
  const status = getCredentialStatus();
  const available = Object.entries(status)
    .filter(([_, isAvailable]) => isAvailable)
    .map(([service, _]) => service);

  if (available.length === 0) {
    return 'All services running in mock mode';
  } else if (available.length === 4) {
    return 'All services connected with real credentials';
  }
  return `Connected: ${available.join(', ')} | Mock: ${Object.keys(status).filter(k => !status[k as keyof CredentialStatus]).join(', ')}`;

}

/**
 * Force mock mode for testing
 */
export function forceMockMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('war-room-force-mock', 'true');
  }
}

/**
 * Disable forced mock mode
 */
export function disableForcedMockMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('war-room-force-mock');
  }
}

/**
 * Check if mock mode is forced
 */
export function isMockModeForced(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('war-room-force-mock') === 'true';
  }
  return false;
}
