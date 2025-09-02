/**
 * API Configuration
 * Central configuration for API endpoints, credentials validation, and settings
 * Updated: 2025-08-09 - Enhanced credential management
 */

// API Base URLs
export const API_CONFIG = {
  // Backend API - Updated for 4.0 backend integration  
  backend: {
    baseURL:
      import.meta.env.VITE_API_URL || 'https://[4.0-BACKEND-URL-TBD].lp.dev',
    timeout: 30000,
    // Note: 4.0 backend will have /api/v1/ prefixed endpoints to match frontend expectations
  },

  // Google Ads API
  googleAds: {
    baseURL: 'https://googleads.googleapis.com/v20',
    authURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/adwords',
  },

  // Meta Business API
  meta: {
    baseURL: 'https://graph.facebook.com/v19.0',
    authURL: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scope: 'ads_management,ads_read,business_management,pages_read_engagement',
  },

  // Mentionlytics API
  mentionlytics: {
    baseURL: 'https://api.mentionlytics.com/v1',
    authURL: 'https://api.mentionlytics.com/v1/token',
  },
};

// Credential validation functions
const isValidCredential = (value: string | undefined): boolean => {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value !== 'YOUR_VALUE_HERE' &&
    value !== 'development_placeholder' &&
    value !== 'phc_development_key_placeholder'
  );
};

// Get all environment variables with validation
export const getEnvironmentConfig = () => {
  return {
    // Core API
    apiUrl: import.meta.env.VITE_API_URL,
    nodeEnv: import.meta.env.NODE_ENV || 'development',
    isProduction: import.meta.env.NODE_ENV === 'production',

    // Meta/Facebook credentials
    meta: {
      appId: import.meta.env.VITE_META_APP_ID,
      appSecret: import.meta.env.VITE_META_APP_SECRET,
      accessToken: import.meta.env.VITE_META_ACCESS_TOKEN,
    },

    // Google Ads credentials
    googleAds: {
      clientId: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET,
      developerToken: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN,
    },

    // SendGrid credentials
    sendgrid: {
      email: import.meta.env.VITE_SENDGRID_EMAIL,
      password: import.meta.env.VITE_SENDGRID_PASSWORD,
    },

    // Mentionlytics credentials
    mentionlytics: {
      email: import.meta.env.VITE_MENTIONLYTICS_EMAIL,
      password: import.meta.env.VITE_MENTIONLYTICS_PASSWORD,
      apiToken: import.meta.env.VITE_MENTIONLYTICS_API_TOKEN,
      projectId: import.meta.env.VITE_MENTIONLYTICS_PROJECT_ID,
    },

    // Other services
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },

    posthog: {
      key: import.meta.env.VITE_POSTHOG_KEY,
      host: import.meta.env.VITE_POSTHOG_HOST,
    },

    openai: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    },

    // Feature flags
    features: {
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      automation: import.meta.env.VITE_ENABLE_AUTOMATION === 'true',
      documentIntelligence: import.meta.env.VITE_ENABLE_DOCUMENT_INTELLIGENCE === 'true',
      realApiCalls: import.meta.env.VITE_ENABLE_REAL_API_CALLS === 'true',
      mockMode: import.meta.env.VITE_ENABLE_MOCK_MODE === 'true',
    },

    // Debug settings
    debug: {
      apiCalls: import.meta.env.VITE_DEBUG_API_CALLS === 'true',
      websocket: import.meta.env.VITE_DEBUG_WEBSOCKET === 'true',
      logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    },
  };
};

// Check if we have real API credentials
export const hasRealCredentials = () => {
  const config = getEnvironmentConfig();

  const hasMetaCredentials =
    isValidCredential(config.meta.appId) &&
    isValidCredential(config.meta.appSecret) &&
    isValidCredential(config.meta.accessToken);

  const hasGoogleCredentials =
    isValidCredential(config.googleAds.clientId) &&
    isValidCredential(config.googleAds.clientSecret) &&
    isValidCredential(config.googleAds.developerToken);

  const hasSendGridCredentials =
    isValidCredential(config.sendgrid.email) && isValidCredential(config.sendgrid.password);

  const hasSupabaseCredentials =
    isValidCredential(config.supabase.url) && isValidCredential(config.supabase.anonKey);

  const hasPostHogCredentials =
    isValidCredential(config.posthog.key) && isValidCredential(config.posthog.host);

  const hasMentionlyticsCredentials =
    isValidCredential(config.mentionlytics.apiToken);

  return {
    meta: hasMetaCredentials,
    googleAds: hasGoogleCredentials,
    sendgrid: hasSendGridCredentials,
    mentionlytics: hasMentionlyticsCredentials,
    supabase: hasSupabaseCredentials,
    posthog: hasPostHogCredentials,
    any:
      hasMetaCredentials ||
      hasGoogleCredentials ||
      hasSendGridCredentials ||
      hasMentionlyticsCredentials,
    all:
      hasMetaCredentials &&
      hasGoogleCredentials &&
      hasSendGridCredentials &&
      hasSupabaseCredentials &&
      hasMentionlyticsCredentials,
  };
};

// Get API endpoints
export const getAPIEndpoints = () => {
  const backendURL = API_CONFIG.backend.baseURL;

  return {
    // Auth endpoints - MISSING FROM 4.0 BACKEND (CC2 TO IMPLEMENT)
    auth: {
      // Core authentication (REQUIRED - missing from 4.0 backend)
      login: `${backendURL}/api/v1/auth/login`,
      register: `${backendURL}/api/v1/auth/register`, 
      logout: `${backendURL}/api/v1/auth/logout`,
      me: `${backendURL}/api/v1/auth/me`,
      refresh: `${backendURL}/api/v1/auth/refresh`,
      
      // OAuth integrations
      googleAds: {
        connect: `${backendURL}/api/v1/auth/google-ads/connect`,
        callback: `${backendURL}/api/v1/auth/google-ads/callback`,
        status: `${backendURL}/api/v1/auth/google-ads/status`,
      },
      meta: {
        connect: `${backendURL}/api/v1/auth/meta/connect`,
        callback: `${backendURL}/api/v1/auth/meta/callback`,
        status: `${backendURL}/api/v1/auth/meta/status`,
      },
    },

    // Data endpoints
    data: {
      googleAds: {
        campaigns: `${backendURL}/api/v1/google-ads/campaigns`,
        performance: `${backendURL}/api/v1/google-ads/performance`,
        insights: `${backendURL}/api/v1/google-ads/insights`,
      },
      meta: {
        campaigns: `${backendURL}/api/v1/meta/campaigns`,
        adsets: `${backendURL}/api/v1/meta/adsets`,
        insights: `${backendURL}/api/v1/meta/insights`,
      },
      mentionlytics: {
        mentions: `${backendURL}/api/v1/mentionlytics/mentions`,
        sentiment: `${backendURL}/api/v1/mentionlytics/sentiment`,
        geo: `${backendURL}/api/v1/mentionlytics/mentions/geo`,
        influencers: `${backendURL}/api/v1/mentionlytics/influencers`,
        trending: `${backendURL}/api/v1/mentionlytics/trending`,
        shareOfVoice: `${backendURL}/api/v1/mentionlytics/share-of-voice`,
        feed: `${backendURL}/api/v1/mentionlytics/feed`,
      },
    },
  };
};

// Validate all credentials and configuration
export const validateConfiguration = () => {
  const config = getEnvironmentConfig();
  const credentials = hasRealCredentials();
  const endpoints = getAPIEndpoints();

  const issues: string[] = [];

  // Check core configuration
  if (!config.apiUrl) {
    issues.push('Missing VITE_API_URL');
  }

  // Check required credentials
  if (!credentials.supabase) {
    issues.push('Missing or invalid Supabase credentials');
  }

  // Check API credentials if real API calls are enabled
  if (config.features.realApiCalls) {
    if (!credentials.meta) {
      issues.push('Missing or invalid Meta/Facebook API credentials');
    }
    if (!credentials.googleAds) {
      issues.push('Missing or invalid Google Ads API credentials');
    }
  }

  // Check analytics if enabled
  if (config.features.analytics && !credentials.posthog) {
    issues.push('Analytics enabled but PostHog credentials missing');
  }

  return {
    isValid: issues.length === 0,
    issues,
    config,
    credentials,
    endpoints,
  };
};

// Check if APIs are configured (backwards compatibility)
export const checkAPIConfiguration = () => {
  const validation = validateConfiguration();

  return {
    isConfigured: validation.credentials.any,
    isValid: validation.isValid,
    credentials: validation.credentials,
    endpoints: validation.endpoints,
    config: validation.config,
    issues: validation.issues,
  };
};

// Helper function to get safe configuration for logging (without sensitive data)
export const getSafeConfigForLogging = () => {
  const config = getEnvironmentConfig();

  return {
    apiUrl: config.apiUrl,
    nodeEnv: config.nodeEnv,
    isProduction: config.isProduction,
    features: config.features,
    debug: config.debug,
    hasCredentials: {
      meta: !!config.meta.appId,
      googleAds: !!config.googleAds.clientId,
      sendgrid: !!config.sendgrid.email,
      mentionlytics: !!config.mentionlytics.apiToken,
      supabase: !!config.supabase.url,
      posthog: !!config.posthog.key,
      openai: !!config.openai.apiKey,
    },
  };
};

// Initialize and validate configuration on import
const configStatus = checkAPIConfiguration();

// Export configuration status for use throughout the app
export const CONFIG_STATUS = configStatus;

// Export for use in other modules
export { getEnvironmentConfig as ENV_CONFIG };
