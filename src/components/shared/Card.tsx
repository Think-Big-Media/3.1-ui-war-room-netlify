/**
 * Performance-optimized Card component
 * Replaces Framer Motion with CSS animations (saves ~300kb bundle size)
 * Uses React.memo for performance optimization
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
  style?: React.CSSProperties;
  hover?: boolean;
  animate?: boolean;
}

const Card: React.FC<CardProps> = memo(
  ({
    children,
    className = '',
    padding = 'md',
    variant = 'default',
    onClick,
    style,
    hover = true,
    animate = true,
  }) => {
    const location = useLocation();

    // Memoize style calculation to prevent re-renders
    const cardStyle = useMemo(() => {
      const routeAccent = getRouteAccent(location.pathname);
      return {
        '--page-accent': routeAccent,
        ...style,
      } as React.CSSProperties;
    }, [location.pathname, style]);

    // Memoize class names to prevent re-calculation
    const cardClasses = useMemo(() => {
      const baseClasses = ['rounded-lg backdrop-blur-md border transition-all duration-400'];

      // Add animation classes for luxurious feel
      if (animate) {
        baseClasses.push('fade-in cards-stagger');
      }

      if (hover && onClick) {
        baseClasses.push('scale-hover cursor-pointer hover:shadow-2xl hover:shadow-white/5');
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

      if (className) {
        baseClasses.push(className);
      }

      return baseClasses.join(' ');
    }, [className, padding, variant, onClick, hover, animate]);

    return (
      <div className={cardClasses} style={cardStyle} onClick={onClick}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
