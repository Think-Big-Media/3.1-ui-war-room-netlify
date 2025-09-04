// Main Google Ads API client

import {
  type GoogleAdsConfig,
  type GoogleAdsHeaders,
  type GoogleAdsError,
  type SearchGoogleAdsResponse,
  type MutateOperation,
  type MutateResponse,
  type CustomerQuery,
} from './types';
import { GoogleAdsAuthManager } from './auth';
import { GoogleAdsRateLimiter } from './rateLimiter';
import { GoogleAdsCircuitBreaker } from './circuitBreaker';
import {
  GoogleAdsAPIError,
  GoogleAdsAuthenticationError,
  GoogleAdsValidationError,
  GoogleAdsPermissionError,
  GoogleAdsRateLimitError,
  GoogleAdsQuotaError,
  GoogleAdsPartialFailureError,
} from './errors';

export class GoogleAdsClient {
  private baseUrl: string;
  private auth: GoogleAdsAuthManager;
  private rateLimiter: GoogleAdsRateLimiter;
  private circuitBreaker: GoogleAdsCircuitBreaker;

  constructor(
    private config: GoogleAdsConfig,
    auth?: GoogleAdsAuthManager,
    rateLimiter?: GoogleAdsRateLimiter,
    circuitBreaker?: GoogleAdsCircuitBreaker
  ) {
    this.baseUrl = `https://googleads.googleapis.com/${config.apiVersion}`;
    this.auth = auth || new GoogleAdsAuthManager(config);
    this.rateLimiter = rateLimiter || new GoogleAdsRateLimiter();
    this.circuitBreaker = circuitBreaker || new GoogleAdsCircuitBreaker();

    // Set up circuit breaker listeners
    this.setupCircuitBreakerListeners();
  }

  /**
   * Search Google Ads API
   */
  async search<T = any>(
    customerId: string,
    query: CustomerQuery
  ): Promise<SearchGoogleAdsResponse<T>> {
    const endpoint = `customers/${customerId}/googleAds:search`;

    // Check operation count (search counts as 1 operation)
    await this.rateLimiter.checkLimit(this.config.developerToken, 1);

    return this.circuitBreaker.execute(async () => {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: query,
        customerId,
      });

      return response as SearchGoogleAdsResponse<T>;
    });
  }

  /**
   * Stream search results (for large result sets)
   */
  async *searchStream<T = any>(
    customerId: string,
    query: CustomerQuery
  ): AsyncGenerator<T[], void, unknown> {
    let pageToken: string | undefined;

    do {
      const queryWithToken: CustomerQuery = {
        ...query,
        pageToken,
      };

      const response = await this.search<T>(customerId, queryWithToken);

      yield response.results;

      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  /**
   * Mutate resources
   */
  async mutate(
    customerId: string,
    operations: MutateOperation[],
    options: {
      partialFailure?: boolean;
      validateOnly?: boolean;
      responseContentType?: 'MUTABLE_RESOURCE' | 'RESOURCE_NAME_ONLY';
    } = {}
  ): Promise<MutateResponse> {
    // Check operation count
    await this.rateLimiter.checkLimit(this.config.developerToken, operations.length);

    // Build mutate request based on entity type
    const mutateRequests = this.buildMutateRequests(operations);

    return this.circuitBreaker.execute(async () => {
      const promises = mutateRequests.map((request) =>
        this.makeRequest(request.endpoint, {
          method: 'POST',
          body: {
            ...request.body,
            partialFailure: options.partialFailure,
            validateOnly: options.validateOnly,
            responseContentType: options.responseContentType,
          },
          customerId,
        })
      );

      const responses = await Promise.all(promises);

      // Combine responses
      const combinedResponse: MutateResponse = {
        results: responses.flatMap((r) => r.results || []),
        partialFailureError: responses.find((r) => r.partialFailureError)?.partialFailureError,
      };

      // Handle partial failures
      if (combinedResponse.partialFailureError && options.partialFailure) {
        const failures = this.parsePartialFailures(combinedResponse.partialFailureError);
        throw new GoogleAdsPartialFailureError(
          'Some operations failed',
          combinedResponse.results.length,
          failures.length,
          failures
        );
      }

      return combinedResponse;
    });
  }

  /**
   * Get resource by name
   */
  async get<T = any>(resourceName: string, fields?: string[]): Promise<T> {
    const customerId = this.extractCustomerId(resourceName);
    const query: CustomerQuery = {
      query: `SELECT ${fields ? fields.join(', ') : '*'} FROM ${this.getResourceType(resourceName)} WHERE resource_name = '${resourceName}'`,
    };

    const response = await this.search<T>(customerId, query);

    if (response.results.length === 0) {
      throw new GoogleAdsValidationError(`Resource not found: ${resourceName}`);
    }

    return response.results[0];
  }

  /**
   * Make authenticated request to Google Ads API
   */
  private async makeRequest(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'DELETE';
      body?: any;
      customerId?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<any> {
    const { method = 'POST', body, customerId, headers = {} } = options;

    // Get valid access token
    const accessToken = await this.auth.getValidAccessToken();

    // Build headers
    const requestHeaders: GoogleAdsHeaders = {
      'developer-token': this.config.developerToken,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add login-customer-id if provided
    if (this.config.loginCustomerId) {
      requestHeaders['login-customer-id'] = this.config.loginCustomerId;
    } else if (customerId && customerId !== this.config.loginCustomerId) {
      // Use the target customer ID as login customer ID if not specified
      requestHeaders['login-customer-id'] = customerId;
    }

    // Check request size
    const bodyString = body ? JSON.stringify(body) : '';
    this.rateLimiter.checkRequestSize(new Blob([bodyString]).size);

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method,
        headers: requestHeaders as any,
        body: bodyString || undefined,
      });

      // Update rate limiter from response
      this.rateLimiter.updateFromResponse(response.headers, this.config.developerToken);

      // Parse response
      const responseText = await response.text();
      let responseData: any;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        // If not JSON, return text
        responseData = { message: responseText };
      }

      // Handle errors
      if (!response.ok) {
        throw this.handleAPIError(responseData, response.status);
      }

      return responseData;
    } catch (error) {
      if (error instanceof GoogleAdsAPIError) {
        throw error;
      }

      // Network or other errors
      throw new GoogleAdsAPIError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'UNAVAILABLE'
      );
    }
  }

  /**
   * Build mutate requests grouped by entity type
   */
  private buildMutateRequests(operations: MutateOperation[]): Array<{
    endpoint: string;
    body: any;
  }> {
    // Group operations by entity type
    const grouped = new Map<string, MutateOperation[]>();

    operations.forEach((op) => {
      const ops = grouped.get(op.entity) || [];
      ops.push(op);
      grouped.set(op.entity, ops);
    });

    // Build requests
    const requests: Array<{ endpoint: string; body: any }> = [];

    grouped.forEach((ops, entity) => {
      const customerId = this.extractCustomerId(ops[0].resource.resourceName || '');
      const endpoint = `customers/${customerId}/${entity}:mutate`;

      const body: any = {
        operations: ops.map((op) => {
          const operation: any = {};

          if (op.operation === 'create') {
            operation.create = op.resource;
          } else if (op.operation === 'update') {
            operation.update = op.resource;
            if (op.updateMask) {
              operation.updateMask = op.updateMask.join(',');
            }
          } else if (op.operation === 'remove') {
            operation.remove = op.resource.resourceName;
          }

          return operation;
        }),
      };

      requests.push({ endpoint, body });
    });

    return requests;
  }

  /**
   * Handle API errors
   */
  private handleAPIError(error: GoogleAdsError, statusCode: number): GoogleAdsAPIError {
    const errorData = error.error;
    const message = errorData?.message || 'Unknown error';
    const status = errorData?.status || 'UNKNOWN';

    // Extract request ID if available
    const requestId = errorData?.details?.find((d) => d.requestId)?.requestId;

    // Handle specific error types
    switch (status) {
      case 'UNAUTHENTICATED':
        return new GoogleAdsAuthenticationError(message);

      case 'PERMISSION_DENIED':
        return new GoogleAdsPermissionError(message);

      case 'INVALID_ARGUMENT':
        const fieldErrors = this.extractFieldErrors(errorData);
        return new GoogleAdsValidationError(message, fieldErrors);

      case 'RESOURCE_EXHAUSTED':
        const isDaily = message.toLowerCase().includes('daily');
        return new GoogleAdsRateLimitError(message, undefined, isDaily);

      default:
        return new GoogleAdsAPIError(message, statusCode, status, requestId);
    }
  }

  /**
   * Extract field errors from error details
   */
  private extractFieldErrors(errorData: any): Array<{
    field: string;
    message: string;
    trigger?: string;
  }> {
    const fieldErrors: Array<{
      field: string;
      message: string;
      trigger?: string;
    }> = [];

    if (errorData.details) {
      errorData.details.forEach((detail: any) => {
        if (detail.errors) {
          detail.errors.forEach((err: any) => {
            const field =
              err.location?.fieldPathElements?.map((e: any) => e.fieldName).join('.') || 'unknown';

            fieldErrors.push({
              field,
              message: err.message,
              trigger: err.trigger?.stringValue,
            });
          });
        }
      });
    }

    return fieldErrors;
  }

  /**
   * Parse partial failure errors
   */
  private parsePartialFailures(error: GoogleAdsError): any[] {
    // Implementation would parse the partial failure error structure
    // For now, return empty array
    return [];
  }

  /**
   * Extract customer ID from resource name
   */
  private extractCustomerId(resourceName: string): string {
    const match = resourceName.match(/customers\/(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Get resource type from resource name
   */
  private getResourceType(resourceName: string): string {
    const parts = resourceName.split('/');
    if (parts.length >= 3) {
      return parts[2]; // e.g., "campaigns" from "customers/123/campaigns/456"
    }
    return '';
  }

  /**
   * Set up circuit breaker event listeners
   */
  private setupCircuitBreakerListeners(): void {
    this.circuitBreaker.onOpen(() => {
      console.error('Google Ads API circuit breaker opened - API unavailable');
    });

    this.circuitBreaker.onClose(() => {
      console.info('Google Ads API circuit breaker closed - API available');
    });

    this.circuitBreaker.onHalfOpen(() => {
      console.info('Google Ads API circuit breaker half-open - testing API');
    });
  }

  /**
   * Get rate limiter for external use
   */
  getRateLimiter(): GoogleAdsRateLimiter {
    return this.rateLimiter;
  }

  /**
   * Get accessible customers
   */
  async getAccessibleCustomers(): Promise<string[]> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.makeRequest('customers:listAccessibleCustomers', {
        method: 'GET',
      });

      return response.resourceNames || [];
    });
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
    const rateLimiterStats = this.rateLimiter.getUsageStats(this.config.developerToken);

    return {
      auth: Boolean(token),
      rateLimiter: rateLimiterStats,
      circuitBreaker: this.circuitBreaker.getMetrics(),
    };
  }
}
