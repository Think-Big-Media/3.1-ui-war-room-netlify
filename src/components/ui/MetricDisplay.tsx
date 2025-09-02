/**
 * MetricDisplay Component - CleanMyMac-inspired metric presentation
 * Professional metric display with clean typography and visual hierarchy
 */

import type React from 'react';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MetricCard, CardHeader, CardContent } from './card';

const metricDisplayVariants = cva('', {
  variants: {
    size: {
      sm: 'space-y-2',
      md: 'space-y-3',
      lg: 'space-y-4',
    },
    layout: {
      vertical: 'flex flex-col',
      horizontal: 'flex items-center justify-between',
    },
  },
  defaultVariants: {
    size: 'md',
    layout: 'vertical',
  },
});

const metricValueVariants = cva('font-bold text-gray-900 tracking-tight', {
  variants: {
    size: {
      sm: 'text-xl',
      md: 'text-2xl',
      lg: 'text-4xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const metricLabelVariants = cva('font-medium text-gray-600', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Format utility functions
const formatValue = (
  value: string | number,
  format?: 'number' | 'currency' | 'percentage' | 'bytes'
): string => {
  if (typeof value === 'string') {
    return value;
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(value));

    case 'percentage':
      return `${value}%`;

    case 'bytes':
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      if (value === 0) {
        return '0 B';
      }
      const i = Math.floor(Math.log(value) / Math.log(1024));
      return `${(value / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;

    case 'number':
    default:
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }).format(value);
  }
};

// Trend indicator component
interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  change?: number;
  size?: 'sm' | 'md' | 'lg';
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend, change, size = 'md' }) => {
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
  };

  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-1.5 px-2 py-1 rounded-full border',
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn(iconSize[size], config.color)} />
      {change !== undefined && (
        <span className={cn('font-semibold', textSize[size], config.color)}>
          {Math.abs(change)}%
        </span>
      )}
    </div>
  );
};

// Sparkline component for trend visualization
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#60A5FA', // Intelligence Blue from design tokens
  width = 80,
  height = 32,
}) => {
  if (!data || data.length < 2) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = range === 0 ? height / 2 : height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#sparkline-gradient)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Main MetricDisplay component
export interface MetricDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricDisplayVariants> {
  className?: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  format?: 'number' | 'currency' | 'percentage' | 'bytes';
  sparklineData?: number[];
  subtitle?: string;
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  loading?: boolean;
  interactive?: boolean;
  onAction?: () => void;
}

const MetricDisplay = forwardRef<HTMLDivElement, MetricDisplayProps>(
  (
    {
      className,
      label,
      value,
      change,
      trend,
      icon: Icon,
      format = 'number',
      sparklineData,
      subtitle,
      accent = 'blue',
      loading = false,
      interactive = false,
      onAction,
      size,
      layout,
      ...props
    },
    ref
  ) => {
    if (loading) {
      return (
        <MetricCard ref={ref} className={cn('animate-pulse', className)} accent={accent} {...props}>
          <CardHeader size="sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          </CardHeader>
        </MetricCard>
      );
    }

    return (
      <MetricCard
        ref={ref}
        className={cn(className)}
        accent={accent}
        interactive={interactive}
        onClick={onAction}
        {...props}
      >
        <CardHeader size="sm">
          <div className={cn(metricDisplayVariants({ size, layout }))}>
            {/* Header with icon and actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {Icon && (
                  <div
                    className={cn(
                      'rounded-lg p-2 bg-gradient-to-br',
                      {
                        blue: 'from-blue-500 to-blue-600',
                        green: 'from-green-500 to-green-600',
                        orange: 'from-orange-500 to-orange-600',
                        red: 'from-red-500 to-red-600',
                        purple: 'from-purple-500 to-purple-600',
                      }[accent]
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}

                <div>
                  <p className={cn(metricLabelVariants({ size }))}>{label}</p>
                  {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
              </div>

              {/* Trend indicator */}
              {trend && <TrendIndicator trend={trend} change={change} size={size || undefined} />}

              {/* Action menu */}
              {onAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Value display */}
            <div className="space-y-2">
              <p className={cn(metricValueVariants({ size }))}>{formatValue(value, format)}</p>

              {/* Sparkline */}
              {sparklineData && sparklineData.length > 1 && (
                <div className="flex justify-start">
                  <Sparkline
                    data={sparklineData}
                    color={
                      {
                        blue: '#3B82F6',
                        green: '#10B981',
                        orange: '#F59E0B',
                        red: '#EF4444',
                        purple: '#8B5CF6',
                      }[accent]
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </MetricCard>
    );
  }
);

MetricDisplay.displayName = 'MetricDisplay';

// Grid layout for multiple metrics
export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MetricGrid: React.FC<MetricGridProps> = ({
  children,
  columns = 4,
  gap = 'md',
  className,
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', gridClasses[columns], gapClasses[gap], className)}>{children}</div>
  );
};

export { MetricDisplay, MetricGrid, TrendIndicator, Sparkline };
