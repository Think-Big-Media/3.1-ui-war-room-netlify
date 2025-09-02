/**
 * Animation configuration constants for War Room
 */

export const ANIMATION_CONFIGS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  slideIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  stagger: {
    transition: { staggerChildren: 0.05 },
  },
  card: {
    whileHover: { scale: 1.01, transition: { duration: 0.15 } },
    whileTap: { scale: 0.99 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};
