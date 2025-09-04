# Meta Integration UI Component

## Overview

This directory contains the Meta/Facebook Business integration UI components for the War Room platform. The UI is specifically designed to be screenshot-ready for Meta's app approval process.

## Components

### MetaIntegration.tsx

A comprehensive React component that provides:

- **Connection Interface**: Professional "Connect to Facebook" button with Meta branding
- **OAuth Flow Simulation**: Simulates the Facebook OAuth authentication process
- **Connection Status**: Visual indicators showing connected/disconnected states
- **Campaign Data Display**: Realistic mock campaign data for demonstration
- **Performance Metrics**: Displays impressions, clicks, spend, CTR, and CPM
- **Brand Compliance**: Uses official Meta blue color (#1877F2) and branding
- **Privacy Notice**: Includes privacy protection messaging

## Features

### Connection States

1. **Disconnected State**:
   - Shows prominent "Connect Facebook Account" button
   - Displays benefits (Secure OAuth, Unified Analytics, Performance Insights)
   - Uses Meta brand colors and styling

2. **Connected State**:
   - Shows account connection status with green indicators
   - Displays mock campaign data in professional format
   - Provides disconnect option
   - Shows detailed campaign performance metrics

### Mock Data

The component includes realistic mock campaign data that looks professional for screenshots:

- Q4 Voter Outreach Campaign
- Early Voting Awareness Drive  
- Youth Engagement Initiative

Each campaign includes realistic metrics for impressions, clicks, spend, CTR, and CPM.

### Styling

- Uses Tailwind CSS with glass morphism effects
- Consistent with War Room design system
- Responsive layout that works on desktop and mobile
- Professional animations with Framer Motion
- Meta brand compliance with official colors

## Integration

The MetaIntegration component is integrated into the main SettingsPage under a new "Platform Integrations" section. Users can access it via:

1. Navigate to Settings page (`/settings`)
2. Scroll to "Platform Integrations" section
3. Use the Meta Business integration panel

## Technical Implementation

### Dependencies

- React with TypeScript
- Framer Motion for animations
- Lucide React for icons
- Custom UI components (Button, Badge, Card)
- Logger utility for debugging

### OAuth Simulation

The component simulates the OAuth flow by:

1. User clicks "Connect Facebook Account"
2. Shows loading state for 2 seconds (simulating redirect/auth)
3. Updates to connected state with mock account data
4. Displays realistic campaign performance data

### Real Implementation Notes

For production use, replace the mock OAuth with:

1. Integration with the existing `MetaAuthManager` in `src/api/meta/auth.ts`
2. Real API calls to fetch campaign data
3. Proper error handling for failed connections
4. Token storage and refresh logic

## Usage

```tsx
import MetaIntegration from '../components/integrations/MetaIntegration';

function MyPage() {
  return (
    <div>
      <MetaIntegration />
    </div>
  );
}
```

## Meta App Approval

This UI is specifically designed for Meta's app approval process and includes:

- Professional appearance suitable for screenshots
- Clear value proposition and benefits
- Privacy protection messaging
- Realistic campaign data display
- Meta brand compliance
- Intuitive user flow

The interface demonstrates the integration capability required for Meta Business API approval while maintaining a polished, production-ready appearance.