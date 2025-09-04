// Authentication manager for Google Ads API

import { type GoogleAdsConfig, type GoogleOAuthToken } from './types';
import { GoogleAdsAuthenticationError, GoogleAdsPermissionError } from './errors';

export class GoogleAdsAuthManager {
  private config: GoogleAdsConfig;
  private tokenCache: Map<string, GoogleOAuthToken> = new Map();
  private readonly GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';
  private readonly TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
  private readonly AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

  constructor(config: GoogleAdsConfig) {
    this.config = config;

    // Load cached token from localStorage
    const cachedToken = localStorage.getItem('google_ads_token');
    if (cachedToken) {
      try {
        const token = JSON.parse(cachedToken);
        this.tokenCache.set('default', token);
      } catch {
        // Ignore invalid cached tokens
      }
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(
    state?: string,
    additionalScopes: string[] = [],
    accessType: 'online' | 'offline' = 'offline'
  ): string {
    const scopes = [this.GOOGLE_ADS_SCOPE, ...additionalScopes];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: accessType, // offline for refresh tokens
      prompt: 'consent', // Force consent to get refresh token
      ...(state && { state }),
    });

    return `${this.AUTH_ENDPOINT}?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthToken> {
    const params = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    });

    try {
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleAdsAuthenticationError(
          `Failed to exchange code: ${error.error_description || error.error}`,
          error.error
        );
      }

      const tokenData = await response.json();

      // Calculate expiration time
      const token: GoogleOAuthToken = {
        ...tokenData,
        expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
      };

      // Cache the token
      this.cacheToken('default', token);

      return token;
    } catch (error) {
      if (error instanceof GoogleAdsAuthenticationError) {
        throw error;
      }
      throw new GoogleAdsAuthenticationError(
        `Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Refresh an access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthToken> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
    });

    try {
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GoogleAdsAuthenticationError(
          `Failed to refresh token: ${error.error_description || error.error}`,
          error.error
        );
      }

      const tokenData = await response.json();

      // Calculate expiration time and preserve refresh token
      const token: GoogleOAuthToken = {
        ...tokenData,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
      };

      // Update cached token
      this.cacheToken('default', token);

      return token;
    } catch (error) {
      if (error instanceof GoogleAdsAuthenticationError) {
        throw error;
      }
      throw new GoogleAdsAuthenticationError(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get valid access token (refreshes if needed)
   */
  async getValidAccessToken(userId = 'default'): Promise<string> {
    const token = this.getCachedToken(userId);

    if (!token) {
      throw new GoogleAdsAuthenticationError('No token available for user');
    }

    // Check if token is expired or about to expire (5 min buffer)
    const isExpired = token.expires_at && Date.now() + 300000 >= token.expires_at;

    if (isExpired && token.refresh_token) {
      // Refresh the token
      const newToken = await this.refreshAccessToken(token.refresh_token);
      return newToken.access_token;
    }

    return token.access_token;
  }

  /**
   * Validate token has required scopes
   */
  async validateTokenScopes(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        return false;
      }

      const tokenInfo = await response.json();
      const scopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];

      // Check for Google Ads scope
      if (!scopes.includes(this.GOOGLE_ADS_SCOPE)) {
        throw new GoogleAdsPermissionError(
          'Token missing required Google Ads scope',
          this.GOOGLE_ADS_SCOPE
        );
      }

      return true;
    } catch (error) {
      if (error instanceof GoogleAdsPermissionError) {
        throw error;
      }
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get cached token
   */
  getCachedToken(userId = 'default'): GoogleOAuthToken | null {
    return this.tokenCache.get(userId) || null;
  }

  /**
   * Cache a token
   */
  cacheToken(userId: string, token: GoogleOAuthToken): void {
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
      localStorage.removeItem('google_ads_token');
    }
  }

  /**
   * Revoke a token
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      });

      return response.ok;
    } catch (error) {
      console.error('Token revocation error:', error);
      return false;
    }
  }

  /**
   * Generate state parameter for CSRF protection
   */
  generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Alias methods for compatibility with hooks
   */
  getLoginUrl(scopes: string[] = [this.GOOGLE_ADS_SCOPE]): string {
    return this.getAuthorizationUrl(undefined, scopes);
  }

  async exchangeCodeForToken(code: string): Promise<GoogleOAuthToken> {
    const token = await this.exchangeCodeForTokens(code);
    // Cache the token
    this.cacheToken('default', token);
    localStorage.setItem('google_ads_token', JSON.stringify(token));
    return token;
  }

  async refreshToken(refreshToken: string): Promise<GoogleOAuthToken> {
    const token = await this.refreshAccessToken(refreshToken);
    // Cache the refreshed token
    this.cacheToken('default', token);
    localStorage.setItem('google_ads_token', JSON.stringify(token));
    return token;
  }

  /**
   * Create service account credentials (for server-to-server auth)
   */
  async createServiceAccountToken(
    serviceAccountKey: any,
    impersonatedEmail?: string
  ): Promise<GoogleOAuthToken> {
    // This would implement JWT assertion flow for service accounts
    // For now, throw an error indicating it needs implementation
    throw new GoogleAdsAuthenticationError(
      'Service account authentication not yet implemented. Use OAuth2 flow instead.'
    );
  }
}
