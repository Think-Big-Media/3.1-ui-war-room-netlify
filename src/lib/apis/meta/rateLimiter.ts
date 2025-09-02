/**
 * Rate Limiter for Meta Business API
 * Implements exponential backoff and request throttling
 */

import { type MetaApiError, type RateLimitInfo } from './types';

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  retryAfter?: number;
  backoffMultiplier: number;
}

export class RateLimiter {
  private state: RateLimitState = {
    requestCount: 0,
    windowStart: Date.now(),
    backoffMultiplier: 1,
  };

  private readonly maxRequestsPerHour = 200;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour
  private readonly maxBackoffMs = 60 * 1000; // 1 minute max

  /**
   * Check if request can proceed
   */
  canMakeRequest(): boolean {
    this.resetWindowIfNeeded();

    // Check if we're in backoff period
    if (this.state.retryAfter && Date.now() < this.state.retryAfter) {
      return false;
    }

    // Check rate limit
    return this.state.requestCount < this.maxRequestsPerHour;
  }

  /**
   * Wait for rate limit if needed
   */
  async waitForRateLimit(): Promise<void> {
    if (this.canMakeRequest()) {
      return;
    }

    const waitTime = this.getWaitTime();
    console.log(`Rate limit reached. Waiting ${waitTime}ms before retry...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Reset window if needed after wait
    this.resetWindowIfNeeded();
  }

  /**
   * Record successful request
   */
  recordSuccess(headers?: Record<string, any>): void {
    this.state.requestCount++;
    this.state.backoffMultiplier = 1; // Reset backoff on success

    // Parse rate limit headers if available
    if (headers?.['x-business-use-case-usage']) {
      this.parseBusinessUsage(headers['x-business-use-case-usage']);
    }
  }

  /**
   * Handle rate limit error
   */
  handleRateLimitError(error: MetaApiError): void {
    const retryAfter = this.extractRetryAfter(error);

    if (retryAfter) {
      this.state.retryAfter = Date.now() + retryAfter * 1000;
    } else {
      // Exponential backoff
      const backoffMs = Math.min(1000 * this.state.backoffMultiplier, this.maxBackoffMs);
      this.state.retryAfter = Date.now() + backoffMs;
      this.state.backoffMultiplier *= 2;
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    requestsRemaining: number;
    resetTime: Date;
    inBackoff: boolean;
  } {
    this.resetWindowIfNeeded();

    return {
      requestsRemaining: Math.max(0, this.maxRequestsPerHour - this.state.requestCount),
      resetTime: new Date(this.state.windowStart + this.windowMs),
      inBackoff: Boolean(this.state.retryAfter && Date.now() < this.state.retryAfter),
    };
  }

  private resetWindowIfNeeded(): void {
    const now = Date.now();
    if (now - this.state.windowStart >= this.windowMs) {
      this.state.requestCount = 0;
      this.state.windowStart = now;
      this.state.retryAfter = undefined;
    }
  }

  private getWaitTime(): number {
    if (this.state.retryAfter) {
      return Math.max(0, this.state.retryAfter - Date.now());
    }

    // If window is full, wait until reset
    const windowEnd = this.state.windowStart + this.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }

  private extractRetryAfter(error: MetaApiError): number | null {
    // Meta doesn't always provide Retry-After header
    // Check error message for rate limit info
    const match = error.error.message.match(/try again in (\d+) seconds/i);
    return match ? parseInt(match[1], 10) : null;
  }

  private parseBusinessUsage(usage: Record<string, RateLimitInfo[]>): void {
    // Parse business use case usage for more accurate rate limiting
    for (const [businessId, limits] of Object.entries(usage)) {
      for (const limit of limits) {
        if (limit.type === 'ads_insights') {
          // Adjust our rate limit based on actual usage
          console.log(`Business ${businessId} usage: ${limit.callCount} calls`);
        }
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
