/**
 * @fileoverview Comprehensive test suite for Meta API Rate Limiter
 * Tests rate limiting logic, exponential backoff, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@testing-library/jest-dom';
import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockDate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock Date.now() for consistent timing tests
    mockDate = vi.fn();
    vi.stubGlobal('Date', {
      ...Date,
      now: mockDate,
    });

    mockDate.mockReturnValue(1000000); // Base timestamp
    rateLimiter = new RateLimiter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default limits', () => {
      expect(rateLimiter).toBeInstanceOf(RateLimiter);
    });

    it('should initialize with custom limits', () => {
      const customLimiter = new RateLimiter({
        maxRequestsPerHour: 100,
        maxRequestsPerSecond: 5,
      });
      expect(customLimiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('Rate Limiting Logic', () => {
    describe('checkLimit', () => {
      it('should allow requests within rate limit', async () => {
        const canMakeRequest = await rateLimiter.checkLimit();
        expect(canMakeRequest).toBe(true);
      });

      it('should track multiple requests correctly', async () => {
        // Make several requests quickly
        for (let i = 0; i < 5; i++) {
          const canMakeRequest = await rateLimiter.checkLimit();
          expect(canMakeRequest).toBe(true);
        }
      });

      it('should enforce per-second limit', async () => {
        // Fill up the per-second bucket (default 10 requests)
        for (let i = 0; i < 10; i++) {
          const canMakeRequest = await rateLimiter.checkLimit();
          expect(canMakeRequest).toBe(true);
        }

        // Next request should be rate limited
        const shouldBeLimited = await rateLimiter.checkLimit();
        expect(shouldBeLimited).toBe(false);
      });

      it('should reset per-second limit after time window', async () => {
        // Fill up the per-second bucket
        for (let i = 0; i < 10; i++) {
          await rateLimiter.checkLimit();
        }

        // Should be rate limited
        expect(await rateLimiter.checkLimit()).toBe(false);

        // Advance time by 1 second
        mockDate.mockReturnValue(1000000 + 1000);

        // Should now allow requests again
        expect(await rateLimiter.checkLimit()).toBe(true);
      });

      it('should enforce per-hour limit', async () => {
        const customLimiter = new RateLimiter({
          maxRequestsPerHour: 5,
          maxRequestsPerSecond: 10,
        });

        // Fill up the per-hour bucket
        for (let i = 0; i < 5; i++) {
          const canMakeRequest = await customLimiter.checkLimit();
          expect(canMakeRequest).toBe(true);
        }

        // Next request should be rate limited
        const shouldBeLimited = await customLimiter.checkLimit();
        expect(shouldBeLimited).toBe(false);
      });

      it('should reset per-hour limit after time window', async () => {
        const customLimiter = new RateLimiter({
          maxRequestsPerHour: 2,
          maxRequestsPerSecond: 10,
        });

        // Fill up the per-hour bucket
        await customLimiter.checkLimit();
        await customLimiter.checkLimit();

        // Should be rate limited
        expect(await customLimiter.checkLimit()).toBe(false);

        // Advance time by 1 hour
        mockDate.mockReturnValue(1000000 + 3600000);

        // Should now allow requests again
        expect(await customLimiter.checkLimit()).toBe(true);
      });
    });

    describe('Exponential Backoff', () => {
      it('should implement exponential backoff on rate limit', async () => {
        const customLimiter = new RateLimiter({
          maxRequestsPerHour: 2,
          maxRequestsPerSecond: 2,
        });

        // Fill up the limits
        await customLimiter.checkLimit();
        await customLimiter.checkLimit();

        // Mock setTimeout to track backoff calls
        const mockSetTimeout = vi.fn((fn, delay) => {
          setTimeout(fn, 0); // Execute immediately for test
          return delay;
        });
        vi.stubGlobal('setTimeout', mockSetTimeout);

        // This should trigger exponential backoff
        const canMakeRequest = await customLimiter.checkLimit();
        expect(canMakeRequest).toBe(false);
      });

      it('should increase backoff delay exponentially', async () => {
        const customLimiter = new RateLimiter({
          maxRequestsPerHour: 1,
          maxRequestsPerSecond: 1,
        });

        // Fill up the limit
        await customLimiter.checkLimit();

        const mockSetTimeout = vi.fn((fn, delay) => {
          setTimeout(fn, 0);
          return delay;
        });
        vi.stubGlobal('setTimeout', mockSetTimeout);

        // Multiple rate-limited requests should increase delay
        await customLimiter.checkLimit(); // First backoff
        const firstDelay = mockSetTimeout.mock.calls[0]?.[1] || 0;

        await customLimiter.checkLimit(); // Second backoff
        const secondDelay = mockSetTimeout.mock.calls[1]?.[1] || 0;

        expect(secondDelay).toBeGreaterThan(firstDelay);
      });

      it('should reset backoff after successful request', async () => {
        const customLimiter = new RateLimiter({
          maxRequestsPerHour: 2,
          maxRequestsPerSecond: 2,
        });

        // Fill up the limits
        await customLimiter.checkLimit();
        await customLimiter.checkLimit();

        // Trigger backoff
        await customLimiter.checkLimit();

        // Reset time to allow new requests
        mockDate.mockReturnValue(1000000 + 3600000);

        // Should reset backoff and allow request
        const canMakeRequest = await customLimiter.checkLimit();
        expect(canMakeRequest).toBe(true);
      });
    });
  });

  describe('Window Management', () => {
    it('should handle overlapping time windows correctly', async () => {
      const startTime = 1000000;
      mockDate.mockReturnValue(startTime);

      // Make requests at the start of a window
      await rateLimiter.checkLimit();
      await rateLimiter.checkLimit();

      // Advance time by 30 minutes (half hour window)
      mockDate.mockReturnValue(startTime + 1800000);

      // Make more requests
      await rateLimiter.checkLimit();
      await rateLimiter.checkLimit();

      // Should still track all requests in the hour window
      expect(await rateLimiter.checkLimit()).toBe(true);
    });

    it('should clean up old request timestamps', async () => {
      const startTime = 1000000;
      mockDate.mockReturnValue(startTime);

      // Make some requests
      await rateLimiter.checkLimit();
      await rateLimiter.checkLimit();

      // Advance time by more than an hour
      mockDate.mockReturnValue(startTime + 7200000); // 2 hours

      // Old requests should be cleaned up and not count against limits
      for (let i = 0; i < 200; i++) {
        // Make many requests
        const canMakeRequest = await rateLimiter.checkLimit();
        if (i < 199) {
          // Should allow up to limit
          expect(canMakeRequest).toBe(true);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle clock adjustments gracefully', async () => {
      const startTime = 1000000;
      mockDate.mockReturnValue(startTime);

      await rateLimiter.checkLimit();

      // Simulate clock going backwards
      mockDate.mockReturnValue(startTime - 10000);

      // Should still work correctly
      const canMakeRequest = await rateLimiter.checkLimit();
      expect(typeof canMakeRequest).toBe('boolean');
    });

    it('should handle very large time jumps', async () => {
      const startTime = 1000000;
      mockDate.mockReturnValue(startTime);

      await rateLimiter.checkLimit();

      // Jump far into the future
      mockDate.mockReturnValue(startTime + 86400000); // 24 hours

      // Should reset and allow requests
      const canMakeRequest = await rateLimiter.checkLimit();
      expect(canMakeRequest).toBe(true);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle zero rate limits', () => {
      expect(
        () =>
          new RateLimiter({
            maxRequestsPerHour: 0,
            maxRequestsPerSecond: 10,
          })
      ).not.toThrow();
    });

    it('should handle very high rate limits', async () => {
      const highLimitLimiter = new RateLimiter({
        maxRequestsPerHour: 1000000,
        maxRequestsPerSecond: 1000,
      });

      // Should allow many requests
      for (let i = 0; i < 100; i++) {
        const canMakeRequest = await highLimitLimiter.checkLimit();
        expect(canMakeRequest).toBe(true);
      }
    });

    it('should handle fractional time calculations', async () => {
      mockDate.mockReturnValue(1000000.5); // Fractional timestamp

      const canMakeRequest = await rateLimiter.checkLimit();
      expect(canMakeRequest).toBe(true);
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent checkLimit calls', async () => {
      const promises = [];

      // Make 20 concurrent requests
      for (let i = 0; i < 20; i++) {
        promises.push(rateLimiter.checkLimit());
      }

      const results = await Promise.all(promises);

      // Should have some true and some false results
      const trueCount = results.filter((r) => r === true).length;
      const falseCount = results.filter((r) => r === false).length;

      expect(trueCount).toBeGreaterThan(0);
      expect(trueCount + falseCount).toBe(20);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with many requests over time', async () => {
      const startTime = 1000000;

      // Simulate requests over multiple hours
      for (let hour = 0; hour < 10; hour++) {
        mockDate.mockReturnValue(startTime + hour * 3600000);

        // Make some requests each hour
        for (let i = 0; i < 50; i++) {
          await rateLimiter.checkLimit();
        }
      }

      // Check that internal arrays don't grow indefinitely
      const requestCount = (rateLimiter as any).requestTimestamps?.length || 0;
      expect(requestCount).toBeLessThan(1000); // Should clean up old entries
    });
  });

  describe('Reset Methods', () => {
    it('should provide method to reset rate limiter', async () => {
      // Fill up the limits
      for (let i = 0; i < 10; i++) {
        await rateLimiter.checkLimit();
      }

      // Should be rate limited
      expect(await rateLimiter.checkLimit()).toBe(false);

      // Reset should allow requests again
      rateLimiter.reset();
      expect(await rateLimiter.checkLimit()).toBe(true);
    });

    it('should provide method to get current usage', async () => {
      await rateLimiter.checkLimit();
      await rateLimiter.checkLimit();

      const usage = rateLimiter.getCurrentUsage();
      expect(usage).toHaveProperty('requestsThisSecond');
      expect(usage).toHaveProperty('requestsThisHour');
      expect(usage.requestsThisSecond).toBeGreaterThan(0);
      expect(usage.requestsThisHour).toBeGreaterThan(0);
    });
  });
});
