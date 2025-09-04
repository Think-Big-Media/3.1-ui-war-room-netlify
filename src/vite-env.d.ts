/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_GOOGLE_ADS_CLIENT_ID: string;
  readonly VITE_GOOGLE_ADS_CLIENT_SECRET: string;
  readonly VITE_META_APP_ID: string;
  readonly VITE_META_APP_SECRET: string;
  readonly VITE_MOCK_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
