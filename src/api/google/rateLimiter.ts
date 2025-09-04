// Rate limiter implementation for Google Ads API

import { GoogleAdsRateLimitError, GoogleAdsQuotaError } from './errors';
import { type RateLimitInfo } from './types';

interface RateLimitBucket {
  operations: number;
  lastReset: Date;
  dailyLimit: number;
  requestTimestamps: number[];
}

interface AccessLevelLimits {
  TEST: number;
  BASIC: number;
  STANDARD: number;
  ADVANCED: number;
}

export class GoogleAdsRateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();

  // Google Ads API daily operation limits by access level
  private readonly accessLevelLimits: AccessLevelLimits = {
    TEST: 15_000, // Test account access
    BASIC: 15_000, // Basic access
    STANDARD: 1_000_000, // Standard access
    ADVANCED: 10_000_000, // Advanced access (effectively unlimited)
  };

  // Request-level limits
  private readonly requestLimits = {
    maxOperationsPerMutate: 5000, // Max operations in single mutate request
    maxRequestSizeMB: 64, // Max gRPC message size
    requestsPerSecond: 100, // Approximate RPS limit
    burstSize: 1000, // Burst capacity
  };

  constructor(
    private accessLevel: keyof AccessLevelLimits = 'BASIC',
    private customLimits?: Partial<AccessLevelLimits>
  ) {
    if (customLimits) {
      Object.assign(this.accessLevelLimits, customLimits);
    }
  }

  /**
   * Check if operation can proceed based on rate limits
   */
  async checkLimit(developerToken: string, operationCount = 1): Promise<boolean> {
    const bucket = this.getBucket(developerToken);
    const now = Date.now();

    // Reset daily counter if needed
    this.resetDailyCounterIfNeeded(bucket);

    // Check daily limit
    if (bucket.operations + operationCount > bucket.dailyLimit) {
      const resetTime = new Date(bucket.lastReset);
      resetTime.setDate(resetTime.getDate() + 1);

      throw new GoogleAdsQuotaError(
        `Daily operations limit exceeded. Limit: ${bucket.dailyLimit}, Current: ${bucket.operations}`,
        'DAILY_OPERATIONS',
        bucket.dailyLimit,
        bucket.operations
      );
    }

    // Check request rate (simplified token bucket)
    this.cleanOldTimestamps(bucket, now);

    if (bucket.requestTimestamps.length >= this.requestLimits.burstSize) {
      const oldestRequest = bucket.requestTimestamps[0];
      const timeWindow = now - oldestRequest;
      const currentRate = bucket.requestTimestamps.length / (timeWindow / 1000);

      if (currentRate > this.requestLimits.requestsPerSecond) {
        const waitTime =
          Math.ceil(
            (bucket.requestTimestamps.length / this.requestLimits.requestsPerSecond) * 1000
          ) - timeWindow;

        throw new GoogleAdsRateLimitError(
          `Request rate limit exceeded. Please wait ${waitTime}ms`,
          Math.ceil(waitTime / 1000)
        );
      }
    }

    // Check operation count per request
    if (operationCount > this.requestLimits.maxOperationsPerMutate) {
      throw new GoogleAdsQuotaError(
        `Too many operations in single request. Max: ${this.requestLimits.maxOperationsPerMutate}`,
        'MUTATE_OPERATIONS',
        this.requestLimits.maxOperationsPerMutate,
        operationCount
      );
    }

    // Record the operation
    bucket.operations += operationCount;
    bucket.requestTimestamps.push(now);

    return true;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(developerToken: string): RateLimitInfo {
    const bucket = this.getBucket(developerToken);
    this.resetDailyCounterIfNeeded(bucket);

    const resetTime = new Date(bucket.lastReset);
    resetTime.setDate(resetTime.getDate() + 1);

    return {
      dailyOperations: bucket.operations,
      remainingOperations: bucket.dailyLimit - bucket.operations,
      resetTime,
      accessLevel: this.accessLevel,
    };
  }

  /**
   * Update rate limits based on API response headers
   */
  updateFromResponse(headers: Headers, developerToken: string): void {
    // Google Ads API doesn't return rate limit info in headers like Meta
    // but we can check for rate limit errors in the response
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      console.warn(`Rate limit hit. Retry after: ${retryAfter} seconds`);
    }
  }

  /**
   * Reset rate limits for a token
   */
  reset(developerToken: string): void {
    this.buckets.delete(developerToken);
  }

  /**
   * Set access level for rate limiting
   */
  setAccessLevel(level: keyof AccessLevelLimits): void {
    this.accessLevel = level;
    // Update existing buckets with new limit
    this.buckets.forEach((bucket) => {
      bucket.dailyLimit = this.accessLevelLimits[level];
    });
  }

  /**
   * Calculate exponential backoff for retries
   */
  calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 64000; // 64 seconds
    const jitter = Math.random() * 1000; // 0-1 second jitter

    const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);

    return Math.floor(delay);
  }

  /**
   * Check if request size is within limits
   */
  checkRequestSize(sizeBytes: number): void {
    const maxSizeBytes = this.requestLimits.maxRequestSizeMB * 1024 * 1024;

    if (sizeBytes > maxSizeBytes) {
      throw new GoogleAdsQuotaError(
        `Request size exceeds limit. Max: ${this.requestLimits.maxRequestSizeMB}MB`,
        'REQUEST_SIZE',
        maxSizeBytes,
        sizeBytes
      );
    }
  }

  private getBucket(token: string): RateLimitBucket {
    if (!this.buckets.has(token)) {
      this.buckets.set(token, {
        operations: 0,
        lastReset: new Date(),
        dailyLimit: this.accessLevelLimits[this.accessLevel],
        requestTimestamps: [],
      });
    }
    return this.buckets.get(token)!;
  }

  private resetDailyCounterIfNeeded(bucket: RateLimitBucket): void {
    const now = new Date();
    const lastReset = new Date(bucket.lastReset);

    // Reset if it's a new day (UTC)
    if (
      now.getUTCDate() !== lastReset.getUTCDate() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCFullYear() !== lastReset.getUTCFullYear()
    ) {
      bucket.operations = 0;
      bucket.lastReset = now;
      bucket.requestTimestamps = [];
    }
  }

  private cleanOldTimestamps(bucket: RateLimitBucket, now: number): void {
    // Keep only timestamps from last 60 seconds
    const cutoff = now - 60000;
    bucket.requestTimestamps = bucket.requestTimestamps.filter((timestamp) => timestamp > cutoff);
  }
}
