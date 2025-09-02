/**
 * Design Tokens - Brand Accent Colors
 * Step 1: Constants only, not referenced anywhere yet
 */

export const DASHBOARD_ORANGE = '#D97706';
export const LIVE_MONITORING_GREEN = '#4ade80';
export const WAR_ROOM_SALMON = '#d7484f';
export const INTELLIGENCE_BLUE = '#60A5FA';
export const ALERT_CENTER_YELLOW = '#FACC15';
export const SETTINGS_MAUVE = '#818CF8';

export const BRAND_TOKENS = {
  dashboard: DASHBOARD_ORANGE,
  liveMonitoring: LIVE_MONITORING_GREEN,
  warRoom: WAR_ROOM_SALMON,
  intelligence: INTELLIGENCE_BLUE,
  alertCenter: ALERT_CENTER_YELLOW,
  settings: SETTINGS_MAUVE,
} as const;

/**
 * Route to brand token mapping
 */
export const ROUTE_TO_BRAND_MAP = {
  '/': 'dashboard',
  '/real-time-monitoring': 'liveMonitoring',
  '/campaign-control': 'warRoom',
  '/intelligence-hub': 'intelligence',
  '/alert-center': 'alertCenter',
  '/settings': 'settings',
} as const;

/**
 * Get brand accent hex color for a given route path
 * Returns the hex color that should be used for --page-accent
 */
export function getRouteAccent(pathname: string): string {
  const routeKey = ROUTE_TO_BRAND_MAP[pathname as keyof typeof ROUTE_TO_BRAND_MAP] || 'dashboard';
  return BRAND_TOKENS[routeKey];
}

// Type for accessing brand tokens
export type BrandTokenKey = keyof typeof BRAND_TOKENS;
export type RoutePath = keyof typeof ROUTE_TO_BRAND_MAP;
