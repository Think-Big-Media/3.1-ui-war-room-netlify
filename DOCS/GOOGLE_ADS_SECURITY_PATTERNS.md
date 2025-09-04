# Google Ads API Security Patterns Guide

## Overview

This document provides comprehensive security patterns for Google Ads API integration, serving as a reference for developers and security reviews. These patterns ensure secure, reliable, and compliant integration with Google Ads API services.

## Table of Contents

1. [Secure Configuration Management](#secure-configuration-management)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Protection](#data-protection)
5. [Security Testing Patterns](#security-testing-patterns)
6. [Production Security Checklist](#production-security-checklist)
7. [Implementation Examples](#implementation-examples)

---

## 1. Secure Configuration Management

### Environment Variable Usage Patterns

#### Required Environment Variables
```typescript
interface GoogleAdsSecureConfig {
  // OAuth2 Credentials
  GOOGLE_ADS_CLIENT_ID: string;          // OAuth2 client ID
  GOOGLE_ADS_CLIENT_SECRET: string;      // OAuth2 client secret (encrypted)
  GOOGLE_ADS_DEVELOPER_TOKEN: string;    // Developer token (encrypted)
  
  // Optional Configuration
  GOOGLE_ADS_REDIRECT_URI?: string;      // OAuth2 redirect URI
  GOOGLE_ADS_LOGIN_CUSTOMER_ID?: string; // Manager account ID
  GOOGLE_ADS_API_VERSION?: string;       // API version (default: v17)
  
  // Rate Limiting
  GOOGLE_ADS_RATE_LIMIT_OPERATIONS?: string;  // Operations per minute
  GOOGLE_ADS_RATE_LIMIT_REQUEST_SIZE?: string; // Max request size MB
}
```

#### Configuration Validation
```typescript
export function validateGoogleAdsConfig(): GoogleAdsSecureConfig {
  const requiredVars = [
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN'
  ];
  
  const missing = requiredVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new GoogleAdsValidationError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
  
  // Validate format
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID!;
  if (!/^\d+-.+\.apps\.googleusercontent\.com$/.test(clientId)) {
    throw new GoogleAdsValidationError('Invalid client ID format');
  }
  
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
  if (!/^[A-Za-z0-9_-]{22}$/.test(developerToken)) {
    throw new GoogleAdsValidationError('Invalid developer token format');
  }
  
  return {
    GOOGLE_ADS_CLIENT_ID: clientId,
    GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    GOOGLE_ADS_DEVELOPER_TOKEN: developerToken,
    GOOGLE_ADS_REDIRECT_URI: process.env.GOOGLE_ADS_REDIRECT_URI || 
      'http://localhost:3000/auth/google/callback',
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    GOOGLE_ADS_API_VERSION: process.env.GOOGLE_ADS_API_VERSION || 'v17'
  };
}
```

#### Service Account Credential Handling
```typescript
export class GoogleAdsServiceAccountManager {
  private serviceAccountKey: any;
  private keyRotationSchedule: Date;
  
  constructor(encryptedKeyPath: string) {
    this.loadAndValidateServiceAccount(encryptedKeyPath);
    this.scheduleKeyRotation();
  }
  
  private loadAndValidateServiceAccount(encryptedKeyPath: string): void {
    try {
      // Decrypt service account key
      const decryptedKey = this.decryptServiceAccountKey(encryptedKeyPath);
      
      // Validate key structure
      this.validateServiceAccountKey(decryptedKey);
      
      this.serviceAccountKey = decryptedKey;
    } catch (error) {
      throw new GoogleAdsAuthenticationError(
        `Service account validation failed: ${error.message}`
      );
    }
  }
  
  private validateServiceAccountKey(key: any): void {
    const requiredFields = [
      'type', 'project_id', 'private_key_id', 
      'private_key', 'client_email', 'client_id'
    ];
    
    const missing = requiredFields.filter(field => !key[field]);
    if (missing.length > 0) {
      throw new Error(`Missing service account fields: ${missing.join(', ')}`);
    }
    
    if (key.type !== 'service_account') {
      throw new Error('Invalid service account type');
    }
  }
  
  private scheduleKeyRotation(): void {
    // Schedule automatic key rotation every 90 days
    this.keyRotationSchedule = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000));
  }
}
```

---

## 2. Input Validation & Sanitization

### GAQL Injection Prevention

#### Query Parameter Sanitization
```typescript
export class GAQLSecurityValidator {
  private static readonly ALLOWED_OPERATORS = [
    '=', '!=', '<', '>', '<=', '>=', 'LIKE', 'NOT LIKE',
    'IN', 'NOT IN', 'BETWEEN', 'NOT BETWEEN',
    'IS NULL', 'IS NOT NULL'
  ];
  
  private static readonly DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER',
    'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE'
  ];
  
  static sanitizeGAQLQuery(query: string): string {
    // Remove dangerous keywords
    let sanitized = query;
    this.DANGEROUS_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(sanitized)) {
        throw new GoogleAdsValidationError(
          `Dangerous keyword '${keyword}' detected in query`
        );
      }
    });
    
    // Validate query structure
    this.validateQueryStructure(sanitized);
    
    // Escape special characters
    sanitized = this.escapeSpecialCharacters(sanitized);
    
    return sanitized;
  }
  
  private static validateQueryStructure(query: string): void {
    // Must start with SELECT
    if (!/^\s*SELECT\s+/i.test(query)) {
      throw new GoogleAdsValidationError('Query must start with SELECT');
    }
    
    // Must have FROM clause
    if (!/\bFROM\s+\w+/i.test(query)) {
      throw new GoogleAdsValidationError('Query must include FROM clause');
    }
    
    // Check for balanced quotes
    const singleQuotes = (query.match(/'/g) || []).length;
    const doubleQuotes = (query.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      throw new GoogleAdsValidationError('Unbalanced quotes in query');
    }
  }
  
  private static escapeSpecialCharacters(query: string): string {
    return query
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/'/g, "\\'")    // Escape single quotes
      .replace(/"/g, '\\"');   // Escape double quotes
  }
}
```

#### Customer ID Validation
```typescript
export class CustomerIdValidator {
  private static readonly CUSTOMER_ID_PATTERN = /^\d{10}$/;
  private static readonly MAX_CUSTOMER_IDS = 20; // Batch limit
  
  static validateCustomerId(customerId: string): string {
    if (!customerId) {
      throw new GoogleAdsValidationError('Customer ID is required');
    }
    
    // Remove any formatting (hyphens, spaces)
    const cleaned = customerId.replace(/[-\s]/g, '');
    
    // Validate format
    if (!this.CUSTOMER_ID_PATTERN.test(cleaned)) {
      throw new GoogleAdsValidationError(
        'Customer ID must be 10 digits'
      );
    }
    
    return cleaned;
  }
  
  static validateCustomerIdBatch(customerIds: string[]): string[] {
    if (!Array.isArray(customerIds)) {
      throw new GoogleAdsValidationError('Customer IDs must be an array');
    }
    
    if (customerIds.length === 0) {
      throw new GoogleAdsValidationError('At least one customer ID required');
    }
    
    if (customerIds.length > this.MAX_CUSTOMER_IDS) {
      throw new GoogleAdsValidationError(
        `Maximum ${this.MAX_CUSTOMER_IDS} customer IDs allowed per request`
      );
    }
    
    return customerIds.map(id => this.validateCustomerId(id));
  }
}
```

#### Date Range Validation
```typescript
export class DateRangeValidator {
  private static readonly MAX_DATE_RANGE_DAYS = 1095; // 3 years
  private static readonly MIN_DATE = new Date('2000-01-01');
  private static readonly MAX_FUTURE_DAYS = 1; // Allow 1 day in future
  
  static validateDateRange(startDate: string, endDate: string): {
    startDate: string;
    endDate: string;
  } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Validate date formats
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new GoogleAdsValidationError('Invalid date format (use YYYY-MM-DD)');
    }
    
    // Validate date range
    if (start > end) {
      throw new GoogleAdsValidationError('Start date must be before end date');
    }
    
    // Validate against minimum date
    if (start < this.MIN_DATE) {
      throw new GoogleAdsValidationError(
        `Start date cannot be before ${this.MIN_DATE.toISOString().split('T')[0]}`
      );
    }
    
    // Validate against future dates
    const maxFutureDate = new Date(now.getTime() + (this.MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000));
    if (end > maxFutureDate) {
      throw new GoogleAdsValidationError('End date cannot be more than 1 day in the future');
    }
    
    // Validate range length
    const rangeDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (rangeDays > this.MAX_DATE_RANGE_DAYS) {
      throw new GoogleAdsValidationError(
        `Date range cannot exceed ${this.MAX_DATE_RANGE_DAYS} days`
      );
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }
}
```

---

## 3. Authentication & Authorization

### OAuth2 + JWT Security Enhancements

#### Secure Token Management
```typescript
export class SecureTokenManager {
  private tokenCache: Map<string, EncryptedToken> = new Map();
  private readonly encryptionKey: string;
  
  constructor() {
    this.encryptionKey = this.deriveEncryptionKey();
  }
  
  async storeToken(userId: string, token: GoogleOAuthToken): Promise<void> {
    // Encrypt sensitive token data
    const encryptedToken: EncryptedToken = {
      accessToken: this.encrypt(token.access_token),
      refreshToken: token.refresh_token ? this.encrypt(token.refresh_token) : undefined,
      expiresAt: token.expires_at,
      tokenType: token.token_type,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };
    
    // Store with TTL
    this.tokenCache.set(userId, encryptedToken);
    
    // Schedule cleanup
    this.scheduleTokenCleanup(userId, token.expires_at || Date.now() + 3600000);
  }
  
  async getValidToken(userId: string): Promise<string> {
    const encryptedToken = this.tokenCache.get(userId);
    if (!encryptedToken) {
      throw new GoogleAdsAuthenticationError('No token found for user');
    }
    
    // Check expiration
    if (encryptedToken.expiresAt && Date.now() >= encryptedToken.expiresAt) {
      // Attempt refresh
      if (encryptedToken.refreshToken) {
        return this.refreshToken(userId, encryptedToken);
      }
      throw new GoogleAdsAuthenticationError('Token expired and no refresh token available');
    }
    
    // Update last used
    encryptedToken.lastUsed = Date.now();
    
    return this.decrypt(encryptedToken.accessToken);
  }
  
  private encrypt(data: string): string {
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  private decrypt(encryptedData: string): string {
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

#### Circuit Breaker with Security Monitoring
```typescript
export class GoogleAdsSecurityCircuitBreaker extends GoogleAdsCircuitBreaker {
  private securityViolations: Map<string, SecurityViolation[]> = new Map();
  private readonly maxSecurityViolations = 5;
  private readonly violationWindow = 300000; // 5 minutes
  
  async execute<T>(operation: () => Promise<T>, context?: SecurityContext): Promise<T> {
    // Check security violations
    if (context) {
      this.checkSecurityViolations(context);
    }
    
    try {
      const result = await super.execute(operation);
      
      // Clear violations on success
      if (context) {
        this.clearSecurityViolations(context.userId);
      }
      
      return result;
    } catch (error) {
      // Track security-related failures
      if (this.isSecurityError(error) && context) {
        this.recordSecurityViolation(context, error);
      }
      
      throw error;
    }
  }
  
  private checkSecurityViolations(context: SecurityContext): void {
    const violations = this.securityViolations.get(context.userId) || [];
    const recentViolations = violations.filter(
      v => Date.now() - v.timestamp < this.violationWindow
    );
    
    if (recentViolations.length >= this.maxSecurityViolations) {
      throw new GoogleAdsPermissionError(
        'Too many security violations - access temporarily blocked'
      );
    }
  }
  
  private recordSecurityViolation(context: SecurityContext, error: Error): void {
    const violations = this.securityViolations.get(context.userId) || [];
    violations.push({
      timestamp: Date.now(),
      error: error.message,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    
    this.securityViolations.set(context.userId, violations);
    
    // Alert security team
    this.alertSecurityTeam(context, error);
  }
  
  private alertSecurityTeam(context: SecurityContext, error: Error): void {
    // Implementation would send alert to security monitoring system
    console.error('Security violation detected:', {
      userId: context.userId,
      error: error.message,
      timestamp: new Date().toISOString(),
      ipAddress: context.ipAddress
    });
  }
}
```

---

## 4. Data Protection

### Cache Access Control
```typescript
export class SecureGoogleAdsCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: Map<string, AccessLogEntry[]> = new Map();
  
  async get(key: string, userId: string, permissions: string[]): Promise<any> {
    // Validate access permissions
    this.validateAccess(key, userId, permissions);
    
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Log access
    this.logAccess(key, userId, 'READ');
    
    // Decrypt sensitive data
    return this.decryptCacheData(entry.data);
  }
  
  async set(
    key: string, 
    data: any, 
    userId: string, 
    ttl: number = 3600000,
    sensitivity: 'public' | 'internal' | 'confidential' = 'internal'
  ): Promise<void> {
    // Encrypt sensitive data
    const encryptedData = sensitivity !== 'public' 
      ? this.encryptCacheData(data) 
      : data;
    
    const entry: CacheEntry = {
      data: encryptedData,
      userId,
      expiresAt: Date.now() + ttl,
      sensitivity,
      createdAt: Date.now()
    };
    
    this.cache.set(key, entry);
    this.logAccess(key, userId, 'WRITE');
    
    // Schedule cleanup
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }
  
  private validateAccess(key: string, userId: string, permissions: string[]): void {
    const entry = this.cache.get(key);
    if (!entry) {
      return; // No entry to validate
    }
    
    // Check ownership
    if (entry.userId !== userId && !permissions.includes('admin')) {
      throw new GoogleAdsPermissionError('Access denied to cache entry');
    }
    
    // Check sensitivity level
    if (entry.sensitivity === 'confidential' && !permissions.includes('confidential_read')) {
      throw new GoogleAdsPermissionError('Insufficient permissions for confidential data');
    }
  }
  
  private logAccess(key: string, userId: string, operation: string): void {
    const logs = this.accessLog.get(userId) || [];
    logs.push({
      key,
      operation,
      timestamp: Date.now(),
      ipAddress: this.getCurrentIPAddress()
    });
    
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    this.accessLog.set(userId, logs);
  }
}
```

### Error Message Sanitization
```typescript
export class SecureErrorHandler {
  private static readonly SENSITIVE_PATTERNS = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /(?:password|token|key|secret)[\s]*[:=][\s]*[^\s]+/gi // Credentials
  ];
  
  static sanitizeErrorMessage(error: Error, context?: string): string {
    let message = error.message;
    
    // Remove sensitive information
    this.SENSITIVE_PATTERNS.forEach(pattern => {
      message = message.replace(pattern, '[REDACTED]');
    });
    
    // Limit message length
    if (message.length > 500) {
      message = message.substring(0, 497) + '...';
    }
    
    // Add safe context if provided
    if (context) {
      message = `[${context}] ${message}`;
    }
    
    return message;
  }
  
  static createSafeError(
    originalError: Error, 
    userMessage: string,
    logContext?: any
  ): GoogleAdsAPIError {
    // Log full error details securely
    this.logSecureError(originalError, logContext);
    
    // Return sanitized error to user
    return new GoogleAdsAPIError(
      this.sanitizeErrorMessage(new Error(userMessage))
    );
  }
  
  private static logSecureError(error: Error, context?: any): void {
    // Log to secure logging system (not console in production)
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      sanitized: this.sanitizeErrorMessage(error)
    };
    
    // In production, this would go to a secure logging service
    console.error('[SECURE_LOG]', JSON.stringify(logEntry, null, 2));
  }
}
```

---

## 5. Security Testing Patterns

### Configuration Security Tests
```typescript
describe('Google Ads Configuration Security', () => {
  test('should reject invalid client ID formats', () => {
    process.env.GOOGLE_ADS_CLIENT_ID = 'invalid-client-id';
    
    expect(() => validateGoogleAdsConfig()).toThrow(
      'Invalid client ID format'
    );
  });
  
  test('should reject weak developer tokens', () => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'weak-token';
    
    expect(() => validateGoogleAdsConfig()).toThrow(
      'Invalid developer token format'
    );
  });
  
  test('should require all mandatory environment variables', () => {
    delete process.env.GOOGLE_ADS_CLIENT_SECRET;
    
    expect(() => validateGoogleAdsConfig()).toThrow(
      'Missing required environment variables'
    );
  });
});
```

### Input Validation Security Tests
```typescript
describe('GAQL Security Validation', () => {
  test('should prevent SQL injection attempts', () => {
    const maliciousQuery = "SELECT * FROM campaign; DROP TABLE users; --";
    
    expect(() => GAQLSecurityValidator.sanitizeGAQLQuery(maliciousQuery))
      .toThrow('Dangerous keyword');
  });
  
  test('should validate customer ID format', () => {
    expect(() => CustomerIdValidator.validateCustomerId('invalid'))
      .toThrow('Customer ID must be 10 digits');
  });
  
  test('should limit date range to prevent resource exhaustion', () => {
    const start = '2020-01-01';
    const end = '2025-01-01'; // 5 years
    
    expect(() => DateRangeValidator.validateDateRange(start, end))
      .toThrow('Date range cannot exceed');
  });
});
```

### Access Control Tests
```typescript
describe('Access Control Security', () => {
  test('should deny access to unauthorized cache entries', async () => {
    const cache = new SecureGoogleAdsCache();
    await cache.set('user123:campaigns', data, 'user123');
    
    await expect(cache.get('user123:campaigns', 'user456', []))
      .rejects.toThrow('Access denied');
  });
  
  test('should block users with too many security violations', async () => {
    const circuitBreaker = new GoogleAdsSecurityCircuitBreaker();
    const context = { userId: 'user123', ipAddress: '127.0.0.1' };
    
    // Generate 5 security violations
    for (let i = 0; i < 5; i++) {
      try {
        await circuitBreaker.execute(
          () => { throw new GoogleAdsPermissionError('Test violation'); },
          context
        );
      } catch (e) {
        // Expected
      }
    }
    
    // 6th attempt should be blocked
    await expect(
      circuitBreaker.execute(() => Promise.resolve(), context)
    ).rejects.toThrow('Too many security violations');
  });
});
```

---

## 6. Production Security Checklist

### Pre-Deployment Security Verification

#### Environment Configuration
- [ ] All sensitive credentials stored in encrypted environment variables
- [ ] Service account keys rotated within last 90 days
- [ ] OAuth2 client secrets use strong entropy (>256 bits)
- [ ] Redirect URIs whitelisted and use HTTPS
- [ ] Rate limiting thresholds configured per Google's recommendations

#### Authentication & Authorization
- [ ] Token encryption enabled for cached credentials
- [ ] JWT tokens have appropriate expiration times (<1 hour)
- [ ] Refresh token rotation implemented
- [ ] Multi-factor authentication enforced for admin accounts
- [ ] Service account permissions follow principle of least privilege

#### Input Validation
- [ ] GAQL query sanitization active
- [ ] Customer ID validation enforced
- [ ] Date range limits configured
- [ ] Request size limits enforced
- [ ] File upload restrictions in place

#### Data Protection
- [ ] Cache encryption enabled for sensitive data
- [ ] Error messages sanitized for production
- [ ] Logging configured to exclude sensitive information
- [ ] Data retention policies implemented
- [ ] Secure data disposal procedures documented

### Monitoring & Alerting Configuration

#### Security Monitoring
```typescript
export class GoogleAdsSecurityMonitor {
  private alertThresholds = {
    authFailures: { count: 5, window: 300000 }, // 5 failures in 5 minutes
    rateLimitExceeded: { count: 3, window: 900000 }, // 3 times in 15 minutes
    unauthorizedAccess: { count: 1, window: 0 }, // Immediate alert
    dataExfiltration: { sizeLimit: 100 * 1024 * 1024 } // 100MB
  };
  
  monitorSecurityEvents(): void {
    // Monitor authentication failures
    this.monitorAuthFailures();
    
    // Monitor rate limit violations
    this.monitorRateLimits();
    
    // Monitor unauthorized access attempts
    this.monitorUnauthorizedAccess();
    
    // Monitor data access patterns
    this.monitorDataAccess();
  }
  
  private async sendSecurityAlert(
    type: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): Promise<void> {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      severity,
      details,
      service: 'google-ads-api'
    };
    
    // Send to security operations center
    await this.sendToSOC(alert);
    
    // Log to security audit trail
    await this.logToAuditTrail(alert);
    
    // Trigger automated response if critical
    if (severity === 'critical') {
      await this.triggerIncidentResponse(alert);
    }
  }
}
```

### Key Rotation Procedures

#### Automated Key Rotation
```typescript
export class GoogleAdsKeyRotationManager {
  private rotationSchedule: Map<string, Date> = new Map();
  
  async scheduleKeyRotation(keyType: string, rotationInterval: number): Promise<void> {
    const nextRotation = new Date(Date.now() + rotationInterval);
    this.rotationSchedule.set(keyType, nextRotation);
    
    // Schedule the rotation
    setTimeout(async () => {
      await this.performKeyRotation(keyType);
    }, rotationInterval);
  }
  
  private async performKeyRotation(keyType: string): Promise<void> {
    try {
      switch (keyType) {
        case 'oauth_client_secret':
          await this.rotateOAuthClientSecret();
          break;
        case 'service_account':
          await this.rotateServiceAccountKey();
          break;
        case 'encryption_key':
          await this.rotateEncryptionKey();
          break;
      }
      
      // Update rotation schedule
      await this.scheduleKeyRotation(keyType, this.getRotationInterval(keyType));
      
      // Notify operations team
      await this.notifyKeyRotation(keyType);
      
    } catch (error) {
      // Alert on rotation failure
      await this.alertKeyRotationFailure(keyType, error);
    }
  }
  
  private async rotateOAuthClientSecret(): Promise<void> {
    // 1. Generate new client secret via Google Cloud Console API
    // 2. Update environment configuration
    // 3. Test new credentials
    // 4. Deactivate old credentials
    // 5. Update monitoring dashboards
  }
}
```

---

## 7. Implementation Examples

### Complete Secure Client Setup
```typescript
// secure-google-ads-client.ts
export class SecureGoogleAdsClient {
  private client: GoogleAdsClient;
  private securityMonitor: GoogleAdsSecurityMonitor;
  private rateLimiter: GoogleAdsRateLimiter;
  private circuitBreaker: GoogleAdsSecurityCircuitBreaker;
  
  constructor() {
    // Validate configuration
    const config = validateGoogleAdsConfig();
    
    // Initialize security components
    this.securityMonitor = new GoogleAdsSecurityMonitor();
    this.rateLimiter = new GoogleAdsRateLimiter();
    this.circuitBreaker = new GoogleAdsSecurityCircuitBreaker();
    
    // Initialize client with security components
    this.client = new GoogleAdsClient(
      config,
      new GoogleAdsAuthManager(config),
      this.rateLimiter,
      this.circuitBreaker
    );
    
    // Start security monitoring
    this.securityMonitor.monitorSecurityEvents();
  }
  
  async searchCampaigns(
    customerId: string,
    query: string,
    context: SecurityContext
  ): Promise<any> {
    try {
      // Validate inputs
      const validCustomerId = CustomerIdValidator.validateCustomerId(customerId);
      const sanitizedQuery = GAQLSecurityValidator.sanitizeGAQLQuery(query);
      
      // Execute with security monitoring
      return await this.circuitBreaker.execute(async () => {
        return await this.client.search(validCustomerId, { query: sanitizedQuery });
      }, context);
      
    } catch (error) {
      // Handle error securely
      throw SecureErrorHandler.createSafeError(
        error,
        'Failed to retrieve campaign data',
        { customerId, userId: context.userId }
      );
    }
  }
}
```

### Security Testing Integration
```typescript
// security-test-suite.ts
export class GoogleAdsSecurityTestSuite {
  private testClient: SecureGoogleAdsClient;
  
  async runFullSecuritySuite(): Promise<SecurityTestResults> {
    const results: SecurityTestResults = {
      passed: 0,
      failed: 0,
      vulnerabilities: []
    };
    
    // Configuration security tests
    await this.testConfigurationSecurity(results);
    
    // Input validation tests
    await this.testInputValidation(results);
    
    // Authentication tests
    await this.testAuthentication(results);
    
    // Authorization tests
    await this.testAuthorization(results);
    
    // Data protection tests
    await this.testDataProtection(results);
    
    // Rate limiting tests
    await this.testRateLimiting(results);
    
    return results;
  }
  
  private async testInputValidation(results: SecurityTestResults): Promise<void> {
    const maliciousInputs = [
      "'; DROP TABLE campaigns; --",
      '<script>alert("xss")</script>',
      '../../../etc/passwd',
      'A'.repeat(10000), // Buffer overflow attempt
      '\x00\x01\x02\x03' // Binary injection
    ];
    
    for (const input of maliciousInputs) {
      try {
        GAQLSecurityValidator.sanitizeGAQLQuery(input);
        results.vulnerabilities.push({
          type: 'input_validation',
          severity: 'high',
          description: `Malicious input not blocked: ${input.substring(0, 50)}...`
        });
        results.failed++;
      } catch (error) {
        // Expected - input was blocked
        results.passed++;
      }
    }
  }
}
```

---

## Conclusion

This security patterns guide provides comprehensive protection for Google Ads API integration. Regular security reviews should be conducted using these patterns, and all implementations should undergo security testing before production deployment.

### Key Security Principles Applied:

1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Minimal required permissions
3. **Zero Trust**: Verify all requests and access attempts
4. **Secure by Default**: Security enabled by default configuration
5. **Fail Securely**: Graceful failure handling without information disclosure

### Compliance Considerations:

- SOC 2 Type II compliance for data handling
- GDPR compliance for EU user data
- PCI DSS compliance if processing payment data
- CCPA compliance for California residents

### Next Steps:

1. Implement security patterns in development environment
2. Run security test suite before deployment
3. Configure monitoring and alerting
4. Establish key rotation procedures
5. Train development team on secure coding practices

For questions or security concerns, contact the security team or refer to the incident response playbook.