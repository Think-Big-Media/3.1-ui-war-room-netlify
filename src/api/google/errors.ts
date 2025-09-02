// Custom error classes for Google Ads API integration

export class GoogleAdsAPIError extends Error {
  constructor(
    message: string,
    public code?: number,
    public status?: string,
    public requestId?: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'GoogleAdsAPIError';
  }
}

export class GoogleAdsRateLimitError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public retryAfterSeconds?: number,
    public dailyLimitExceeded?: boolean
  ) {
    super(message, 429, 'RESOURCE_EXHAUSTED');
    this.name = 'GoogleAdsRateLimitError';
  }
}

export class GoogleAdsAuthenticationError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public authError?: string
  ) {
    super(message, 401, 'UNAUTHENTICATED');
    this.name = 'GoogleAdsAuthenticationError';
  }
}

export class GoogleAdsPermissionError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public missingScope?: string
  ) {
    super(message, 403, 'PERMISSION_DENIED');
    this.name = 'GoogleAdsPermissionError';
  }
}

export class GoogleAdsValidationError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public fieldErrors?: Array<{
      field: string;
      message: string;
      trigger?: string;
    }>
  ) {
    super(message, 400, 'INVALID_ARGUMENT');
    this.name = 'GoogleAdsValidationError';
  }
}

export class GoogleAdsQuotaError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public quotaType: 'DAILY_OPERATIONS' | 'REQUEST_SIZE' | 'MUTATE_OPERATIONS',
    public limit?: number,
    public current?: number
  ) {
    super(message, 429, 'RESOURCE_EXHAUSTED');
    this.name = 'GoogleAdsQuotaError';
  }
}

export class GoogleAdsNetworkError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message, 503, 'UNAVAILABLE');
    this.name = 'GoogleAdsNetworkError';
  }
}

export class GoogleAdsTimeoutError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public timeoutMs: number
  ) {
    super(message, 504, 'DEADLINE_EXCEEDED');
    this.name = 'GoogleAdsTimeoutError';
  }
}

export class GoogleAdsPartialFailureError extends GoogleAdsAPIError {
  constructor(
    message: string,
    public successCount: number,
    public failureCount: number,
    public failures: any[]
  ) {
    super(message, 200, 'PARTIAL_FAILURE');
    this.name = 'GoogleAdsPartialFailureError';
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(public nextRetryTime: number) {
    super('Circuit breaker is OPEN. Google Ads API temporarily unavailable.');
    this.name = 'CircuitBreakerOpenError';
  }
}
