/**
 * Comprehensive tests for Meta Business API Integration
 * Generated with TestSprite patterns for maximum coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  useMetaOAuth,
  useMetaUser,
  useMetaAdAccounts,
  useMetaInsights,
  useMetaCampaigns,
  useMetaCampaignMutations,
  LocalStorageTokenStorage,
  TokenRefreshScheduler,
} from '../metaAdsIntegration';
import { createMetaAPI } from '../../../api/meta';
import { MetaAPIError } from '../../../api/meta/errors';

// Mock dependencies
jest.mock('../../../api/meta');
jest.mock('react-hot-toast');

// Mock environment variables
const mockEnv = {
  VITE_META_APP_ID: 'test-app-id',
  VITE_META_APP_SECRET: 'test-app-secret',
  VITE_META_REDIRECT_URI: 'http://localhost:3000/api/meta/callback',
};

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock data
const mockAccessToken = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 5184000, // 60 days
};

const mockUser = {
  id: '123456',
  name: 'Test User',
  email: 'test@example.com',
  business: {
    id: 'business-123',
    name: 'Test Business',
  },
};

const mockAdAccount = {
  id: 'act_123456',
  account_id: '123456',
  name: 'Test Ad Account',
  account_status: 1,
  currency: 'USD',
  timezone_name: 'America/Los_Angeles',
  created_time: '2023-01-01T00:00:00Z',
};

const mockCampaign = {
  id: 'campaign_123',
  name: 'Test Campaign',
  status: 'ACTIVE' as const,
  objective: 'CONVERSIONS',
  buying_type: 'AUCTION',
  daily_budget: '10000',
  created_time: '2023-01-01T00:00:00Z',
  updated_time: '2023-01-01T00:00:00Z',
};

const mockInsights = {
  account_id: 'act_123456',
  impressions: '10000',
  clicks: '500',
  spend: '250.00',
  ctr: '5.0',
  date_start: '2023-01-01',
  date_stop: '2023-01-31',
};

describe('MetaAdsIntegration', () => {
  let mockMetaAPI: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Setup environment variables
    Object.defineProperty(window, 'import.meta', {
      value: { env: mockEnv },
      writable: true,
    });

    // Setup mock API
    mockMetaAPI = {
      auth: {
        getLoginUrl: jest.fn(),
        generateState: jest.fn(() => 'mock-state'),
        exchangeCodeForToken: jest.fn(),
        getLongLivedToken: jest.fn(),
        getCurrentUser: jest.fn(),
        getCachedToken: jest.fn(),
      },
      insights: {
        getAccountInsights: jest.fn(),
        getCampaignInsights: jest.fn(),
        getAdSetInsights: jest.fn(),
        getAdInsights: jest.fn(),
      },
      accounts: {
        list: jest.fn(),
      },
      campaigns: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    (createMetaAPI as jest.Mock).mockReturnValue(mockMetaAPI);
  });

  describe('LocalStorageTokenStorage', () => {
    it('should store and retrieve tokens correctly', () => {
      const storage = new LocalStorageTokenStorage();

      storage.setToken(mockAccessToken);

      const retrieved = storage.getToken();
      expect(retrieved).toEqual(mockAccessToken);

      const expiry = storage.getTokenExpiry();
      expect(expiry).toBeGreaterThan(Date.now());
    });

    it('should clear tokens correctly', () => {
      const storage = new LocalStorageTokenStorage();

      storage.setToken(mockAccessToken);
      storage.clearToken();

      expect(storage.getToken()).toBeNull();
      expect(storage.getTokenExpiry()).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const storage = new LocalStorageTokenStorage();

      localStorage.setItem('meta_access_token', 'invalid-json');

      expect(storage.getToken()).toBeNull();
    });
  });

  describe('TokenRefreshScheduler', () => {
    jest.useFakeTimers();

    it('should schedule token refresh correctly', () => {
      const storage = new LocalStorageTokenStorage();
      const scheduler = new TokenRefreshScheduler(storage);
      const onRefresh = jest.fn();

      // Set token with expiry in 2 hours
      storage.setToken(mockAccessToken);
      const expiry = Date.now() + 2 * 60 * 60 * 1000;
      localStorage.setItem('meta_token_expiry', expiry.toString());

      scheduler.scheduleRefresh(onRefresh);

      // Fast forward to just before refresh (considering buffer)
      jest.advanceTimersByTime(1 * 60 * 60 * 1000); // 1 hour
      expect(onRefresh).not.toHaveBeenCalled();

      // Fast forward past refresh time
      jest.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 more hours
      expect(onRefresh).toHaveBeenCalled();
    });

    it('should trigger immediate refresh for expired tokens', () => {
      const storage = new LocalStorageTokenStorage();
      const scheduler = new TokenRefreshScheduler(storage);
      const onRefresh = jest.fn();

      // Set expired token
      storage.setToken(mockAccessToken);
      localStorage.setItem('meta_token_expiry', (Date.now() - 1000).toString());

      scheduler.scheduleRefresh(onRefresh);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should cancel existing refresh when rescheduling', () => {
      const storage = new LocalStorageTokenStorage();
      const scheduler = new TokenRefreshScheduler(storage);
      const onRefresh1 = jest.fn();
      const onRefresh2 = jest.fn();

      storage.setToken(mockAccessToken);

      scheduler.scheduleRefresh(onRefresh1);
      scheduler.scheduleRefresh(onRefresh2);

      jest.runAllTimers();

      expect(onRefresh1).not.toHaveBeenCalled();
      expect(onRefresh2).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  describe('useMetaOAuth', () => {
    it('should handle successful OAuth flow', async () => {
      const { result } = renderHook(() => useMetaOAuth(), {
        wrapper: createWrapper(),
      });

      // Test login URL generation
      mockMetaAPI.auth.getLoginUrl.mockReturnValue('https://facebook.com/oauth');

      act(() => {
        const loginUrl = result.current.getLoginUrl();
        expect(loginUrl).toBe('https://facebook.com/oauth');
        expect(sessionStorage.getItem('meta_oauth_state')).toBe('mock-state');
      });

      // Test code exchange
      mockMetaAPI.auth.exchangeCodeForToken.mockResolvedValue(mockAccessToken);
      mockMetaAPI.auth.getLongLivedToken.mockResolvedValue({
        ...mockAccessToken,
        expires_in: 5184000,
      });

      await act(async () => {
        result.current.exchangeCode({ code: 'test-code', state: 'mock-state' });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.authToken).toEqual({
          ...mockAccessToken,
          expires_in: 5184000,
        });
        expect(toast.success).toHaveBeenCalledWith('Successfully connected to Meta Business');
      });
    });

    it('should handle CSRF protection', async () => {
      const { result } = renderHook(() => useMetaOAuth(), {
        wrapper: createWrapper(),
      });

      sessionStorage.setItem('meta_oauth_state', 'expected-state');

      await act(async () => {
        result.current.exchangeCode({ code: 'test-code', state: 'wrong-state' });
      });

      await waitFor(() => {
        expect(result.current.exchangeError?.message).toContain('Invalid state parameter');
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle token refresh', async () => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);

      const { result } = renderHook(() => useMetaOAuth(), {
        wrapper: createWrapper(),
      });

      mockMetaAPI.auth.getCachedToken.mockReturnValue(mockAccessToken);
      mockMetaAPI.auth.getLongLivedToken.mockResolvedValue({
        ...mockAccessToken,
        expires_in: 5184000,
      });

      await act(async () => {
        result.current.getLongLivedToken();
      });

      await waitFor(() => {
        expect(mockMetaAPI.auth.getLongLivedToken).toHaveBeenCalledWith(
          mockAccessToken.access_token
        );
        expect(toast.success).toHaveBeenCalledWith('Token refreshed successfully');
      });
    });

    it('should handle logout correctly', () => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);

      const { result } = renderHook(() => useMetaOAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.logout();
      });

      expect(storage.getToken()).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Disconnected from Meta Business');
    });
  });

  describe('useMetaUser', () => {
    it('should fetch user profile successfully', async () => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);

      mockMetaAPI.auth.getCachedToken.mockReturnValue(mockAccessToken);
      mockMetaAPI.auth.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useMetaUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUser);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should not fetch when not authenticated', () => {
      mockMetaAPI.auth.getCachedToken.mockReturnValue(null);

      const { result } = renderHook(() => useMetaUser(), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeUndefined();
      expect(mockMetaAPI.auth.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('useMetaInsights', () => {
    beforeEach(() => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);
      mockMetaAPI.auth.getCachedToken.mockReturnValue(mockAccessToken);
    });

    it('should fetch account insights successfully', async () => {
      mockMetaAPI.insights.getAccountInsights.mockResolvedValue(mockInsights);

      const { result } = renderHook(
        () =>
          useMetaInsights('account', 'act_123456', {
            accountId: 'act_123456',
            datePreset: 'last_30d',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockInsights);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle authentication errors', async () => {
      const authError = new MetaAPIError('Invalid OAuth access token', 190);
      mockMetaAPI.insights.getAccountInsights.mockRejectedValue(authError);

      const onError = jest.fn();
      const { result } = renderHook(
        () =>
          useMetaInsights(
            'account',
            'act_123456',
            {
              accountId: 'act_123456',
            },
            { onError }
          ),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(authError);
        expect(onError).toHaveBeenCalledWith(authError);
        expect(toast.error).toHaveBeenCalledWith('Session expired. Please login again.');
      });
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new MetaAPIError('Application request limit reached', 4);
      mockMetaAPI.insights.getCampaignInsights.mockRejectedValue(rateLimitError);

      const { result } = renderHook(
        () =>
          useMetaInsights('campaign', 'campaign_123', {
            accountId: 'act_123456',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(rateLimitError);
        expect(toast.error).toHaveBeenCalledWith('Rate limit reached. Please try again later.');
      });
    });
  });

  describe('useMetaCampaignMutations', () => {
    beforeEach(() => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);
      mockMetaAPI.auth.getCachedToken.mockReturnValue(mockAccessToken);
    });

    it('should create campaign successfully', async () => {
      mockMetaAPI.campaigns.create.mockResolvedValue(mockCampaign);

      const { result } = renderHook(() => useMetaCampaignMutations('act_123456'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.createCampaign({
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
        });
      });

      await waitFor(() => {
        expect(mockMetaAPI.campaigns.create).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Campaign created successfully');
      });
    });

    it('should update campaign successfully', async () => {
      mockMetaAPI.campaigns.update.mockResolvedValue({
        ...mockCampaign,
        name: 'Updated Campaign',
      });

      const { result } = renderHook(() => useMetaCampaignMutations('act_123456'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.updateCampaign({
          campaignId: 'campaign_123',
          updates: { name: 'Updated Campaign' },
        });
      });

      await waitFor(() => {
        expect(mockMetaAPI.campaigns.update).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Campaign updated successfully');
      });
    });

    it('should handle campaign deletion', async () => {
      mockMetaAPI.campaigns.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMetaCampaignMutations('act_123456'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.deleteCampaign('campaign_123');
      });

      await waitFor(() => {
        expect(mockMetaAPI.campaigns.delete).toHaveBeenCalledWith(
          'campaign_123',
          mockAccessToken.access_token
        );
        expect(toast.success).toHaveBeenCalledWith('Campaign deleted successfully');
      });
    });

    it('should handle campaign pause', async () => {
      mockMetaAPI.campaigns.update.mockResolvedValue({
        ...mockCampaign,
        status: 'PAUSED',
      });

      const { result } = renderHook(() => useMetaCampaignMutations('act_123456'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.pauseCampaign('campaign_123');
      });

      await waitFor(() => {
        expect(mockMetaAPI.campaigns.update).toHaveBeenCalledWith(
          'campaign_123',
          { status: 'PAUSED' },
          mockAccessToken.access_token
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);
      mockMetaAPI.auth.getCachedToken.mockReturnValue(mockAccessToken);

      const networkError = new Error('Network error');
      mockMetaAPI.insights.getAccountInsights.mockRejectedValue(networkError);

      const { result } = renderHook(
        () =>
          useMetaInsights('account', 'act_123456', {
            accountId: 'act_123456',
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(networkError);
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle permission errors', async () => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);
      mockMetaAPI.auth.getCachedToken.mockReturnValue(mockAccessToken);

      const permissionError = new MetaAPIError('Permission denied', 200);
      mockMetaAPI.campaigns.list.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useMetaCampaigns('act_123456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(permissionError);
        expect(toast.error).toHaveBeenCalledWith('Permission denied. Please check your access.');
      });
    });
  });

  describe('Token Validation', () => {
    it('should correctly validate token expiry', () => {
      const storage = new LocalStorageTokenStorage();
      storage.setToken(mockAccessToken);

      const { result } = renderHook(() => useMetaOAuth(), {
        wrapper: createWrapper(),
      });

      // Set future expiry
      localStorage.setItem('meta_token_expiry', (Date.now() + 3600000).toString());
      expect(result.current.isTokenValid()).toBe(true);

      // Set past expiry
      localStorage.setItem('meta_token_expiry', (Date.now() - 1000).toString());
      expect(result.current.isTokenValid()).toBe(false);
    });
  });
});
