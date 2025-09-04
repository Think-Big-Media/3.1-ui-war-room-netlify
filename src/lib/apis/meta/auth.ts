/**
 * OAuth2 Authentication for Meta Business API
 */

import { type MetaConfig, type MetaTokenResponse } from './types';

export class MetaAuth {
  private config: MetaConfig;
  private tokenStorage: Map<string, MetaTokenResponse> = new Map();

  constructor(config: MetaConfig) {
    this.config = {
      ...config,
      apiVersion: config.apiVersion || 'v19.0',
    };
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(state: string, scopes: string[] = []): string {
    const defaultScopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'read_insights',
    ];

    const allScopes = [...new Set([...defaultScopes, ...scopes])];

    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: allScopes.join(','),
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.config.apiVersion}/dialog/oauth?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      redirect_uri: this.config.redirectUri,
      code,
    });

    const response = await fetch(
      `https://graph.facebook.com/${this.config.apiVersion}/oauth/access_token?${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error?.message || 'Unknown error'}`);
    }

    const tokenData = (await response.json()) as MetaTokenResponse;

    // Store token for this session
    this.tokenStorage.set('current', tokenData);

    return tokenData;
  }

  /**
   * Get long-lived token from short-lived token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/${this.config.apiVersion}/oauth/access_token?${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Long-lived token exchange failed: ${error.error?.message || 'Unknown error'}`
      );
    }

    const tokenData = (await response.json()) as MetaTokenResponse;

    // Update stored token
    this.tokenStorage.set('current', tokenData);

    return tokenData;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken?: string): Promise<MetaTokenResponse> {
    const currentToken = this.getCurrentToken();
    const tokenToRefresh = refreshToken || currentToken?.refresh_token;

    if (!tokenToRefresh) {
      throw new Error('No refresh token available');
    }

    // Meta doesn't use traditional refresh tokens
    // Instead, we exchange for a new long-lived token
    if (currentToken?.access_token) {
      return this.getLongLivedToken(currentToken.access_token);
    }

    throw new Error('No valid token to refresh');
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    scopes?: string[];
  }> {
    const params = new URLSearchParams({
      input_token: token,
      access_token: `${this.config.appId}|${this.config.appSecret}`,
    });

    const response = await fetch(
      `https://graph.facebook.com/${this.config.apiVersion}/debug_token?${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return { isValid: false };
    }

    const data = await response.json();
    const tokenData = data.data;

    return {
      isValid: tokenData.is_valid,
      expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : undefined,
      scopes: tokenData.scopes,
    };
  }

  /**
   * Revoke user permissions
   */
  async revokePermissions(token: string): Promise<boolean> {
    const response = await fetch(
      `https://graph.facebook.com/${this.config.apiVersion}/me/permissions`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      this.tokenStorage.delete('current');
      return true;
    }

    return false;
  }

  /**
   * Get current stored token
   */
  getCurrentToken(): MetaTokenResponse | null {
    return this.tokenStorage.get('current') || null;
  }

  /**
   * Set token manually (for testing or restoration)
   */
  setToken(token: MetaTokenResponse): void {
    this.tokenStorage.set('current', token);
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    this.tokenStorage.clear();
  }
}

// Helper function to create auth instance
export function createMetaAuth(config: Partial<MetaConfig> = {}): MetaAuth {
  const defaultConfig: MetaConfig = {
    appId: import.meta.env.VITE_META_APP_ID || '',
    appSecret: import.meta.env.VITE_META_APP_SECRET || '',
    redirectUri:
      import.meta.env.VITE_META_REDIRECT_URI || `${window.location.origin}/auth/meta/callback`,
    apiVersion: 'v19.0',
  };

  return new MetaAuth({ ...defaultConfig, ...config });
}
