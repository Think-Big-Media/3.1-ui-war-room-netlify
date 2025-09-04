/**
 * Dynamic Section Theming System
 * Provides consistent color theming based on current route/section
 * Uses design tokens from tokens/colors.ts
 */

import { BRAND_TOKENS, getRouteAccent } from '../tokens/colors';

export interface SectionTheme {
  name: string;
  pageAccent: string; // CSS variable value for --page-accent
  accentKey: keyof typeof BRAND_TOKENS; // Design token key
}

export const SECTION_THEMES: Record<string, SectionTheme> = {
  dashboard: {
    name: 'Dashboard',
    pageAccent: BRAND_TOKENS.dashboard,
    accentKey: 'dashboard',
  },
  monitoring: {
    name: 'Live Monitoring',
    pageAccent: BRAND_TOKENS.liveMonitoring,
    accentKey: 'liveMonitoring',
  },
  warroom: {
    name: 'War Room',
    pageAccent: BRAND_TOKENS.warRoom,
    accentKey: 'warRoom',
  },
  intelligence: {
    name: 'Intelligence',
    pageAccent: BRAND_TOKENS.intelligence,
    accentKey: 'intelligence',
  },
  alerts: {
    name: 'Alert Center',
    pageAccent: BRAND_TOKENS.alertCenter,
    accentKey: 'alertCenter',
  },
  settings: {
    name: 'Settings',
    pageAccent: BRAND_TOKENS.settings,
    accentKey: 'settings',
  },
};

/**
 * Get the theme for the current route/pathname
 */
export function getSectionTheme(pathname: string): SectionTheme {
  // Route to theme mapping
  if (pathname === '/') return SECTION_THEMES.dashboard;
  if (pathname.startsWith('/real-time-monitoring')) return SECTION_THEMES.monitoring;
  if (pathname.startsWith('/campaign-control')) return SECTION_THEMES.warroom;
  if (pathname.startsWith('/intelligence-hub')) return SECTION_THEMES.intelligence;
  if (pathname.startsWith('/alert-center')) return SECTION_THEMES.alerts;
  if (pathname.startsWith('/settings')) return SECTION_THEMES.settings;

  // Default to dashboard theme
  return SECTION_THEMES.dashboard;
}

/**
 * Get CSS classes for navigation active state based on theme
 * Uses CSS variables for dynamic theming
 */
export function getNavActiveClasses(theme: SectionTheme): string {
  return `nav-active-bg text-white font-semibold border border-white/20`;
}

/**
 * Get CSS classes for navigation icon active state based on theme
 * Uses CSS variables for dynamic theming
 */
export function getNavIconActiveClasses(theme: SectionTheme): string {
  return `nav-active-icon`;
}

/**
 * Get CSS classes for navigation hover state based on theme
 * Uses CSS custom properties for consistency
 */
export function getNavHoverClasses(theme: SectionTheme): string {
  return `nav-hover-text`;
}

/**
 * Get CSS classes for navigation icon hover state based on theme
 */
export function getNavIconHoverClasses(theme: SectionTheme): string {
  return `nav-hover-icon`;
}

/**
 * Get the page accent color for setting CSS variables
 */
export function getPageAccentColor(pathname: string): string {
  return getRouteAccent(pathname);
}

/**
 * React hook for getting current section theme
 */
export function useSectionTheme(pathname: string) {
  const theme = getSectionTheme(pathname);

  return {
    theme,
    navActiveClasses: getNavActiveClasses(theme),
    pageAccentColor: getPageAccentColor(pathname),
  };
}
