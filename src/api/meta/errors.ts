// Custom error classes for Meta API integration

export class MetaAPIError extends Error {
  constructor(
    message: string,
    public code?: number,
    public subcode?: number,
    public fbtraceId?: string
  ) {
    super(message);
    this.name = 'MetaAPIError';
  }
}

export class MetaRateLimitError extends MetaAPIError {
  constructor(
    message: string,
    public estimatedTimeToRegainAccess?: number
  ) {
    super(message, 4, 2446079);
    this.name = 'MetaRateLimitError';
  }
}

export class MetaAuthenticationError extends MetaAPIError {
  constructor(message: string) {
    super(message, 190);
    this.name = 'MetaAuthenticationError';
  }
}

export class MetaPermissionError extends MetaAPIError {
  constructor(message: string) {
    super(message, 200);
    this.name = 'MetaPermissionError';
  }
}

export class MetaValidationError extends MetaAPIError {
  constructor(message: string) {
    super(message, 100);
    this.name = 'MetaValidationError';
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(public nextRetryTime: number) {
    super('Circuit breaker is OPEN. Service temporarily unavailable.');
    this.name = 'CircuitBreakerOpenError';
  }
}
