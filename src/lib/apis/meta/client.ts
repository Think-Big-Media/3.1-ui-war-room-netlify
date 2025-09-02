/**
 * Meta Business API Client
 * Handles requests with rate limiting, caching, and logging
 */

import { MetaAuth } from './auth';
import { rateLimiter } from './rateLimiter';
import { metaCache } from './cache';
import { type MetaApiResponse, type MetaApiError, type MetaConfig } from './types';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  params?: Record<string, any>;
  body?: Record<string, any>;
  skipCache?: boolean;
  cacheTTL?: number;
}

interface RequestLog {
  timestamp: Date;
  method: string;
  endpoint: string;
  params: Record<string, any>;
  response?: any;
  error?: any;
  duration: number;
}

export class MetaApiClient {
  private auth: MetaAuth;
  private baseUrl = 'https://graph.facebook.com';
  private apiVersion: string;
  private requestLogs: RequestLog[] = [];
  private maxLogs = 100;

  constructor(auth: MetaAuth, config?: Partial<MetaConfig>) {
    this.auth = auth;
    this.apiVersion = config?.apiVersion || 'v19.0';
  }

  /**
   * Make authenticated API request
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<MetaApiResponse<T>> {
    const startTime = Date.now();
    const { method = 'GET', params = {}, body, skipCache = false, cacheTTL } = options;

    // Generate cache key
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params)}`;

    // Check cache first for GET requests
    if (method === 'GET' && !skipCache) {
      const cached = metaCache.get<MetaApiResponse<T>>(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${endpoint}`);
        return cached;
      }
    }

    // Wait for rate limit if needed
    await rateLimiter.waitForRateLimit();

    // Get current token
    const token = this.auth.getCurrentToken();
    if (!token?.access_token) {
      throw new Error('No valid access token available');
    }

    // Build URL
    const url = new URL(`${this.baseUrl}/${this.apiVersion}/${endpoint}`);

    // Add access token
    params.access_token = token.access_token;

    // Add params to URL for GET requests
    if (method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare request
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST requests
    if (method === 'POST' && body) {
      requestInit.body = JSON.stringify(body);
    }

    try {
      // Make request
      const response = await fetch(url.toString(), requestInit);
      const responseData = await response.json();

      // Log request
      this.logRequest({
        timestamp: new Date(),
        method,
        endpoint,
        params,
        response: response.ok ? responseData : undefined,
        error: !response.ok ? responseData : undefined,
        duration: Date.now() - startTime,
      });

      if (!response.ok) {
        const error = responseData as MetaApiError;

        // Handle rate limit errors
        if (response.status === 429 || error.error?.code === 4) {
          rateLimiter.handleRateLimitError(error);
          // Retry after backoff
          return this.request<T>(endpoint, options);
        }

        throw error;
      }

      // Record successful request
      rateLimiter.recordSuccess(response.headers);

      // Cache successful GET responses
      if (method === 'GET' && !skipCache) {
        metaCache.set(cacheKey, responseData, cacheTTL);
      }

      return responseData as MetaApiResponse<T>;
    } catch (error) {
      // Log error
      this.logRequest({
        timestamp: new Date(),
        method,
        endpoint,
        params,
        error,
        duration: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Make paginated request
   */
  async *paginate<T>(
    endpoint: string,
    params: Record<string, any> = {},
    maxPages = 10
  ): AsyncGenerator<T[], void, unknown> {
    let nextUrl: string | undefined;
    let pageCount = 0;

    do {
      const response = await this.request<T[]>(
        nextUrl ? nextUrl.replace(`${this.baseUrl}/${this.apiVersion}/`, '') : endpoint,
        { params: nextUrl ? {} : params }
      );

      yield response.data;

      nextUrl = response.paging?.next;
      pageCount++;
    } while (nextUrl && pageCount < maxPages);
  }

  /**
   * Batch multiple requests
   */
  async batch(
    requests: Array<{
      method: string;
      relative_url: string;
      body?: string;
    }>
  ): Promise<any[]> {
    const batchParams = {
      batch: JSON.stringify(requests),
    };

    const response = await this.request<any[]>('', {
      method: 'POST',
      body: batchParams,
    });

    return response.data;
  }

  /**
   * Get request logs
   */
  getRequestLogs(): RequestLog[] {
    return [...this.requestLogs];
  }

  /**
   * Clear request logs
   */
  clearLogs(): void {
    this.requestLogs = [];
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return rateLimiter.getStatus();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    metaCache.clear();
  }

  /**
   * Invalidate cache for specific pattern
   */
  invalidateCache(pattern: string): void {
    metaCache.invalidatePattern(pattern);
  }

  private logRequest(log: RequestLog): void {
    this.requestLogs.push(log);

    // Keep only recent logs
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogs);
    }

    // Console log in development
    if (import.meta.env.DEV) {
      console.log(`[Meta API] ${log.method} ${log.endpoint} - ${log.duration}ms`, {
        params: log.params,
        response: log.response,
        error: log.error,
      });
    }
  }
}

// Factory function
export function createMetaApiClient(config?: Partial<MetaConfig>): MetaApiClient {
  const auth = new MetaAuth({
    appId: config?.appId || import.meta.env.VITE_META_APP_ID || '',
    appSecret: config?.appSecret || import.meta.env.VITE_META_APP_SECRET || '',
    redirectUri: config?.redirectUri || `${window.location.origin}/auth/meta/callback`,
    apiVersion: config?.apiVersion || 'v19.0',
  });

  return new MetaApiClient(auth, config);
}
