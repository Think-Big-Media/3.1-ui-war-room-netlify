/**
 * @fileoverview Comprehensive test suite for Meta Business API client
 * Generated for critical path coverage and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@testing-library/jest-dom';
import { MetaBusinessClient } from '../client';
import { type MetaConfig } from '../types';
import { RateLimiter } from '../rateLimiter';
import { Cache } from '../cache';

// Mock dependencies
vi.mock('../rateLimiter');
vi.mock('../cache');
vi.mock('node:fs/promises');

const mockConfig: MetaConfig = {
  appId: 'test-app-id',
  appSecret: 'test-app-secret',
  redirectUri: 'http://localhost:3000/callback',
  apiVersion: 'v19.0',
};

describe('MetaBusinessClient', () => {
  let client: MetaBusinessClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    client = new MetaBusinessClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(client).toBeInstanceOf(MetaBusinessClient);
    });

    it('should throw error with invalid config', () => {
      expect(() => new MetaBusinessClient({} as MetaConfig)).toThrow();
    });

    it('should set default API version if not provided', () => {
      const configWithoutVersion = { ...mockConfig };
      delete (configWithoutVersion as any).apiVersion;
      const clientWithDefaults = new MetaBusinessClient(configWithoutVersion);
      expect(clientWithDefaults).toBeInstanceOf(MetaBusinessClient);
    });
  });

  describe('Authentication', () => {
    describe('getAuthUrl', () => {
      it('should generate valid OAuth URL', () => {
        const scopes = ['ads_read', 'ads_management'];
        const state = 'test-state';
        const url = client.getAuthUrl(scopes, state);

        expect(url).toContain('https://www.facebook.com/v19.0/dialog/oauth');
        expect(url).toContain(`client_id=${mockConfig.appId}`);
        expect(url).toContain(`redirect_uri=${encodeURIComponent(mockConfig.redirectUri)}`);
        expect(url).toContain(`scope=${scopes.join('%2C')}`);
        expect(url).toContain(`state=${state}`);
      });

      it('should handle empty scopes array', () => {
        const url = client.getAuthUrl([], 'test-state');
        expect(url).toContain('scope=');
      });

      it('should handle special characters in redirect URI', () => {
        const configWithSpecialChars = {
          ...mockConfig,
          redirectUri: 'http://localhost:3000/callback?param=value&other=test',
        };
        const clientWithSpecialChars = new MetaBusinessClient(configWithSpecialChars);
        const url = clientWithSpecialChars.getAuthUrl(['ads_read'], 'test');

        expect(url).toContain(encodeURIComponent(configWithSpecialChars.redirectUri));
      });
    });

    describe('exchangeCodeForToken', () => {
      it('should successfully exchange code for access token', async () => {
        const mockResponse = {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.exchangeCodeForToken('test-code');

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('https://graph.facebook.com/v19.0/oauth/access_token'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/x-www-form-urlencoded',
            }),
          })
        );
      });

      it('should handle API error responses', async () => {
        const mockError = {
          error: {
            message: 'Invalid authorization code',
            type: 'OAuthException',
            code: 100,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockError),
        });

        await expect(client.exchangeCodeForToken('invalid-code')).rejects.toThrow(
          'Invalid authorization code'
        );
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(client.exchangeCodeForToken('test-code')).rejects.toThrow('Network error');
      });

      it('should handle malformed response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await expect(client.exchangeCodeForToken('test-code')).rejects.toThrow();
      });
    });

    describe('refreshAccessToken', () => {
      it('should successfully refresh access token', async () => {
        const mockResponse = {
          access_token: 'new-access-token',
          token_type: 'bearer',
          expires_in: 3600,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.refreshAccessToken('refresh-token');

        expect(result).toEqual(mockResponse);
      });

      it('should handle refresh token expiration', async () => {
        const mockError = {
          error: {
            message: 'Invalid refresh token',
            type: 'OAuthException',
            code: 190,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockError),
        });

        await expect(client.refreshAccessToken('expired-token')).rejects.toThrow(
          'Invalid refresh token'
        );
      });
    });
  });

  describe('API Requests', () => {
    beforeEach(() => {
      client.setAccessToken('test-access-token');
    });

    describe('makeRequest', () => {
      it('should make successful GET request', async () => {
        const mockResponse = { data: 'test-data' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.makeRequest('/test-endpoint');

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('https://graph.facebook.com/v19.0/test-endpoint'),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              Authorization: 'Bearer test-access-token',
            }),
          })
        );
      });

      it('should make successful POST request with data', async () => {
        const mockResponse = { success: true };
        const postData = { name: 'Test Campaign' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.makeRequest('/test-endpoint', {
          method: 'POST',
          data: postData,
        });

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(postData),
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      it('should handle rate limiting', async () => {
        const rateLimiter = client.rateLimiter as any;
        rateLimiter.checkLimit.mockResolvedValueOnce(false);

        await expect(client.makeRequest('/test-endpoint')).rejects.toThrow('Rate limit exceeded');
      });

      it('should handle API errors with details', async () => {
        const mockError = {
          error: {
            message: 'Insufficient permissions',
            type: 'FacebookApiException',
            code: 200,
            error_subcode: 1234,
            fbtrace_id: 'trace-123',
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve(mockError),
        });

        await expect(client.makeRequest('/test-endpoint')).rejects.toThrow(
          'Insufficient permissions'
        );
      });

      it('should retry on temporary errors', async () => {
        // First call fails with 500
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Internal Server Error' } }),
        });

        // Second call succeeds
        const mockResponse = { data: 'success' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await client.makeRequest('/test-endpoint');

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should handle cache hits', async () => {
        const cache = client.cache as any;
        const cachedData = { data: 'cached-response' };
        cache.get.mockReturnValue(cachedData);

        const result = await client.makeRequest('/test-endpoint');

        expect(result).toEqual(cachedData);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should set cache on successful responses', async () => {
        const cache = client.cache as any;
        cache.get.mockReturnValue(null);

        const mockResponse = { data: 'fresh-data' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await client.makeRequest('/test-endpoint');

        expect(cache.set).toHaveBeenCalledWith(expect.any(String), mockResponse);
      });
    });

    describe('Request Parameters', () => {
      it('should handle query parameters correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await client.makeRequest('/test-endpoint', {
          params: {
            fields: 'id,name,status',
            limit: 25,
            after: 'cursor-123',
          },
        });

        const callUrl = mockFetch.mock.calls[0][0];
        expect(callUrl).toContain('fields=id%2Cname%2Cstatus');
        expect(callUrl).toContain('limit=25');
        expect(callUrl).toContain('after=cursor-123');
      });

      it('should handle undefined query parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await client.makeRequest('/test-endpoint', {
          params: {
            fields: 'id,name',
            limit: undefined,
            after: null,
          },
        });

        const callUrl = mockFetch.mock.calls[0][0];
        expect(callUrl).toContain('fields=id%2Cname');
        expect(callUrl).not.toContain('limit=');
        expect(callUrl).not.toContain('after=');
      });
    });

    describe('Error Handling Edge Cases', () => {
      it('should handle non-JSON error responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
          json: () => Promise.reject(new Error('Not JSON')),
        });

        await expect(client.makeRequest('/test-endpoint')).rejects.toThrow('HTTP 500');
      });

      it('should handle timeout errors', async () => {
        mockFetch.mockImplementationOnce(
          () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
        );

        await expect(client.makeRequest('/test-endpoint')).rejects.toThrow('Timeout');
      });

      it('should handle malformed JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON')),
          text: () => Promise.resolve('invalid json response'),
        });

        await expect(client.makeRequest('/test-endpoint')).rejects.toThrow('Invalid JSON');
      });
    });
  });

  describe('Token Management', () => {
    it('should set and get access token', () => {
      const token = 'test-access-token';
      client.setAccessToken(token);
      expect(client.getAccessToken()).toBe(token);
    });

    it('should clear access token', () => {
      client.setAccessToken('test-token');
      client.clearAccessToken();
      expect(client.getAccessToken()).toBeNull();
    });

    it('should throw error when making request without token', async () => {
      client.clearAccessToken();

      await expect(client.makeRequest('/test-endpoint')).rejects.toThrow('Access token required');
    });
  });

  describe('Batch Requests', () => {
    it('should handle batch requests', async () => {
      const batchRequests = [
        { method: 'GET', relative_url: 'me' },
        { method: 'GET', relative_url: 'me/accounts' },
      ];

      const mockResponse = [
        { code: 200, body: JSON.stringify({ id: '123', name: 'Test User' }) },
        { code: 200, body: JSON.stringify({ data: [] }) },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.batchRequest(batchRequests);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('batch='),
        })
      );
    });

    it('should handle batch request errors', async () => {
      const batchRequests = [{ method: 'GET', relative_url: 'invalid-endpoint' }];

      const mockResponse = [
        {
          code: 400,
          body: JSON.stringify({
            error: { message: 'Invalid endpoint', code: 100 },
          }),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.batchRequest(batchRequests);
      expect(result[0].code).toBe(400);
    });
  });

  describe('Long-lived Token Exchange', () => {
    it('should exchange short-lived token for long-lived token', async () => {
      const mockResponse = {
        access_token: 'long-lived-token',
        token_type: 'bearer',
        expires_in: 5183944, // ~60 days
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.exchangeForLongLivedToken('short-lived-token');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('access_token'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });
});
