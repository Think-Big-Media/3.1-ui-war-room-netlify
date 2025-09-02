/**
 * Generic dashboard chart component that supports multiple chart types.
 * Can render line, bar, and area charts with configurable data keys and colors.
 */
import type React from 'react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export interface DashboardChartProps {
  title: string;
  data: any[];
  dataKeys: string[];
  colors: readonly string[];
  type?: 'line' | 'bar' | 'area';
  loading?: boolean;
  height?: number;
  yAxisFormatter?: (value: number) => string;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({
  title,
  data,
  dataKeys,
  colors,
  type = 'line',
  loading = false,
  height = 300,
  yAxisFormatter,
}) => {
  const [activeType, setActiveType] = useState<'line' | 'bar' | 'area'>(type);

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div
          className="bg-gray-200 rounded animate-pulse"
          style={{ height: `${height}px` }}
          data-testid="chart-skeleton"
        />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex space-x-2">{renderChartTypeButtons()}</div>
        </div>
        <div
          className="flex flex-col items-center justify-center text-gray-500"
          style={{ height: `${height}px` }}
        >
          <Activity className="h-12 w-12 mb-4 text-gray-400" />
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Data will appear here once available</p>
        </div>
      </div>
    );
  }

  // Chart type buttons
  function renderChartTypeButtons() {
    const buttons = [
      { type: 'line' as const, icon: TrendingUp, label: 'Line' },
      { type: 'bar' as const, icon: BarChart3, label: 'Bar' },
      { type: 'area' as const, icon: Activity, label: 'Area' },
    ];

    return buttons.map(({ type, icon: Icon, label }) => (
      <button
        key={type}
        onClick={() => setActiveType(type)}
        className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          activeType === type
            ? 'bg-primary text-primary-foreground'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        aria-label={`Switch to ${label} chart`}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </button>
    ));
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{' '}
              {yAxisFormatter ? yAxisFormatter(entry.value) : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render chart based on type
  function renderChart() {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    const axisProps = {
      stroke: '#6B7280',
      fontSize: 12,
      tickLine: false,
    };

    switch (activeType) {
      case 'line':
        return (
          <LineChart {...commonProps} data-testid="line-chart">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index] || '#3B82F6'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                data-testid="line"
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps} data-testid="bar-chart">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index] || '#3B82F6'}
                radius={[2, 2, 0, 0]}
                data-testid="bar"
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps} data-testid="area-chart">
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index] || '#3B82F6'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors[index] || '#3B82F6'} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index] || '#3B82F6'}
                strokeWidth={2}
                fill={`url(#color-${key})`}
                fillOpacity={1}
                data-testid="area"
              />
            ))}
          </AreaChart>
        );

      default:
        return <div />;
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-2">{renderChartTypeButtons()}</div>
      </div>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
