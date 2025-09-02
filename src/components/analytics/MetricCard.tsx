/**
 * Metric card component for dashboard overview.
 * Displays key metrics with trend indicators and mini sparklines.
 */
import type React from 'react';
import { useGetMetricCardsQuery } from '../../services/analyticsApi';
import { useAppSelector } from '../../hooks/redux';
import { type DateRangeEnum } from '../../types/analytics';
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader } from '../ui/card';

interface MetricCardProps {
  title: string;
  metric: 'volunteers' | 'events' | 'reach' | 'donations';
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  users: Users,
  calendar: Calendar,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
};

// Color mapping
const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-500',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-500',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-500',
    trend: 'text-purple-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-500',
    trend: 'text-yellow-600',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({ title, metric, icon, color }) => {
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { data, isLoading, error } = useGetMetricCardsQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  const Icon = iconMap[icon];
  const colors = colorMap[color];

  // Find the specific metric data
  const metricData = data?.find((card) => card.title.toLowerCase().includes(metric));

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('p-3 rounded-lg', colors.bg)}>
            <div className="h-6 w-6 bg-gray-300 rounded" />
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  // Error state
  if (error || !metricData) {
    return (
      <Card variant="glass-light" className="p-6">
        <div className="text-center text-gray-500">
          <Icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Unable to load metric</p>
        </div>
      </Card>
    );
  }

  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!metricData.change) {
      return <Minus className="h-4 w-4" />;
    }
    if (metricData.change > 0) {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!metricData.change) {
      return 'text-gray-500';
    }
    if (metricData.change > 0) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  // Format value based on metric type
  const formatValue = (value: number | string) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) {
      return '0';
    }
    if (metric === 'donations') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    }
    if (metric === 'reach' && numValue > 1000) {
      return `${(numValue / 1000).toFixed(1)}K`;
    }
    return numValue.toLocaleString();
  };

  // Convert trend data for mini chart (trend is a string, not an array)
  const chartData: any[] = [];

  return (
    <Card variant="glass-light" className="p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-3 rounded-lg', colors.bg)}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>

        {/* Trend indicator */}
        <div className={cn('flex items-center space-x-1', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {metricData.change ? `${Math.abs(metricData.change)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{formatValue(metricData.value)}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>

      {/* Mini sparkline */}
      {chartData.length > 0 && (
        <div className="h-12 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={
                  color === 'blue'
                    ? '#3B82F6'
                    : color === 'green'
                      ? '#10B981'
                      : color === 'purple'
                        ? '#8B5CF6'
                        : '#F59E0B'
                }
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

// Loading skeleton for metric cards
export const MetricCardSkeleton: React.FC = () => (
  <Card variant="glass-light" className="p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-200/50 rounded-lg">
        <div className="h-6 w-6 bg-gray-300/50 rounded" />
      </div>
      <div className="h-4 w-16 bg-gray-200/50 rounded" />
    </div>
    <div className="h-8 w-24 bg-gray-200/50 rounded mb-2" />
    <div className="h-4 w-32 bg-gray-200/50 rounded" />
    <div className="h-12 mt-4 bg-gray-100/50 rounded" />
  </Card>
);
