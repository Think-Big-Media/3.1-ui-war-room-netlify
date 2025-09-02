// Authentication manager for Meta Business API

import { type MetaConfig, type AccessToken } from './types';
import { MetaAuthenticationError } from './errors';

export class MetaAuthManager {
  private config: MetaConfig;
  private tokenCache: Map<string, AccessToken> = new Map();

  constructor(config: MetaConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth login URL for user authentication
   */
  getLoginUrl(scopes: string[] = ['ads_read', 'ads_management']): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: this.generateState(),
    });

    return `https://www.facebook.com/v${this.config.apiVersion}/dialog/oauth?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<AccessToken> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      redirect_uri: this.config.redirectUri,
      code,
    });

    try {
      const response = await fetch(
        `https://graph.facebook.com/v${this.config.apiVersion}/oauth/access_token?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new MetaAuthenticationError(
          error.error?.message || 'Failed to exchange code for token'
        );
      }

      const token: AccessToken = await response.json();

      // Cache the token
      this.cacheToken('default', token);

      return token;
    } catch (error) {
      if (error instanceof MetaAuthenticationError) {
        throw error;
      }
      throw new MetaAuthenticationError(`Token exchange failed: ${(error as Error).message}`);
    }
  }

  /**
   * Refresh an existing access token
   */
  async refreshToken(refreshToken: string): Promise<AccessToken> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: refreshToken,
    });

    try {
      const response = await fetch(
        `https://graph.facebook.com/v${this.config.apiVersion}/oauth/access_token?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new MetaAuthenticationError(error.error?.message || 'Failed to refresh token');
      }

      const token: AccessToken = await response.json();

      // Update cached token
      this.cacheToken('default', token);

      return token;
    } catch (error) {
      if (error instanceof MetaAuthenticationError) {
        throw error;
      }
      throw new MetaAuthenticationError(`Token refresh failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate an access token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(
        'https://graph.facebook.com/debug_token?' +
          `input_token=${token}&` +
          `access_token=${this.config.appId}|${this.config.appSecret}`
      );

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const { data } = result;

      // Check if token is valid and not expired
      return (
        data.is_valid &&
        data.app_id === this.config.appId &&
        (!data.expires_at || data.expires_at * 1000 > Date.now())
      );
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get cached token
   */
  getCachedToken(userId = 'default'): AccessToken | null {
    return this.tokenCache.get(userId) || null;
  }

  /**
   * Cache a token
   */
  cacheToken(userId: string, token: AccessToken): void {
    this.tokenCache.set(userId, token);
  }

  /**
   * Clear cached tokens
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.tokenCache.delete(userId);
    } else {
      this.tokenCache.clear();
    }
  }

  /**
   * Get app access token (for server-to-server calls)
   */
  getAppAccessToken(): string {
    return `${this.config.appId}|${this.config.appSecret}`;
  }

  /**
   * Decode permissions from access token
   */
  async getTokenPermissions(token: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v${this.config.apiVersion}/me/permissions?` +
          `access_token=${token}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const result = await response.json();

      return result.data
        .filter((perm: any) => perm.status === 'granted')
        .map((perm: any) => perm.permission);
    } catch (error) {
      console.error('Failed to get token permissions:', error);
      return [];
    }
  }

  /**
   * Generate random state for OAuth flow (CSRF protection)
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Exchange a short-lived token for a long-lived token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<AccessToken> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    try {
      const response = await fetch(
        `https://graph.facebook.com/v${this.config.apiVersion}/oauth/access_token?${params}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new MetaAuthenticationError(error.error?.message || 'Failed to get long-lived token');
      }

      const token: AccessToken = await response.json();

      // Long-lived tokens typically last 60 days
      console.info('Long-lived token obtained, expires in ~60 days');

      return token;
    } catch (error) {
      if (error instanceof MetaAuthenticationError) {
        throw error;
      }
      throw new MetaAuthenticationError(
        `Long-lived token exchange failed: ${(error as Error).message}`
      );
    }
  }
}
