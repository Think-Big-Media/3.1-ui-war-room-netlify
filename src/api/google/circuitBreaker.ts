// Circuit breaker pattern implementation for Google Ads API

import { CircuitBreakerOpenError } from './errors';
import { type CircuitBreakerState } from './types';

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms before attempting to close
  halfOpenRequests: number; // Number of requests to test in half-open state
  monitoringPeriod: number; // Time window for failure counting
  failureTypes?: string[]; // Specific error types to count as failures
}

export class GoogleAdsCircuitBreaker {
  private state: CircuitBreakerState = {
    status: 'CLOSED',
    failures: 0,
    lastFailureTime: undefined,
    nextRetryTime: undefined,
  };

  private successCount = 0;
  private failureTimestamps: number[] = [];
  private halfOpenTests = 0;
  private failureDetails: Map<string, number> = new Map();

  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    halfOpenRequests: 3,
    monitoringPeriod: 300000, // 5 minutes
    failureTypes: [
      'UNAVAILABLE', // Service unavailable
      'INTERNAL', // Internal server error
      'DEADLINE_EXCEEDED', // Timeout
      'RESOURCE_EXHAUSTED', // Rate limit (severe)
    ],
  };

  private stateChangeCallbacks: {
    onOpen: Array<() => void>;
    onClose: Array<() => void>;
    onHalfOpen: Array<() => void>;
  } = {
    onOpen: [],
    onClose: [],
    onHalfOpen: [],
  };

  constructor(config?: Partial<CircuitBreakerConfig>) {
    if (config) {
      Object.assign(this.config, config);
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state.status === 'OPEN') {
      if (Date.now() < this.state.nextRetryTime!) {
        throw new CircuitBreakerOpenError(this.state.nextRetryTime!);
      }
      // Transition to half-open
      this.transitionToHalfOpen();
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Register callbacks for state changes
   */
  onOpen(callback: () => void): void {
    this.stateChangeCallbacks.onOpen.push(callback);
  }

  onClose(callback: () => void): void {
    this.stateChangeCallbacks.onClose.push(callback);
  }

  onHalfOpen(callback: () => void): void {
    this.stateChangeCallbacks.onHalfOpen.push(callback);
  }

  /**
   * Force reset the circuit breaker
   */
  reset(): void {
    this.state = {
      status: 'CLOSED',
      failures: 0,
      lastFailureTime: undefined,
      nextRetryTime: undefined,
    };
    this.successCount = 0;
    this.failureTimestamps = [];
    this.halfOpenTests = 0;
    this.failureDetails.clear();
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): {
    state: string;
    failures: number;
    successRate: number;
    lastFailure?: Date;
    nextRetry?: Date;
    failureBreakdown: Record<string, number>;
  } {
    const total = this.successCount + this.state.failures;
    const successRate = total > 0 ? (this.successCount / total) * 100 : 100;

    const failureBreakdown: Record<string, number> = {};
    this.failureDetails.forEach((count, type) => {
      failureBreakdown[type] = count;
    });

    return {
      state: this.state.status,
      failures: this.state.failures,
      successRate: Math.round(successRate),
      lastFailure: this.state.lastFailureTime ? new Date(this.state.lastFailureTime) : undefined,
      nextRetry: this.state.nextRetryTime ? new Date(this.state.nextRetryTime) : undefined,
      failureBreakdown,
    };
  }

  private onSuccess(): void {
    this.successCount++;

    if (this.state.status === 'HALF_OPEN') {
      this.halfOpenTests++;

      if (this.halfOpenTests >= this.config.halfOpenRequests) {
        // Enough successful tests, close the circuit
        this.transitionToClosed();
      }
    } else if (this.state.status === 'CLOSED') {
      // Reset failure count on success in closed state
      this.state.failures = 0;
      this.cleanOldFailures();
    }
  }

  private onFailure(error: any): void {
    const now = Date.now();
    this.state.lastFailureTime = now;

    // Check if this error type should trigger circuit breaker
    const errorStatus = error.status || error.code || 'UNKNOWN';
    const shouldCount = !this.config.failureTypes || this.config.failureTypes.includes(errorStatus);

    if (!shouldCount) {
      // Don't count this failure (e.g., validation errors)
      return;
    }

    // Track failure type
    this.failureDetails.set(errorStatus, (this.failureDetails.get(errorStatus) || 0) + 1);

    this.failureTimestamps.push(now);

    if (this.state.status === 'HALF_OPEN') {
      // Failure in half-open state immediately opens the circuit
      this.transitionToOpen();
    } else if (this.state.status === 'CLOSED') {
      // Clean old failures outside monitoring period
      this.cleanOldFailures();

      // Count recent failures
      this.state.failures = this.failureTimestamps.length;

      if (this.state.failures >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  private transitionToOpen(): void {
    this.state.status = 'OPEN';
    this.state.nextRetryTime = Date.now() + this.config.resetTimeout;
    this.halfOpenTests = 0;

    console.warn('Google Ads API circuit breaker opened due to excessive failures');
    console.warn('Failure breakdown:', Object.fromEntries(this.failureDetails));

    // Notify listeners
    this.stateChangeCallbacks.onOpen.forEach((cb) => cb());
  }

  private transitionToHalfOpen(): void {
    this.state.status = 'HALF_OPEN';
    this.halfOpenTests = 0;

    console.info('Google Ads API circuit breaker transitioning to half-open');

    // Notify listeners
    this.stateChangeCallbacks.onHalfOpen.forEach((cb) => cb());
  }

  private transitionToClosed(): void {
    this.state.status = 'CLOSED';
    this.state.failures = 0;
    this.state.nextRetryTime = undefined;
    this.failureTimestamps = [];
    this.halfOpenTests = 0;
    this.failureDetails.clear();

    console.info('Google Ads API circuit breaker closed');

    // Notify listeners
    this.stateChangeCallbacks.onClose.forEach((cb) => cb());
  }

  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter((timestamp) => timestamp > cutoff);

    // Also clean up old failure details
    if (this.failureTimestamps.length === 0) {
      this.failureDetails.clear();
    }
  }
}
