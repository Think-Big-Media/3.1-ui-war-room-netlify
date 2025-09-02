// Main Meta Business API client

import {
  type MetaConfig,
  type MetaAPIResponse,
  type BatchRequest,
  type BatchResponse,
} from './types';
import { MetaAuthManager } from './auth';
import { MetaRateLimiter } from './rateLimiter';
import { MetaCircuitBreaker } from './circuitBreaker';
import {
  MetaAPIError,
  MetaAuthenticationError,
  MetaValidationError,
  MetaPermissionError,
  MetaRateLimitError,
} from './errors';

export class MetaAPIClient {
  private baseUrl: string;
  private auth: MetaAuthManager;
  private rateLimiter: MetaRateLimiter;
  private circuitBreaker: MetaCircuitBreaker;

  constructor(
    config: MetaConfig,
    auth?: MetaAuthManager,
    rateLimiter?: MetaRateLimiter,
    circuitBreaker?: MetaCircuitBreaker
  ) {
    this.baseUrl = `https://graph.facebook.com/v${config.apiVersion}`;
    this.auth = auth || new MetaAuthManager(config);
    this.rateLimiter = rateLimiter || new MetaRateLimiter();
    this.circuitBreaker = circuitBreaker || new MetaCircuitBreaker();

    // Set up circuit breaker listeners
    this.setupCircuitBreakerListeners();
  }

  /**
   * Make an authenticated request to Meta API
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'DELETE';
      params?: Record<string, any>;
      body?: Record<string, any>;
      token?: string;
    } = {}
  ): Promise<T> {
    const { method = 'GET', params = {}, body, token } = options;

    // Get access token
    const accessToken = token || this.auth.getCachedToken()?.access_token;
    if (!accessToken) {
      throw new MetaAuthenticationError('No access token available');
    }

    // Check rate limits
    await this.rateLimiter.checkLimit(accessToken);

    // Build URL
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.append('access_token', accessToken);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    // Execute request with circuit breaker
    return this.circuitBreaker.execute(async () => {
      const response = await fetch(url.toString(), fetchOptions);

      // Update rate limiter from response headers
      this.rateLimiter.updateFromHeaders(response.headers, accessToken);

      // Parse response
      const data = await response.json();

      // Handle errors
      if (!response.ok || data.error) {
        throw this.handleAPIError(data.error || data, response.status);
      }

      return data as T;
    });
  }

  /**
   * Make batch requests to Meta API
   */
  async batchRequest(requests: BatchRequest[], token?: string): Promise<BatchResponse[]> {
    const accessToken = token || this.auth.getCachedToken()?.access_token;
    if (!accessToken) {
      throw new MetaAuthenticationError('No access token available');
    }

    // Check rate limits (batch counts as multiple requests)
    await this.rateLimiter.checkLimit(accessToken, requests.length);

    const batch = requests.map((req) => ({
      method: req.method,
      relative_url: req.relative_url,
      body: req.body ? new URLSearchParams(req.body).toString() : undefined,
    }));

    const response = await this.request<{ data: BatchResponse[] }>('', {
      method: 'POST',
      body: {
        batch: JSON.stringify(batch),
        access_token: accessToken,
      },
    });

    return response.data;
  }

  /**
   * Get paginated results
   */
  async *paginate<T>(
    endpoint: string,
    params: Record<string, any> = {},
    token?: string
  ): AsyncGenerator<T[], void, unknown> {
    let nextUrl: string | null = null;
    let isFirstPage = true;

    do {
      let response: MetaAPIResponse<T[]>;

      if (isFirstPage) {
        response = await this.request<MetaAPIResponse<T[]>>(endpoint, { params, token });
        isFirstPage = false;
      } else if (nextUrl) {
        // Use the full next URL for subsequent pages
        const url = new URL(nextUrl);
        const accessToken = token || this.auth.getCachedToken()?.access_token;

        await this.rateLimiter.checkLimit(accessToken!);

        const fetchResponse = await this.circuitBreaker.execute(async () => {
          return fetch(nextUrl!);
        });

        response = await fetchResponse.json();
      } else {
        break;
      }

      yield response.data;

      nextUrl = response.paging?.next || null;
    } while (nextUrl);
  }

  /**
   * Handle API errors
   */
  private handleAPIError(error: any, statusCode: number): MetaAPIError {
    const message = error.message || 'Unknown error';
    const code = error.code || statusCode;
    const subcode = error.error_subcode;
    const fbtraceId = error.fbtrace_id;

    // Rate limit error
    if (code === 4 || code === 17 || code === 32) {
      const timeToWait = error.error_data?.estimated_time_to_regain_access;
      return new MetaRateLimitError(message, timeToWait);
    }

    // Authentication error
    if (code === 190 || code === 102) {
      return new MetaAuthenticationError(message);
    }

    // Permission error
    if (code === 200 || code === 10) {
      return new MetaPermissionError(message);
    }

    // Validation error
    if (code === 100) {
      return new MetaValidationError(message);
    }

    // Generic API error
    return new MetaAPIError(message, code, subcode, fbtraceId);
  }

  /**
   * Set up circuit breaker event listeners
   */
  private setupCircuitBreakerListeners(): void {
    this.circuitBreaker.onOpen(() => {
      console.error('Meta API circuit breaker opened - API unavailable');
    });

    this.circuitBreaker.onClose(() => {
      console.info('Meta API circuit breaker closed - API available');
    });

    this.circuitBreaker.onHalfOpen(() => {
      console.info('Meta API circuit breaker half-open - testing API');
    });
  }

  /**
   * Get access token for external use
   */
  getAccessToken(): string | null {
    const token = this.auth.getCachedToken();
    return token?.access_token || null;
  }

  /**
   * Get client health status
   */
  getHealthStatus(): {
    auth: boolean;
    rateLimiter: any;
    circuitBreaker: any;
  } {
    const token = this.auth.getCachedToken();
    const rateLimiterStats = token ? this.rateLimiter.getUsageStats(token.access_token) : null;

    return {
      auth: Boolean(token),
      rateLimiter: rateLimiterStats,
      circuitBreaker: this.circuitBreaker.getMetrics(),
    };
  }
}
