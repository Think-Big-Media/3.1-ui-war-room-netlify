/**
 * Application constants and configuration
 */

// API Configuration
// Use relative URL in production to avoid cross-origin issues on Render
const inferredHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (inferredHost === 'localhost' ? 'http://localhost:10000' : '');
export const API_VERSION = '/api/v1';

// WebSocket Configuration
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

// Supabase Configuration with fallbacks
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// PostHog Configuration
export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
export const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Feature Flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_AUTOMATION = import.meta.env.VITE_ENABLE_AUTOMATION === 'true';
export const ENABLE_DOCUMENT_INTELLIGENCE =
  import.meta.env.VITE_ENABLE_DOCUMENT_INTELLIGENCE === 'true';

// App Configuration
export const APP_NAME = 'War Room';
export const APP_VERSION = '1.0.0';
