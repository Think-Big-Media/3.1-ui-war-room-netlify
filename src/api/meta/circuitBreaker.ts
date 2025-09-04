// Circuit breaker pattern implementation for Meta API

import { CircuitBreakerOpenError } from './errors';
import { type CircuitBreakerState } from './types';

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms before attempting to close
  halfOpenRequests: number; // Number of requests to test in half-open state
  monitoringPeriod: number; // Time window for failure counting
}

export class MetaCircuitBreaker {
  private state: CircuitBreakerState = {
    status: 'CLOSED',
    failures: 0,
    lastFailureTime: undefined,
    nextRetryTime: undefined,
  };

  private successCount = 0;
  private failureTimestamps: number[] = [];
  private halfOpenTests = 0;

  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    halfOpenRequests: 3,
    monitoringPeriod: 300000, // 5 minutes
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
      this.onFailure();
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
  } {
    const total = this.successCount + this.state.failures;
    const successRate = total > 0 ? (this.successCount / total) * 100 : 100;

    return {
      state: this.state.status,
      failures: this.state.failures,
      successRate: Math.round(successRate),
      lastFailure: this.state.lastFailureTime ? new Date(this.state.lastFailureTime) : undefined,
      nextRetry: this.state.nextRetryTime ? new Date(this.state.nextRetryTime) : undefined,
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

  private onFailure(): void {
    const now = Date.now();
    this.state.lastFailureTime = now;
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

    console.warn('Circuit breaker opened due to excessive failures');

    // Notify listeners
    this.stateChangeCallbacks.onOpen.forEach((cb) => cb());
  }

  private transitionToHalfOpen(): void {
    this.state.status = 'HALF_OPEN';
    this.halfOpenTests = 0;

    console.info('Circuit breaker transitioning to half-open');

    // Notify listeners
    this.stateChangeCallbacks.onHalfOpen.forEach((cb) => cb());
  }

  private transitionToClosed(): void {
    this.state.status = 'CLOSED';
    this.state.failures = 0;
    this.state.nextRetryTime = undefined;
    this.failureTimestamps = [];
    this.halfOpenTests = 0;

    console.info('Circuit breaker closed');

    // Notify listeners
    this.stateChangeCallbacks.onClose.forEach((cb) => cb());
  }

  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter((timestamp) => timestamp > cutoff);
  }
}

// Export alias for compatibility
export { MetaCircuitBreaker as CircuitBreaker };
