// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Provide a minimal Vitest-compatible shim for tests that use `vi.*`
// Map common vi APIs to Jest so we don't need Vitest.
// Note: vi.hoisted is not supported; tests should avoid it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viShim: any = {
  fn: jest.fn.bind(jest),
  spyOn: jest.spyOn.bind(jest),
  mock: jest.mock.bind(jest),
  clearAllMocks: jest.clearAllMocks.bind(jest),
  resetAllMocks: jest.resetAllMocks.bind(jest),
  restoreAllMocks: jest.restoreAllMocks.bind(jest),
  useFakeTimers: jest.useFakeTimers.bind(jest),
  useRealTimers: jest.useRealTimers.bind(jest),
  advanceTimersByTime: jest.advanceTimersByTime.bind(jest),
  // Vitest dynamic import helpers
  importActual: jest.requireActual.bind(jest),
  // No-op placeholder to avoid crashes if referenced
  hoisted: (factory: () => unknown) => factory(),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).vi = viShim;

// Mock environment variables
Object.defineProperty(global, 'import', {
  value: {
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
      },
    },
  },
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  root: Element | null = null;
  rootMargin = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
}

global.ResizeObserver = MockResizeObserver as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock scrollTo
window.scrollTo = () => {};

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
  length: 0,
  key: (index: number) => null,
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
  length: 0,
  key: (index: number) => null,
};
global.sessionStorage = sessionStorageMock as Storage;

// Mock fetch
global.fetch = (() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })) as any;

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
})) as any;

// TextEncoder/TextDecoder polyfill for Node test env
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('node:util');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).TextEncoder = TextEncoder;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).TextDecoder = TextDecoder;
} catch {}

// Mock date-fns functions
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
  format: jest.fn(() => '2023-01-01'),
  startOfWeek: jest.fn(() => new Date()),
  endOfWeek: jest.fn(() => new Date()),
  startOfMonth: jest.fn(() => new Date()),
  endOfMonth: jest.fn(() => new Date()),
  isSameDay: jest.fn(() => true),
  isSameWeek: jest.fn(() => true),
  isSameMonth: jest.fn(() => true),
  addDays: jest.fn(() => new Date()),
  subDays: jest.fn(() => new Date()),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
  useParams: jest.fn(() => ({})),
}));

// Mock axios with proper ES module support
jest.mock('axios', () => {
  const mockAxios = {
    default: {
      create: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ data: {} })),
        post: jest.fn(() => Promise.resolve({ data: {} })),
        put: jest.fn(() => Promise.resolve({ data: {} })),
        delete: jest.fn(() => Promise.resolve({ data: {} })),
        patch: jest.fn(() => Promise.resolve({ data: {} })),
        request: jest.fn(() => Promise.resolve({ data: {} })),
        interceptors: {
          request: { use: jest.fn(), eject: jest.fn() },
          response: { use: jest.fn(), eject: jest.fn() },
        },
      })),
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      patch: jest.fn(() => Promise.resolve({ data: {} })),
      request: jest.fn(() => Promise.resolve({ data: {} })),
      isAxiosError: jest.fn(() => false),
      isCancel: jest.fn(() => false),
      CancelToken: {
        source: jest.fn(() => ({
          token: {},
          cancel: jest.fn(),
        })),
      },
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    },
    // Named exports
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      patch: jest.fn(() => Promise.resolve({ data: {} })),
      request: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    request: jest.fn(() => Promise.resolve({ data: {} })),
    isAxiosError: jest.fn(() => false),
    isCancel: jest.fn(() => false),
    CancelToken: {
      source: jest.fn(() => ({
        token: {},
        cancel: jest.fn(),
      })),
    },
    AxiosError: class MockAxiosError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'AxiosError';
      }
    },
  };
  return mockAxios;
});

// Mock ioredis
jest.mock('ioredis', () => {
  const mockRedis = {
    default: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(-1),
      keys: jest.fn().mockResolvedValue([]),
      scan: jest.fn().mockResolvedValue(['0', []]),
      eval: jest.fn().mockResolvedValue([1, 100]),
      multi: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        hmset: jest.fn().mockReturnThis(),
        hmget: jest.fn().mockReturnThis(),
        hset: jest.fn().mockReturnThis(),
        hget: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['OK'], ['value'], [1], ['OK']]),
      }),
      pipeline: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        hmset: jest.fn().mockReturnThis(),
        hmget: jest.fn().mockReturnThis(),
        hset: jest.fn().mockReturnThis(),
        hget: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['OK'], ['value'], [1], ['OK']]),
      }),
      hset: jest.fn().mockResolvedValue(1),
      hget: jest.fn().mockResolvedValue('value'),
      hmget: jest.fn().mockResolvedValue(['value1', 'value2']),
      hmset: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      status: 'ready',
    })),
  };
  return mockRedis;
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(() => ({ sub: 'test-user', exp: Date.now() / 1000 + 3600 })),
    decode: jest.fn(() => ({ sub: 'test-user', exp: Date.now() / 1000 + 3600 })),
  },
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ sub: 'test-user', exp: Date.now() / 1000 + 3600 })),
  decode: jest.fn(() => ({ sub: 'test-user', exp: Date.now() / 1000 + 3600 })),
}));

// Mock config constants to avoid import.meta.env issues
jest.mock('./config/constants', () => ({
  API_BASE_URL: 'http://localhost:8000',
  API_VERSION: '/api/v1',
  WS_BASE_URL: 'ws://localhost:8000',
  SUPABASE_URL: 'http://localhost:8000',
  SUPABASE_ANON_KEY: 'test-key',
  POSTHOG_KEY: 'test-posthog-key',
  POSTHOG_HOST: 'https://app.posthog.com',
  ENABLE_ANALYTICS: false,
  ENABLE_AUTOMATION: false,
  ENABLE_DOCUMENT_INTELLIGENCE: false,
  APP_NAME: 'War Room',
  APP_VERSION: '1.0.0',
}));

// Mock all supabase files to avoid import.meta.env issues
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
  },
  default: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
    },
  },
}));

// Mock authApi service
jest.mock('./services/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (state = {}) => state,
    middleware: () => (next: any) => (action: any) => next(action),
    util: {
      resetApiState: () => ({ type: 'authApi/resetApiState' }),
    },
    endpoints: {},
    injectEndpoints: () => ({
      reducerPath: 'authApi',
      reducer: (state = {}) => state,
      middleware: () => (next: any) => (action: any) => next(action),
    }),
    enhanceEndpoints: () => ({
      reducerPath: 'authApi',
      reducer: (state = {}) => state,
      middleware: () => (next: any) => (action: any) => next(action),
    }),
    useLoginMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
    useRegisterMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
    useLogoutMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
    useForgotPasswordMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
    useResetPasswordMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  },
  useLoginMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useRegisterMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useLogoutMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useForgotPasswordMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useResetPasswordMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
}));

// Mock supabase client to avoid import.meta.env issues
jest.mock('./lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null,
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }),
    }),
  },
  default: {
    // Same mock object as above
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null },
        error: null,
      }),
    },
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('div', props, children);
    },
    span: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('span', props, children);
    },
    button: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('button', props, children);
    },
    img: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement('img', props, children);
    },
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({}),
  useMotionValue: () => ({}),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');

  const createMockIcon = (name: string) => {
    const MockIcon = (props: any) =>
      React.createElement(
        'div',
        {
          ...props,
          'data-lucide': name
            .toLowerCase()
            .replace(/([A-Z])/g, '-$1')
            .substring(1),
        },
        name
      );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return createMockIcon(prop);
        }
        return undefined;
      },
    }
  );
});

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  if (typeof jest !== 'undefined') {
    jest.clearAllMocks();
  }
});
