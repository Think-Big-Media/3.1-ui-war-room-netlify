/**
 * Metric Card Component - CleanMyMac-inspired design
 * Professional metric display with gradients and animations
 */

import type React from 'react';
import { memo } from 'react';
import { useReducedMotion, getAnimationClass } from '../../hooks/useReducedMotion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  sparklineData?: number[];
  footer?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  format?: 'number' | 'currency' | 'percentage';
  size?: 'sm' | 'md' | 'lg';
}

const MetricCardComponent: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'blue',
  sparklineData,
  footer,
  onClick,
  loading = false,
  format = 'number',
  size = 'md',
}) => {
  const prefersReducedMotion = useReducedMotion();
  // Color schemes with gradients
  const colorSchemes = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      light: 'bg-blue-100',
      hover: 'hover:from-blue-600 hover:to-blue-700',
    },
    green: {
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      light: 'bg-emerald-100',
      hover: 'hover:from-emerald-600 hover:to-green-700',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      light: 'bg-purple-100',
      hover: 'hover:from-purple-600 hover:to-purple-700',
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      light: 'bg-orange-100',
      hover: 'hover:from-orange-600 hover:to-orange-700',
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
      light: 'bg-red-100',
      hover: 'hover:from-red-600 hover:to-red-700',
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      light: 'bg-indigo-100',
      hover: 'hover:from-indigo-600 hover:to-indigo-700',
    },
  };

  const scheme = colorSchemes[color];

  // Size variants
  const sizeClasses = {
    sm: {
      card: 'p-4',
      icon: 'w-8 h-8 p-1.5',
      iconSize: 'w-4 h-4',
      value: 'text-xl',
      title: 'text-xs',
    },
    md: {
      card: 'p-6',
      icon: 'w-12 h-12 p-2.5',
      iconSize: 'w-6 h-6',
      value: 'text-2xl',
      title: 'text-sm',
    },
    lg: {
      card: 'p-8',
      icon: 'w-16 h-16 p-3',
      iconSize: 'w-8 h-8',
      value: 'text-4xl',
      title: 'text-base',
    },
  };

  const sizeClass = sizeClasses[size];

  // Format value
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') {
      return val;
    }

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  // Sparkline component
  const Sparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    const width = 80;
    const height = 30;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="mt-2">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={scheme.text}
          opacity="0.5"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div
        className={cn(
          'relative bg-white rounded-2xl border border-gray-100 shadow-sm',
          sizeClass.card,
          'animate-pulse'
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={cn('rounded-xl bg-gray-200', sizeClass.icon)} />
          <div className="w-16 h-6 bg-gray-200 rounded" />
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl border border-gray-100 shadow-sm group overflow-hidden',
        getAnimationClass(
          prefersReducedMotion,
          'hover:shadow-xl transition-all duration-300',
          'hover:shadow-lg'
        ),
        sizeClass.card,
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-gray-50 to-transparent rounded-full opacity-50" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        {/* Icon with gradient background */}
        <div
          className={cn(
            'relative rounded-xl bg-gradient-to-br shadow-lg transform',
            getAnimationClass(
              prefersReducedMotion,
              'group-hover:scale-110 transition-transform duration-300',
              ''
            ),
            scheme.gradient,
            scheme.hover,
            sizeClass.icon
          )}
        >
          <Icon className={cn('text-white', sizeClass.iconSize)} />
          {/* Icon glow effect */}
          <div
            className={cn(
              'absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-300',
              scheme.gradient
            )}
          />
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center space-x-1 px-2.5 py-1 rounded-lg',
              trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
            )}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-gray-600" />
            )}
            <span
              className={cn(
                'text-sm font-semibold',
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              )}
            >
              {Math.abs(change)}%
            </span>
          </div>
        )}

        {/* Menu button */}
        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded-lg">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Value */}
      <div className="relative">
        <h3 className={cn('font-bold text-gray-900 mb-1', sizeClass.value)}>
          {formatValue(value)}
        </h3>
        <p className={cn('text-gray-500 font-medium', sizeClass.title)}>{title}</p>
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline data={sparklineData} />
        </div>
      )}

      {/* Footer */}
      {footer && <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div>}

      {/* Click indicator */}
      {onClick && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowUpRight className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

// Memoized version for performance optimization - prevents unnecessary re-renders
export const MetricCard = memo(MetricCardComponent);
