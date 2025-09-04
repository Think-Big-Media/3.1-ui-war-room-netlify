import clsx from 'clsx';
import { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Page-specific theme gradients from THEME_CONSTANTS.md
export const pageGradients = {
  dashboard: 'from-purple-600 via-purple-700 to-indigo-800',
  cia: 'from-blue-600 via-blue-700 to-blue-800',
  campaign: 'from-green-600 via-green-700 to-green-800',
  contentCalendar: 'from-orange-600 via-orange-700 to-orange-800',
  contentEngine: 'from-indigo-600 via-indigo-700 to-indigo-800',
  performance: 'from-red-600 via-red-700 to-red-800',
  settings: 'from-slate-600 via-slate-700 to-slate-800',
};

// Global card styles with perfect shadow treatment
export const glassCardStyles = 'bg-black/15 backdrop-blur-lg rounded-2xl border border-white/20';

// Global card shadow - subtle and tighter, 50% reduced distance
export const perfectCardShadow =
  '0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)';

// Combined glass card with perfect shadow - USE THIS FOR ALL CARDS
export const perfectGlassCard = `${glassCardStyles}`;

// Utility function to apply perfect shadow to any element
export const applyPerfectShadow = (element: HTMLElement | null) => {
  if (element) {
    element.style.boxShadow = perfectCardShadow;
  }
};

// Card styles with perfect shadow applied via style attribute
export const getCardWithPerfectShadow = () => ({
  className: glassCardStyles,
  style: { boxShadow: perfectCardShadow },
});

// Fire accent gradient overlay
export const fireAccentOverlay =
  'bg-gradient-to-tr from-orange-500/20 via-transparent to-red-500/10';
