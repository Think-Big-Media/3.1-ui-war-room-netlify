/**
 * Animation helpers to replace Framer Motion
 * Uses CSS animations for better performance
 */
import React from 'react';

export const animationVariants = {
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  scaleIn: 'animate-scaleIn',
  slideInRight: 'animate-slideInRight',
  slideInLeft: 'animate-slideInLeft',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
};

export const staggerChildren = (baseClass: string, index: number): string => {
  const delay = index * 0.05;
  return `${baseClass} opacity-0 animate-[fadeIn_0.3s_ease-out_${delay}s_forwards]`;
};

export const whileHover = (baseClass: string): string => {
  return `${baseClass} hover:scale-105 transition-transform duration-200`;
};

export const whileTap = (baseClass: string): string => {
  return `${baseClass} active:scale-95 transition-transform duration-100`;
};

// AnimatedDiv component temporarily commented out due to TypeScript parsing issues
// export const AnimatedDiv = ({
//   className = '',
//   animation = 'fadeIn',
//   children,
//   ...props
// }: {
//   className?: string;
//   animation?: keyof typeof animationVariants;
//   children: React.ReactNode;
//   [key: string]: any;
// }) => {
//   return (
//     <div className={`${animationVariants[animation]} ${className}`} {...props}>
//       {children}
//     </div>
//   );
// };
