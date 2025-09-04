/**
 * War Room Platform - Naming Constants
 * Single source of truth for all naming conventions
 * Based on COMET BROWSER ANALYSIS (Ground Truth)
 *
 * CTO/CMO Best Practice: Centralize all naming to prevent inconsistencies
 * Last Updated: 2025-08-31 (Comet Analysis)
 * Source: Live frontend analysis at localhost:5173
 */

/**
 * Page Names - ACTUAL frontend reality (Comet verified)
 * These MUST be used consistently across all components
 * ✅ VERIFIED: These match the live running frontend
 */
export const PAGE_NAMES = {
  DASHBOARD: 'Dashboard',                      // ✅ Comet: Document title shows "War Room Platform", main heading is dashboard
  LIVE_MONITORING: 'Live Monitoring',         // ✅ Comet: Nav label "LIVE MONITORING" 
  WAR_ROOM: 'War Room',                       // ✅ Comet: Nav label "WAR ROOM (Campaign Control)"
  INTELLIGENCE: 'Intelligence',               // ✅ Comet: Nav label "INTELLIGENCE"
  ALERT_CENTER: 'Alert Center',               // ✅ Comet: Nav label "ALERT CENTER"
  SETTINGS: 'Settings',                       // ✅ Comet: Nav label "SETTINGS"
} as const;

/**
 * Navigation Labels - EXACT labels from live frontend (Comet verified)
 * All caps for navigation menu
 */
export const NAV_LABELS = {
  DASHBOARD: 'DASHBOARD',                      // ✅ Comet: Top nav shows "DASHBOARD"
  LIVE_MONITORING: 'LIVE MONITORING',         // ✅ Comet: Top nav shows "LIVE MONITORING" 
  WAR_ROOM: 'WAR ROOM',                       // ✅ Comet: Top nav shows "WAR ROOM (Campaign Control)"
  INTELLIGENCE: 'INTELLIGENCE',               // ✅ Comet: Top nav shows "INTELLIGENCE"
  ALERT_CENTER: 'ALERT CENTER',               // ✅ Comet: Top nav shows "ALERT CENTER"
  SETTINGS: 'SETTINGS',                       // ✅ Comet: Top nav shows "SETTINGS"
} as const;

/**
 * Routes - ACTUAL URL paths (Comet verified)
 * These URLs are working in the live frontend
 */
export const ROUTES = {
  HOME: '/',                                   // ✅ Comet: localhost:5173/ → Dashboard
  DASHBOARD: '/',                             // ✅ Comet: Same as HOME, shows dashboard
  LIVE_MONITORING: '/real-time-monitoring',   // ✅ Comet: localhost:5173/real-time-monitoring
  WAR_ROOM: '/campaign-control',              // ✅ Comet: localhost:5173/campaign-control  
  INTELLIGENCE: '/intelligence-hub',          // ✅ Comet: localhost:5173/intelligence-hub
  ALERT_CENTER: '/alert-center',              // ✅ Comet: localhost:5173/alert-center
  SETTINGS: '/settings',                      // ✅ Comet: localhost:5173/settings
  // Legacy routes (remove after migration)
  LEGACY_COMMAND_CENTER: '/command-center',  // ❌ Deprecated: was never implemented
} as const;

/**
 * API Endpoints - VERIFIED backend routes
 * ✅ Backend analysis confirms these endpoints exist
 * 🔗 Backend URL: war-room-3-backend-d2msjrk82vjjq794glog.lp.dev
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',              // ✅ Verified: exists in backend
    ME: '/api/v1/auth/me',                    // ✅ Verified: exists in backend
    LOGOUT: '/api/v1/auth/logout',            // ✅ Verified: exists in backend
  },

  // Dashboard (Analytics)
  DASHBOARD: {
    SUMMARY: '/api/v1/analytics/summary',     // ✅ Verified: returns metrics + trends
    SENTIMENT: '/api/v1/analytics/sentiment', // ✅ Verified: returns sentiment data
  },

  // Live Monitoring
  MONITORING: {
    MENTIONS: '/api/v1/monitoring/mentions',     // ✅ Verified: social mentions
    SENTIMENT: '/api/v1/monitoring/sentiment',   // ✅ Verified: sentiment analysis
    TRENDS: '/api/v1/monitoring/trends',         // ✅ Verified: trending topics
  },

  // War Room (Campaigns)
  CAMPAIGNS: {
    META: '/api/v1/campaigns/meta',           // ✅ Verified: Meta/Facebook campaigns
    GOOGLE: '/api/v1/campaigns/google',       // ✅ Verified: Google Ads campaigns
    INSIGHTS: '/api/v1/campaigns/insights',   // ✅ Verified: unified campaign insights
  },

  // Intelligence
  INTELLIGENCE: {
    CHAT_MESSAGE: '/api/v1/intelligence/chat/message',     // ✅ Updated path structure
    CHAT_HISTORY: '/api/v1/intelligence/chat/history',     // ✅ Updated path structure
    DOCUMENT_UPLOAD: '/api/v1/intelligence/documents/upload', // ✅ Updated path structure
  },

  // Alert Center
  ALERTS: {
    CRISIS: '/api/v1/alerting/crisis',        // ✅ Verified: crisis detection
    QUEUE: '/api/v1/alerting/queue',          // ✅ Verified: alert queue
    SEND: '/api/v1/alerting/send',            // ✅ Verified: send alerts
  },
} as const;

/**
 * Component Names - For dynamic imports and references
 * ✅ Updated to match current page structure
 */
export const COMPONENT_NAMES = {
  DASHBOARD: 'Dashboard',                     // ✅ Updated: main dashboard component
  LIVE_MONITORING: 'RealTimeMonitoring',     // ✅ Keep: file still named RealTimeMonitoring
  WAR_ROOM: 'CampaignControl',               // ✅ Keep: file still named CampaignControl
  INTELLIGENCE: 'IntelligenceHub',           // ✅ Keep: file still named IntelligenceHub
  ALERT_CENTER: 'AlertCenter',               // ✅ Keep: unchanged
} as const;

/**
 * Theme/Section Names - For styling consistency
 */
export const SECTION_THEMES = {
  COMMAND_CENTER: 'dashboard', // Historical theme name
  REAL_TIME_MONITORING: 'monitoring',
  CAMPAIGN_CONTROL: 'campaign',
  INTELLIGENCE_HUB: 'intelligence',
  ALERT_CENTER: 'alerts',
} as const;

/**
 * DEPRECATED - Old naming to be phased out
 * Keep for migration reference only
 */
export const DEPRECATED_NAMES = {
  'Command Center': 'Use Dashboard instead',              // ❌ Old docs used this
  'Real-Time Monitoring': 'Use Live Monitoring instead', // ❌ Old docs used this
  'Campaign Control': 'Use War Room instead',            // ❌ Old docs used this
  'Intelligence Hub': 'Use Intelligence instead',        // ❌ Old docs used this
  'Notification Center': 'Use Alert Center instead',     // ❌ Never implemented
  'Campaign Management': 'Use War Room instead',         // ❌ Never implemented
} as const;

/**
 * Helper function to check for deprecated naming
 */
export function checkDeprecatedNaming(text: string): string | null {
  for (const [deprecated, suggestion] of Object.entries(DEPRECATED_NAMES)) {
    if (text.includes(deprecated)) {
      return `Found deprecated term "${deprecated}". ${suggestion}`;
    }
  }
  return null;
}

// Type exports for TypeScript
export type PageName = (typeof PAGE_NAMES)[keyof typeof PAGE_NAMES];
export type NavLabel = (typeof NAV_LABELS)[keyof typeof NAV_LABELS];
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
export type ComponentName = (typeof COMPONENT_NAMES)[keyof typeof COMPONENT_NAMES];
