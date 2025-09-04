/**
 * Hook to handle Meta authentication state
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface MetaAuthState {
  token: string | null;
  accountId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const META_AUTH_STORAGE_KEY = 'meta_auth';

/**
 * Hook to manage Meta authentication state
 */
export function useMetaAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authState, setAuthState] = useState<MetaAuthState>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(META_AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          token: parsed.token,
          accountId: parsed.accountId,
          isAuthenticated: Boolean(parsed.token),
          isLoading: false,
          error: null,
        };
      }
    } catch (error: any) {
      console.error('Failed to parse stored auth:', error);
    }

    return {
      token: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  });

  // Save auth state to localStorage
  useEffect(() => {
    if (authState.token) {
      localStorage.setItem(
        META_AUTH_STORAGE_KEY,
        JSON.stringify({
          token: authState.token,
          accountId: authState.accountId,
        })
      );
    } else {
      localStorage.removeItem(META_AUTH_STORAGE_KEY);
    }
  }, [authState.token, authState.accountId]);

  /**
   * Initiate OAuth login flow
   */
  const login = useCallback(() => {
    const appId = import.meta.env.VITE_META_APP_ID;
    if (!appId) {
      toast.error('Meta App ID not configured');
      return;
    }

    const redirectUri = encodeURIComponent(`${window.location.origin}/meta/callback`);
    const state = Math.random().toString(36).substring(7);

    // Store state for verification
    sessionStorage.setItem('meta_oauth_state', state);

    // Meta OAuth permissions needed
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_show_list',
      'read_insights',
    ].join(',');

    const authUrl =
      'https://www.facebook.com/v18.0/dialog/oauth?' +
      `client_id=${appId}&` +
      `redirect_uri=${redirectUri}&` +
      `state=${state}&` +
      `scope=${scopes}&` +
      'response_type=code';

    // Redirect to Meta OAuth
    window.location.href = authUrl;
  }, []);

  /**
   * Handle OAuth callback
   */
  const handleCallback = useCallback(
    async (code: string, state: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Verify state
        const storedState = sessionStorage.getItem('meta_oauth_state');
        if (state !== storedState) {
          throw new Error('Invalid OAuth state');
        }
        sessionStorage.removeItem('meta_oauth_state');

        // Exchange code for token via backend
        const response = await fetch('/api/v1/meta/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/meta/callback` }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to authenticate');
        }

        const data = await response.json();

        setAuthState({
          token: data.access_token,
          accountId: data.account_id,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        toast.success('Successfully connected to Meta');

        // Redirect to campaigns page or return URL
        const returnUrl = sessionStorage.getItem('meta_return_url') || '/campaigns/meta';
        sessionStorage.removeItem('meta_return_url');
        navigate(returnUrl);
      } catch (error: any) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        toast.error(`Authentication failed: ${error.message}`);
      }
    },
    [navigate]
  );

  /**
   * Logout and clear credentials
   */
  const logout = useCallback(() => {
    setAuthState({
      token: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    toast.success('Disconnected from Meta');
  }, []);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    if (!authState.token) {
      return;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/v1/meta/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      setAuthState((prev) => ({
        ...prev,
        token: data.access_token,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // Don't logout on refresh failure - token might still be valid
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [authState.token]);

  // Handle OAuth callback on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error(`Meta authentication error: ${params.get('error_description') || error}`);
      navigate('/campaigns');
    } else if (code && state) {
      handleCallback(code, state);
    }
  }, [location.search, handleCallback, navigate]);

  // Refresh token periodically
  useEffect(() => {
    if (!authState.token) {
      return;
    }

    // Refresh every 50 minutes (tokens typically last 60 minutes)
    const interval = setInterval(refreshToken, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.token, refreshToken]);

  return {
    ...authState,
    login,
    logout,
    refreshToken,
  };
}

/**
 * Hook to require Meta authentication
 */
export function useRequireMetaAuth() {
  const { isAuthenticated, login } = useMetaAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      // Store current location to return after auth
      sessionStorage.setItem('meta_return_url', location.pathname);
      login();
    }
  }, [isAuthenticated, login, location.pathname]);

  return isAuthenticated;
}
