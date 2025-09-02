import React from 'react';
import { COLORS } from '../../constants/colors';
import LoadingSpinner from './LoadingSpinner';

interface MetricValueProps {
  value: number | string | null | undefined;
  format?: 'number' | 'percentage' | 'currency' | 'compact';
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  color?: 'positive' | 'negative' | 'neutral' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

/**
 * Standardized metric value display component
 * Handles formatting, loading states, and color coding
 */
export const MetricValue: React.FC<MetricValueProps> = React.memo(
  ({
    value,
    format = 'number',
    prefix = '',
    suffix = '',
    loading = false,
    color = 'primary',
    size = 'md',
    className = '',
  }) => {
    // Size classes
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    };

    // Color classes based on sentiment or metric type
    const colorClasses = {
      positive: `text-${COLORS.sentiment.positive}`,
      negative: `text-${COLORS.sentiment.negative}`,
      neutral: `text-${COLORS.sentiment.neutral}`,
      primary: `text-${COLORS.metrics.primary}`,
      secondary: `text-${COLORS.metrics.secondary}`,
    };

    // Format the value based on type
    const formatValue = (val: number | string | null | undefined): string => {
      if (val === null || val === undefined) return '--';

      const numVal = typeof val === 'string' ? parseFloat(val) : val;

      if (isNaN(numVal)) return String(val);

      switch (format) {
        case 'percentage':
          return `${numVal > 0 ? '+' : ''}${numVal.toFixed(1)}%`;

        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(numVal);

        case 'compact':
          if (numVal >= 1000000) {
            return `${(numVal / 1000000).toFixed(1)}M`;
          } else if (numVal >= 1000) {
            return `${(numVal / 1000).toFixed(1)}K`;
          }
          return numVal.toLocaleString();

        case 'number':
        default:
          return numVal.toLocaleString();
      }
    };

    if (loading) {
      return (
        <div className={`${sizeClasses[size]} ${className}`}>
          <LoadingSpinner size="sm" color="current" />
        </div>
      );
    }

    return (
      <span
        className={`
      font-bold 
      ${sizeClasses[size]} 
      ${colorClasses[color]}
      ${className}
    `}
      >
        {prefix}
        {formatValue(value)}
        {suffix}
      </span>
    );
  }
);

MetricValue.displayName = 'MetricValue';

export default MetricValue;
