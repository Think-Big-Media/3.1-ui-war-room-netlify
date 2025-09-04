/**
 * Google Ads OAuth2 authentication service
 * Handles OAuth2 flow and authentication status
 */

import { api } from '../lib/api';

export interface GoogleAdsAuthStatus {
  is_authenticated: boolean;
  customer_id?: string;
  scopes: string[];
  expires_at?: string;
  error?: string;
}

export interface GoogleAdsAuthUrl {
  authorization_url: string;
  message: string;
}

export interface GoogleAdsAuthResponse {
  success: boolean;
  message: string;
  org_id?: string;
  error?: string;
}

class GoogleAdsAuthService {
  private readonly baseUrl = '/api/v1';
  private isDemoMode = false;

  /**
   * Check if service is running in demo mode
   */
  get isInDemoMode(): boolean {
    return this.isDemoMode;
  }

  /**
   * Get Google Ads authentication status for current user's organization
   */
  async getAuthStatus(): Promise<GoogleAdsAuthStatus> {
    try {
      const response = await api.get<GoogleAdsAuthStatus>(`${this.baseUrl}/auth/google-ads/status`);
      return response.data;
    } catch (error: any) {
      // If we get a 404, the endpoint doesn't exist - use demo mode
      if (error?.response?.status === 404) {
        console.log('Google Ads API endpoints not available - using demo mode');
        this.isDemoMode = true;
        return {
          is_authenticated: false,
          scopes: [],
        };
      }

      // Only log other errors, not 404s (which are expected when backend is off)
      console.error('Error getting Google Ads auth status:', error);
      return {
        is_authenticated: false,
        scopes: [],
        error: error?.response?.data?.detail || 'Failed to get authentication status',
      };
    }
  }

  /**
   * Get Google Ads OAuth2 authorization URL
   */
  async getAuthUrl(state?: string): Promise<GoogleAdsAuthUrl> {
    // In demo mode, return a mock URL
    if (this.isDemoMode) {
      return {
        authorization_url: '#',
        message: 'Demo mode - OAuth flow not available',
      };
    }

    try {
      const response = await api.post<GoogleAdsAuthUrl>(
        `${this.baseUrl}/auth/google-ads/redirect`,
        {
          state,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting Google Ads auth URL:', error);
      throw new Error(error?.response?.data?.detail || 'Failed to generate authorization URL');
    }
  }

  /**
   * Manually refresh Google Ads access token
   */
  async refreshToken(): Promise<GoogleAdsAuthResponse> {
    // In demo mode, return mock success
    if (this.isDemoMode) {
      return {
        success: true,
        message: 'Demo mode - token refresh simulated',
      };
    }

    try {
      const response = await api.post<GoogleAdsAuthResponse>(
        `${this.baseUrl}/auth/google-ads/refresh`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error refreshing Google Ads token:', error);
      throw new Error(error?.response?.data?.detail || 'Failed to refresh token');
    }
  }

  /**
   * Revoke Google Ads access
   */
  async revokeAccess(): Promise<GoogleAdsAuthResponse> {
    // In demo mode, return mock success
    if (this.isDemoMode) {
      return {
        success: true,
        message: 'Demo mode - access revocation simulated',
      };
    }

    try {
      const response = await api.post<GoogleAdsAuthResponse>(
        `${this.baseUrl}/auth/google-ads/revoke`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error revoking Google Ads access:', error);
      throw new Error(error?.response?.data?.detail || 'Failed to revoke access');
    }
  }

  /**
   * Start OAuth2 flow by redirecting user to Google
   */
  async startOAuthFlow(state?: string): Promise<void> {
    // In demo mode, don't redirect - just log
    if (this.isDemoMode) {
      console.log('Demo mode - OAuth flow would start here');
      return;
    }

    try {
      const { authorization_url } = await this.getAuthUrl(state);

      // Redirect to Google OAuth2 page
      window.location.href = authorization_url;
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      throw error;
    }
  }

  /**
   * Check if user is coming back from OAuth2 callback
   */
  checkOAuthCallback(): {
    success?: boolean;
    error?: string;
    org_id?: string;
  } | null {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('success') || urlParams.has('error')) {
      return {
        success: urlParams.get('success') === 'true',
        error: urlParams.get('error') || undefined,
        org_id: urlParams.get('org_id') || undefined,
      };
    }

    return null;
  }

  /**
   * Clear OAuth2 callback parameters from URL
   */
  clearCallbackParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('success');
    url.searchParams.delete('error');
    url.searchParams.delete('org_id');

    // Update URL without triggering page reload
    window.history.replaceState({}, document.title, url.toString());
  }
}

export const googleAdsAuthService = new GoogleAdsAuthService();
