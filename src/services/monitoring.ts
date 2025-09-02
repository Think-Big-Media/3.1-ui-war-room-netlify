/**
 * Frontend Observability & Monitoring
 * Chairman's Mandate: Complete visibility into production errors and performance
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for production monitoring
 * Chairman's Mandate: Capture all unhandled exceptions and performance metrics
 */
export function initializeMonitoring() {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_ENV || 'production',
      integrations: [
        Sentry.browserTracingIntegration({
          // Set sampling rates for performance monitoring
          tracePropagationTargets: [
            'localhost',
            'war-room-3-1-ui.netlify.app',
            /^\//,
          ],
        }),
        // Capture console errors
        Sentry.captureConsoleIntegration({
          levels: ['error', 'warn'],
        }),
      ],
      
      // Performance monitoring
      tracesSampleRate: import.meta.env.VITE_ENV === 'production' ? 0.1 : 1.0,
      
      // Session replay for debugging
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Capture additional context
      beforeSend(event, hint) {
        // Add user context if available
        const user = getUserContext();
        if (user) {
          event.user = {
            id: user.id,
            email: user.email,
            username: user.username,
          };
        }
        
        // Add campaign context if available
        const campaign = getCampaignContext();
        if (campaign) {
          event.tags = {
            ...event.tags,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
          };
        }
        
        // Filter out noisy errors
        if (isNoisyError(event, hint)) {
          return null;
        }
        
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
      ],
    });
    
    console.log('✅ Sentry monitoring initialized');
  } else {
    console.log('ℹ️ Sentry monitoring disabled in development');
  }
}

/**
 * Get current user context for error enrichment
 */
function getUserContext() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Get current campaign context for error enrichment
 */
function getCampaignContext() {
  try {
    const campaignStr = sessionStorage.getItem('current_campaign');
    if (campaignStr) {
      return JSON.parse(campaignStr);
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Filter out noisy/unactionable errors
 */
function isNoisyError(event: Sentry.Event, hint: Sentry.EventHint): boolean {
  const error = hint.originalException;
  
  // Filter out browser extension errors
  if (error && error.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('extension://') ||
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://') ||
      message.includes('safari-extension://')
    ) {
      return true;
    }
  }
  
  // Filter out expected network errors during health checks
  if (
    event.message?.includes('/api/v1/health') &&
    event.message?.includes('Failed to fetch')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Custom error boundary with Sentry integration
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Performance monitoring wrapper
 */
export const withProfiler = Sentry.withProfiler;

/**
 * Manual error capture for handled errors
 */
export function captureError(error: Error, context?: Record<string, any>) {
  console.error('Captured error:', error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }
}

/**
 * Track custom events and metrics
 */
export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message: eventName,
      category: 'custom',
      level: 'info',
      data,
    });
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(`📊 Event: ${eventName}`, data);
  }
}

/**
 * Track performance metrics
 */
export function trackPerformance(metricName: string, value: number, unit: string = 'ms') {
  if (import.meta.env.PROD) {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
      transaction.setMeasurement(metricName, value, unit);
    }
  }
  
  // Log performance warnings
  if (unit === 'ms' && value > 1000) {
    console.warn(`⚠️ Performance warning: ${metricName} took ${value}ms`);
  }
}

/**
 * Monitor Core Web Vitals
 */
export function trackWebVitals() {
  if ('web-vital' in window) {
    // Track Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          trackPerformance('lcp', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Track First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          const fid = entry.processingStart - entry.startTime;
          trackPerformance('fid', fid);
        }
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // Track Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      trackPerformance('cls', clsValue, 'score');
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

/**
 * Set user context for all future events
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}