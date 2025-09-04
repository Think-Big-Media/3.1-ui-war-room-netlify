# PostHog Setup Guide for War Room Analytics

## Overview

PostHog provides product analytics, feature flags, and user behavior tracking for War Room Analytics. This guide covers the complete setup process for production deployment.

## Prerequisites

- War Room deployment ready for external service configuration
- Access to PostHog.com account (create free account if needed)
- Access to your Render.com dashboard for environment variable configuration

## Step 1: Create PostHog Project

1. **Sign up/Login to PostHog**
   - Go to [https://posthog.com](https://posthog.com)
   - Sign up for a free account or login to existing account
   - PostHog offers generous free tier: 1M events/month

2. **Create New Project**
   - After login, you'll be prompted to create your first project
   - Fill in project details:
     - **Project Name**: `War Room Analytics`
     - **Organization**: Create new or select existing
     - **Data Location**: Choose region (US or EU)
   - Click "Create Project"

## Step 2: Get Your PostHog Configuration

1. **Access Project Settings**
   - Go to Settings → Project in your PostHog dashboard
   - Find your project API key and configuration

2. **Copy Required Values**
   ```
   Project API Key: phc_abc123def456... (for frontend)
   Personal API Key: phx_xyz789... (for backend API calls)
   Host: https://app.posthog.com (or your self-hosted URL)
   ```

3. **Create Personal API Key** (for backend)
   - Go to Settings → Personal API Keys
   - Click "Create Personal API Key"
   - Name: `War Room Backend`
   - Scopes: Select `project:read`, `event:read`, `person:read`
   - Click "Create Key" and copy the value

## Step 3: Configure Environment Variables

### For Render.com Production Deployment

1. **Go to Render Dashboard**
   - Navigate to your War Room service
   - Click "Environment" tab

2. **Add Required Variables**
   ```bash
   # PostHog Configuration
   POSTHOG_KEY=phc_your-project-api-key-here
   POSTHOG_HOST=https://app.posthog.com
   POSTHOG_ENABLED=true
   POSTHOG_API_KEY=phx_your-personal-api-key-here
   POSTHOG_PERSON_PROFILES=identified_only
   
   # Frontend PostHog Configuration
   VITE_POSTHOG_KEY=phc_your-project-api-key-here
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

3. **Save and Redeploy**
   - Click "Save" to update environment variables
   - Your service will automatically redeploy

### For Local Development

1. **Update Your .env File**
   ```bash
   # Add to your .env file
   POSTHOG_KEY=phc_your-project-api-key-here
   POSTHOG_HOST=https://app.posthog.com
   POSTHOG_ENABLED=true
   POSTHOG_API_KEY=phx_your-personal-api-key-here
   POSTHOG_PERSON_PROFILES=identified_only
   
   VITE_POSTHOG_KEY=phc_your-project-api-key-here
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

## Step 4: Configure PostHog Settings

### 1. Set Up Project Settings

1. **Configure Data Retention**
   - Go to Settings → Project Settings
   - Set data retention period (default: 7 years for free tier)
   - Configure timezone to match your business hours

2. **Enable/Disable Features**
   - **Session Recordings**: Enable for user experience insights
   - **Autocapture**: Enable to track all clicks automatically
   - **Heatmaps**: Enable for visual user interaction data
   - **Feature Flags**: Enable for A/B testing capabilities

### 2. Configure Allowed Domains

1. **Set Authorized URLs**
   - Go to Settings → Project Settings → Authorized URLs
   - Add your domains:
     ```
     https://war-room-oa9t.onrender.com
     http://localhost:5173 (for development)
     ```

### 3. Set Up Data Processing

1. **Configure Person Profiles**
   - Go to Settings → Project Settings
   - Set "Person Profiles" to "Identified only" (recommended for privacy)
   - This reduces data usage and improves privacy compliance

## Step 5: Set Up Key Analytics Events

### 1. Define Important Events to Track

Create custom events for War Room specific actions:

```javascript
// Example events to track in your application
posthog.capture('campaign_created', {
  campaign_type: 'facebook_ads',
  budget: 1000,
  duration: '30_days'
});

posthog.capture('dashboard_viewed', {
  dashboard_type: 'analytics',
  user_role: 'admin'
});

posthog.capture('export_completed', {
  export_type: 'pdf',
  data_range: '30_days',
  record_count: 500
});
```

### 2. Set Up User Identification

```javascript
// Identify users when they log in
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  organization: user.organization_name,
  role: user.role
});
```

## Step 6: Configure Feature Flags

1. **Create Feature Flags**
   - Go to Feature Flags in PostHog dashboard
   - Create flags for new features:
     ```
     advanced_analytics: Boolean flag
     beta_ai_features: Boolean flag
     export_v2: Boolean flag
     ```

2. **Set Rollout Rules**
   - Configure gradual rollouts (e.g., 10% of users)
   - Target specific user groups or organizations
   - Set up A/B testing variants

## Step 7: Set Up Insights and Dashboards

### 1. Create Key Metrics Dashboard

1. **Go to Dashboards → Create Dashboard**
2. **Add Key Metrics**:
   - Daily Active Users
   - Campaign Creation Rate
   - Export Usage
   - Error Rate
   - Session Duration

### 2. Set Up Conversion Funnels

Create funnels to track user journey:
```
1. User Registration
2. First Login
3. Campaign Creation
4. Data Export
5. Subscription Upgrade (if applicable)
```

### 3. Configure Alerts

- Go to Insights → Create Alert
- Set up alerts for:
  - Significant drop in DAU
  - Spike in error events
  - Low conversion rates

## Step 8: Privacy and Compliance Setup

### 1. Configure Data Privacy

1. **IP Address Handling**
   - Go to Settings → Project Settings
   - Enable "Anonymize IPs" for GDPR compliance

2. **Data Retention**
   - Set appropriate retention periods
   - Configure automatic data deletion

### 2. GDPR Compliance

1. **Set up Cookie Consent** (if required)
   ```javascript
   // Only initialize PostHog after consent
   if (userConsent.analytics) {
     posthog.init(process.env.VITE_POSTHOG_KEY);
   }
   ```

2. **Provide Data Export/Deletion**
   - PostHog provides GDPR-compliant data export/deletion
   - Users can request their data via API

## Step 9: Test Integration

### 1. Verify Event Tracking

1. **Test in Development**
   ```bash
   # Start your development server
   npm run dev
   
   # Navigate through your app
   # Check PostHog Live Events for real-time data
   ```

2. **Check PostHog Dashboard**
   - Go to Events → Live Events
   - Perform actions in your app
   - Verify events appear in real-time

### 2. Test Feature Flags

1. **Create Test Flag**
   - Create a simple boolean flag in PostHog
   - Use it in your application:
   ```javascript
   if (posthog.isFeatureEnabled('test_flag')) {
     // Show new feature
   }
   ```

### 3. Verify User Identification

1. **Test User Login**
   - Login to your application
   - Check PostHog Persons tab
   - Verify user data is properly identified

## Step 10: Production Optimization

### 1. Performance Optimization

```javascript
// Configure PostHog for optimal performance
posthog.init(process.env.VITE_POSTHOG_KEY, {
  api_host: process.env.VITE_POSTHOG_HOST,
  loaded: function(posthog) {
    // Reduce frequency of session recording captures
    posthog.set_config({
      session_recording: {
        maskAllInputs: true,  // Privacy
        sampleRate: 0.1       // 10% of sessions only
      }
    });
  }
});
```

### 2. Set Up Monitoring

1. **Create Health Check Dashboard**
   - Monitor PostHog integration health
   - Track API call success rates
   - Monitor event volume

2. **Set Up Alerts**
   - Alert when events stop flowing
   - Monitor for API errors
   - Track unusual usage patterns

## Troubleshooting

### Common Issues

1. **Events Not Appearing**
   ```bash
   # Check browser console for errors
   # Verify API key is correct
   # Check network tab for blocked requests
   ```

2. **CORS Issues**
   - Verify domain is added to Authorized URLs
   - Check browser security settings
   - Ensure proper HTTPS configuration

3. **Feature Flags Not Working**
   - Verify user is properly identified
   - Check flag conditions and rollout settings
   - Test with debug mode enabled

### Debug Mode

Enable debug mode for troubleshooting:
```javascript
posthog.init(process.env.VITE_POSTHOG_KEY, {
  debug: true  // Only in development
});
```

## Security Checklist

- [ ] API keys stored securely as environment variables
- [ ] Authorized URLs configured correctly
- [ ] IP anonymization enabled (if required)
- [ ] Sensitive data not tracked in events
- [ ] Cookie consent implemented (if required)
- [ ] Data retention policies configured
- [ ] Access controls set up for team members

## Cost Optimization

### Free Tier Limits
- 1M events per month
- Unlimited team members
- 1-year data retention

### Tips to Stay Within Limits
- Use `identified_only` person profiles
- Reduce autocapture events if not needed
- Set appropriate session recording sample rates
- Monitor usage in PostHog dashboard

## Next Steps

After PostHog is configured:

1. Set up Sentry for error monitoring
2. Create custom analytics dashboards
3. Implement A/B testing for new features
4. Monitor user behavior patterns
5. Set up automated alerts for key metrics

---

**Note**: Keep your PostHog API keys secure and never commit them to version control. Monitor your usage to stay within free tier limits or upgrade as needed.