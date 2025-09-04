/**
 * Performance-optimized Card component
 * Replaces Framer Motion with CSS animations
 * Reduces bundle size and improves performance
 */

import type React from 'react';
import { memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteAccent } from '../../tokens/colors';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'solid';
  onClick?: () => void;
  hover?: boolean;
  initial?: boolean; // For fade-in animation
}

const Card: React.FC<CardProps> = memo(
  ({
    children,
    className = '',
    padding = 'md',
    variant = 'default',
    onClick,
    hover = true,
    initial = true,
  }) => {
    const location = useLocation();

    // Memoize style calculation to prevent re-renders
    const style = useMemo(() => {
      const routeAccent = getRouteAccent(location.pathname);
      return { '--page-accent': routeAccent } as React.CSSProperties;
    }, [location.pathname]);

    // Memoize class names to prevent re-calculation
    const cardClasses = useMemo(() => {
      const baseClasses = ['rounded-lg backdrop-blur-md border transition-all duration-200'];

      // Add animation classes
      if (initial) {
        baseClasses.push('fade-in');
      }

      if (hover && onClick) {
        baseClasses.push('scale-hover cursor-pointer');
      }

      // Variant styles
      switch (variant) {
        case 'glass':
          baseClasses.push('bg-white/10 border-white/20');
          break;
        case 'solid':
          baseClasses.push('bg-slate-800 border-slate-700');
          break;
        default:
          baseClasses.push('bg-black/20 border-white/15');
      }

      // Padding styles
      switch (padding) {
        case 'none':
          break;
        case 'sm':
          baseClasses.push('p-3');
          break;
        case 'md':
          baseClasses.push('p-4');
          break;
        case 'lg':
          baseClasses.push('p-6');
          break;
      }

      baseClasses.push(className);
      return baseClasses.join(' ');
    }, [className, padding, variant, onClick, hover, initial]);

    return (
      <div className={cardClasses} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
