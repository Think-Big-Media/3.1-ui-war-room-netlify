/**
 * PostHog analytics service for frontend tracking.
 * Handles user identification, event tracking, and feature flags.
 */
import React from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

// PostHog configuration from environment
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export interface AnalyticsUser {
  id: string;
  email: string;
  orgId: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface TrackingEvent {
  name: string;
  properties?: Record<string, any>;
}

class PostHogService {
  private initialized = false;
  private userId: string | null = null;
  private orgId: string | null = null;

  /**
   * Initialize PostHog with configuration
   */
  initialize(): void {
    if (this.initialized || !POSTHOG_KEY) {
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        element_allowlist: ['button', 'input', 'select', 'textarea', 'a'],
        css_selector_allowlist: ['[data-track]', '[data-analytics]'],
      },
      session_recording: {
        maskAllInputs: true,
      },
      loaded: (ph) => {
        if (import.meta.env.DEV) {
          console.log('PostHog loaded', ph);
        }
      },
    });

    this.initialized = true;
  }

  /**
   * Identify user for tracking
   */
  identify(user: AnalyticsUser): void {
    if (!this.initialized) {
      return;
    }

    this.userId = user.id;
    this.orgId = user.orgId;

    posthog.identify(user.id, {
      email: user.email,
      org_id: user.orgId,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
    });

    // Set organization context
    posthog.group('organization', user.orgId, {
      name: user.orgId, // Will be enriched server-side
    });
  }

  /**
   * Reset user identification (on logout)
   */
  reset(): void {
    if (!this.initialized) {
      return;
    }

    this.userId = null;
    this.orgId = null;
    posthog.reset();
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    const enrichedProps = {
      ...properties,
      org_id: this.orgId,
      platform: 'war_room_frontend',
      timestamp: new Date().toISOString(),
    };

    posthog.capture(eventName, enrichedProps);
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.track('$pageview', {
      page_name: pageName,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>): void {
    this.track(`feature_${feature}_${action}`, {
      feature,
      action,
      metadata,
    });
  }

  /**
   * Track UI element clicks
   */
  trackClick(elementName: string, elementType: string, metadata?: Record<string, any>): void {
    this.track('ui_element_clicked', {
      element_name: elementName,
      element_type: elementType,
      ...metadata,
    });
  }

  /**
   * Track form submissions
   */
  trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, any>): void {
    this.track('form_submitted', {
      form_name: formName,
      success,
      ...metadata,
    });
  }

  /**
   * Track API errors
   */
  trackError(errorType: string, errorMessage: string, context?: Record<string, any>): void {
    this.track('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context,
    });
  }

  /**
   * Track timing metrics
   */
  trackTiming(category: string, variable: string, timeMs: number): void {
    this.track('timing_recorded', {
      category,
      variable,
      time_ms: timeMs,
    });
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flagName: string): boolean {
    if (!this.initialized) {
      return false;
    }
    return posthog.isFeatureEnabled(flagName) ?? false;
  }

  /**
   * Get feature flag payload
   */
  getFeatureFlagPayload(flagName: string): any {
    if (!this.initialized) {
      return null;
    }
    return posthog.getFeatureFlagPayload(flagName);
  }

  /**
   * Register super properties (sent with every event)
   */
  registerSuperProperties(properties: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }
    posthog.register(properties);
  }

  /**
   * Opt user in/out of tracking
   */
  setOptIn(optIn: boolean): void {
    if (!this.initialized) {
      return;
    }

    if (optIn) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  }
}

// Export singleton instance
export const analytics = new PostHogService();

// Export provider component
export const PostHogProvider = PHProvider;

// Convenience tracking hooks
export const useTracking = () => {
  return {
    track: analytics.track.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFeature: analytics.trackFeatureUsage.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  };
};

// Auto-tracking HOC
export function withTracking<P extends object>(
  Component: React.ComponentType<P>,
  eventName: string,
  getProperties?: (props: P) => Record<string, any>
): React.ComponentType<P> {
  return (props: P) => {
    React.useEffect(() => {
      analytics.track(eventName, getProperties?.(props));
    }, []);

    return React.createElement(Component, props);
  };
}

// Tracking directive for elements
export function trackingProps(
  action: string,
  properties?: Record<string, any>
): Record<string, any> {
  return {
    'data-track': action,
    'data-analytics': JSON.stringify(properties || {}),
    onClick: () => analytics.track(action, properties),
  };
}
