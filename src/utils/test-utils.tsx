/**
 * Test utilities for War Room project
 * Provides common test setup with Redux store, Router, and other providers
 */

import type React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Import reducers
import analyticsReducer from '../store/analyticsSlice';
import authReducer from '../store/slices/authSlice';
import { authApi } from '../services/authApi';
import { supabaseAuthApi } from '../services/supabaseAuthApi';
import { analyticsApi } from '../services/analyticsApi';
import { platformAdminApi } from '../api/platformAdmin';

// Import types
import type { RootState } from '../store';

// Define PreloadedState type
type PreloadedState<State> = {
  [K in keyof State]?: State[K] extends object ? PreloadedState<State[K]> : State[K];
};

// Extended render options
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof setupStore>;
  route?: string;
  routerType?: 'browser' | 'memory';
}

// Mock campaign state
export const createMockCampaignsState = (overrides = {}) => ({
  campaigns: [],
  currentCampaign: null,
  isLoading: false,
  error: null,
  ...overrides,
});

// Create a test store
export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
  return configureStore({
    reducer: {
      // Add slice reducers
      auth: authReducer as any,
      analytics: analyticsReducer as any,
      // Add API reducers
      [authApi.reducerPath]: authApi.reducer as any,
      [supabaseAuthApi.reducerPath]: supabaseAuthApi.reducer as any,
      [analyticsApi.reducerPath]: analyticsApi.reducer as any,
      [platformAdminApi.reducerPath]: platformAdminApi.reducer as any,
    },
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware({
        // Disable serializability checks for tests
        serializableCheck: false,
      })
        .concat(authApi.middleware)
        .concat(supabaseAuthApi.middleware)
        .concat(analyticsApi.middleware)
        .concat(platformAdminApi.middleware),
    preloadedState,
  });
};

// Default test store
export const createTestStore = () => setupStore();

// Custom render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    store = setupStore(preloadedState),
    route = '/',
    routerType = 'memory',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const RouterComponent = routerType === 'memory' ? MemoryRouter : BrowserRouter;
  const routerProps = routerType === 'memory' ? { initialEntries: [route] } : {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <RouterComponent {...routerProps}>{children}</RouterComponent>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Redux-only wrapper (for hook testing)
export function renderWithRedux(
  ui: React.ReactElement,
  {
    preloadedState,
    store = setupStore(preloadedState),
    ...renderOptions
  }: Omit<ExtendedRenderOptions, 'route' | 'routerType'> = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Router-only wrapper (for components that don't need Redux)
export function renderWithRouter(
  ui: React.ReactElement,
  {
    route = '/',
    routerType = 'memory',
    ...renderOptions
  }: Omit<ExtendedRenderOptions, 'preloadedState' | 'store'> = {}
) {
  const RouterComponent = routerType === 'memory' ? MemoryRouter : BrowserRouter;
  const routerProps = routerType === 'memory' ? { initialEntries: [route] } : {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <RouterComponent {...routerProps}>{children}</RouterComponent>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Create mock user for tests
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'member' as const,
  organizationId: 'org-1',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Create mock organization for tests
export const createMockOrganization = (overrides = {}) => ({
  id: 'org-1',
  name: 'Test Organization',
  slug: 'test-org',
  logoUrl: 'https://example.com/logo.jpg',
  plan: 'pro' as const,
  features: ['analytics', 'campaigns'],
  ...overrides,
});

// Mock auth state
export const createMockAuthState = (overrides = {}) => ({
  user: createMockUser(),
  organization: createMockOrganization(),
  isAuthenticated: true,
  isLoading: false,
  error: null,
  sessionToken: 'mock-token',
  ...overrides,
});

// Mock analytics state
export const createMockAnalyticsState = (overrides = {}) => ({
  dateRange: '30d',
  customDates: {
    startDate: null,
    endDate: null,
  },
  filters: {},
  activeExportJob: null,
  metrics: {
    volunteers: { value: 0, change: 0 },
    events: { value: 0, change: 0 },
    donations: { value: 0, change: 0 },
    engagement: { value: 0, change: 0 },
  },
  isLoading: false,
  error: null,
  ...overrides,
});

// Pre-configured mock states
export const mockStates = {
  loggedIn: {
    auth: createMockAuthState(),
    analytics: createMockAnalyticsState(),
  },
  loggedOut: {
    auth: {
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionToken: null,
    },
    analytics: createMockAnalyticsState(),
  },
  loading: {
    auth: {
      ...createMockAuthState(),
      isLoading: true,
    },
    analytics: createMockAnalyticsState(),
  },
  error: {
    auth: {
      ...createMockAuthState(),
      error: 'Test error message',
    },
    analytics: createMockAnalyticsState(),
  },
};

// Mock API responses
export const mockApiResponses = {
  campaigns: { data: [], total: 0, page: 1, limit: 20 },
  analytics: {
    metrics: {
      volunteers: { value: 1234, change: 12.5 },
      events: { value: 45, change: -5.2 },
      donations: { value: 89500, change: 8.7 },
      engagement: { value: 78, change: 3.1 },
    },
    charts: [],
  },
  auth: {
    user: createMockUser(),
    organization: createMockOrganization(),
    token: 'mock-jwt-token',
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Export custom render as the default export
export { renderWithProviders as render };
