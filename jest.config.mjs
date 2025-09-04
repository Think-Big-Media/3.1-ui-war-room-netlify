/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^../../hooks/useWebSocket$': '<rootDir>/src/__mocks__/hooks/useWebSocket.js',
    '^../../services/analyticsApi$': '<rootDir>/src/__mocks__/services/analyticsApi.js',
    '^../../../services/analyticsApi$': '<rootDir>/src/__mocks__/services/analyticsApi.js',
    '^../../../store/analyticsSlice$': '<rootDir>/src/__mocks__/store/analyticsSlice.js',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  maxWorkers: '50%',
  cache: true,
  transformIgnorePatterns: [
    'node_modules/(?!(d3-scale|@testing-library|framer-motion|lucide-react|axios|ioredis)/)',
  ],
  globals: {
    'import.meta': {
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
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
};