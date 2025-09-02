/**
 * Caching layer for Meta API responses
 * In-memory cache with TTL support
 */

import { type CacheConfig } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class MetaApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      namespace: 'meta-api',
      ...config,
    };
  }

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const fullKey = this.getFullKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const fullKey = this.getFullKey(key);

    // Enforce max size
    if (this.cache.size >= this.config.maxSize) {
      // Remove oldest entry
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(fullKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    const fullKey = this.getFullKey(key);
    this.cache.delete(fullKey);
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }

  /**
   * Generate cache key for insights
   */
  static generateInsightKey(accountId: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join('|');

    return `insights:${accountId}:${sortedParams}`;
  }

  private getFullKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

// Singleton instance
export const metaCache = new MetaApiCache();
