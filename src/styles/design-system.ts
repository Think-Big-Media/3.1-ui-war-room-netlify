/**
 * War Room Design System
 * CleanMyMac-inspired professional aesthetic with modern design principles
 */

// Base unit: 4px grid system for consistent spacing
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  '4xl': '3rem', // 48px
  '5xl': '4rem', // 64px
  '6xl': '6rem', // 96px
} as const;

// Professional color palette
export const colors = {
  // Neutral grays - foundation colors
  gray: {
    50: '#F9FAFB', // Near white
    100: '#F3F4F6', // Light background
    200: '#E5E7EB', // Border light
    300: '#D1D5DB', // Border
    400: '#9CA3AF', // Text light
    500: '#6B7280', // Text medium
    600: '#4B5563', // Text
    700: '#374151', // Text dark
    800: '#1F2937', // Background dark
    900: '#111827', // Near black
  },

  // Accent blues - primary brand color
  blue: {
    50: '#EFF6FF', // Light blue background
    100: '#DBEAFE', // Light blue
    200: '#BFDBFE', // Medium light
    300: '#93C5FD', // Medium
    400: '#60A5FA', // Medium dark
    500: '#3B82F6', // Primary blue
    600: '#2563EB', // Dark blue
    700: '#1D4ED8', // Darker blue
    800: '#1E40AF', // Very dark
    900: '#1E3A8A', // Navy
  },

  // Status colors
  status: {
    success: {
      light: '#DCFCE7', // Green 100
      medium: '#16A34A', // Green 600
      dark: '#15803D', // Green 700
    },
    warning: {
      light: '#FEF3C7', // Amber 100
      medium: '#D97706', // Amber 600
      dark: '#B45309', // Amber 700
    },
    error: {
      light: '#FEE2E2', // Red 100
      medium: '#DC2626', // Red 600
      dark: '#B91C1C', // Red 700
    },
    info: {
      light: '#DBEAFE', // Blue 100
      medium: '#2563EB', // Blue 600
      dark: '#1D4ED8', // Blue 700
    },
  },
} as const;

// Typography scale - Clean, readable hierarchy
export const typography = {
  fontFamily: {
    sans: [
      'SF Pro Display',
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
    mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }], // 48px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// Border radius system
export const borderRadius = {
  none: '0px',
  sm: '0.125rem', // 2px
  md: '0.25rem', // 4px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px', // Fully rounded
} as const;

// Professional shadow system
export const shadows = {
  // Subtle elevation for cards
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  // Medium elevation for modals
  modal: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  // High elevation for dropdowns
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  // Focus states
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  // Inner shadow for inputs
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

// Animation system
export const animations = {
  // Duration scale
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common transitions
  transition: {
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors:
      'color 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Component size variants
export const sizes = {
  sm: {
    padding: spacing.md,
    text: typography.fontSize.sm,
    height: '2rem', // 32px
  },
  md: {
    padding: spacing.lg,
    text: typography.fontSize.base,
    height: '2.5rem', // 40px
  },
  lg: {
    padding: spacing.xl,
    text: typography.fontSize.lg,
    height: '3rem', // 48px
  },
} as const;

// Layout constants
export const layout = {
  // Container max widths
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Breakpoints (matches Tailwind)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Common component dimensions
  sidebar: '16rem', // 256px
  header: '4rem', // 64px
  card: {
    minHeight: '8rem', // 128px
    padding: spacing['2xl'],
  },
} as const;

// Utility type for design system values
export type SpacingKey = keyof typeof spacing;
export type ColorKey = keyof typeof colors;
export type TypographyKey = keyof typeof typography.fontSize;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
export type SizeKey = keyof typeof sizes;
