import React from 'react';
import { COLORS } from '../../constants/colors';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'current';
  text?: string;
  className?: string;
}

/**
 * Reusable loading spinner component
 * Consistent loading states across the application
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({ size = 'md', color = 'primary', text, className = '' }) => {
    const sizeClasses = {
      sm: 'w-3 h-3 border-2',
      md: 'w-4 h-4 border-2',
      lg: 'w-6 h-6 border-3',
    };

    const colorClasses = {
      primary: `border-${COLORS.metrics.primary}`,
      secondary: `border-${COLORS.metrics.secondary}`,
      white: 'border-white',
      current: 'border-current',
    };

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
        />
        {text && <span className="text-xs text-white/60">{text}</span>}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
