// Rate limiter implementation for Meta API

import { MetaRateLimitError } from './errors';

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  requests: number[];
}

export class MetaRateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();

  // Meta API limits (conservative defaults)
  private readonly limits = {
    user: { tokens: 200, window: 3600000 }, // 200 calls per hour
    app: { tokens: 200, window: 3600000 }, // 200 calls per hour
    adAccount: { percentage: 0.1 }, // 10% of daily limit
  };

  constructor(private customLimits?: Partial<typeof MetaRateLimiter.prototype.limits>) {
    if (customLimits) {
      Object.assign(this.limits, customLimits);
    }
  }

  /**
   * Check if request can proceed based on rate limits
   */
  async checkLimit(bucketKey: string, weight = 1): Promise<boolean> {
    const bucket = this.getBucket(bucketKey);
    const now = Date.now();

    // Refill tokens based on time passed
    this.refillTokens(bucket, now);

    // Check sliding window for request count
    this.cleanOldRequests(bucket, now);

    // Check if we have enough tokens
    if (bucket.tokens < weight) {
      const timeToWait = this.calculateTimeToWait(bucket);
      throw new MetaRateLimitError(
        `Rate limit exceeded. Please wait ${Math.ceil(timeToWait / 1000)} seconds.`,
        timeToWait
      );
    }

    // Consume tokens
    bucket.tokens -= weight;
    bucket.requests.push(now);

    return true;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(bucketKey: string): {
    tokensRemaining: number;
    requestsInWindow: number;
    percentageUsed: number;
  } {
    const bucket = this.getBucket(bucketKey);
    const now = Date.now();

    this.refillTokens(bucket, now);
    this.cleanOldRequests(bucket, now);

    const limit = this.limits.user;
    const percentageUsed = ((limit.tokens - bucket.tokens) / limit.tokens) * 100;

    return {
      tokensRemaining: bucket.tokens,
      requestsInWindow: bucket.requests.length,
      percentageUsed: Math.round(percentageUsed),
    };
  }

  /**
   * Reset rate limit for a specific bucket
   */
  reset(bucketKey: string): void {
    this.buckets.delete(bucketKey);
  }

  /**
   * Parse rate limit headers from Meta API response
   */
  updateFromHeaders(headers: Headers, bucketKey: string): void {
    const callCount = headers.get('x-business-use-case-usage');
    if (callCount) {
      try {
        const usage = JSON.parse(callCount);
        // Update bucket based on actual API usage
        const bucket = this.getBucket(bucketKey);

        // Meta returns percentage-based limits
        if (usage.call_count) {
          const percentageUsed = usage.call_count / 100;
          const tokensUsed = Math.floor(this.limits.user.tokens * percentageUsed);
          bucket.tokens = this.limits.user.tokens - tokensUsed;
        }
      } catch (error) {
        console.error('Failed to parse rate limit headers:', error);
      }
    }
  }

  private getBucket(key: string): RateLimitBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.limits.user.tokens,
        lastRefill: Date.now(),
        requests: [],
      });
    }
    return this.buckets.get(key)!;
  }

  private refillTokens(bucket: RateLimitBucket, now: number): void {
    const timePassed = now - bucket.lastRefill;
    const limit = this.limits.user;

    // Calculate tokens to add based on time passed
    const tokensToAdd = Math.floor((timePassed / limit.window) * limit.tokens);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, limit.tokens);
      bucket.lastRefill = now;
    }
  }

  private cleanOldRequests(bucket: RateLimitBucket, now: number): void {
    const windowStart = now - this.limits.user.window;
    bucket.requests = bucket.requests.filter((time) => time > windowStart);
  }

  private calculateTimeToWait(bucket: RateLimitBucket): number {
    const limit = this.limits.user;
    const tokensNeeded = 1;
    const tokensPerMs = limit.tokens / limit.window;
    const msToWait = tokensNeeded / tokensPerMs;

    return Math.ceil(msToWait);
  }

  /**
   * Implement exponential backoff for retries
   */
  calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 32000; // 32 seconds
    const jitter = Math.random() * 1000; // 0-1 second jitter

    const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);

    return Math.floor(delay);
  }

  /**
   * Track usage for analytics (no-op for now)
   */
  async trackUsage(bucketKey: string): Promise<void> {
    // This is a placeholder for usage tracking
    // In a production system, this would send metrics to analytics
    console.debug(`API usage tracked for: ${bucketKey}`);
  }
}

// Export alias for compatibility
export { MetaRateLimiter as RateLimiter };
