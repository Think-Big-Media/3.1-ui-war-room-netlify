// Additional Jest setup for import.meta.env
// Define import.meta globally for Node environment
globalThis.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000',
      VITE_WS_URL: 'ws://localhost:8000',
      VITE_SUPABASE_URL: 'http://localhost:8000',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_POSTHOG_KEY: 'test-posthog-key',
      VITE_POSTHOG_HOST: 'https://app.posthog.com',
      VITE_META_APP_ID: 'test-meta-app-id',
      VITE_META_APP_SECRET: 'test-meta-secret',
      VITE_GOOGLE_ADS_CLIENT_ID: 'test-google-client-id',
      VITE_ENABLE_ANALYTICS: 'false',
      VITE_ENABLE_AUTOMATION: 'false',
      VITE_ENABLE_DOCUMENT_INTELLIGENCE: 'false',
      DEV: true,
      NODE_ENV: 'test',
      MODE: 'test',
    },
  },
};
