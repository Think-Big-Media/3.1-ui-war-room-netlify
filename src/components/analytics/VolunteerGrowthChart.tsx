/**
 * Volunteer growth chart component using Recharts.
 * Displays time-series data for volunteer metrics.
 */
import type React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useGetVolunteerChartQuery } from '../../services/analyticsApi';
import { useAppSelector } from '../../hooks/redux';
import { type DateRangeEnum } from '../../types/analytics';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const VolunteerGrowthChart: React.FC = () => {
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { data, isLoading, error } = useGetVolunteerChartQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Unable to load volunteer data</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.labels.map((label: string, index: number) => ({
    name: label,
    active: data.datasets[0]?.data[index] || 0,
    new: data.datasets[1]?.data[index] || 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
          <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="line"
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Area
            type="monotone"
            dataKey="active"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorActive)"
            name="Active Volunteers"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="new"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorNew)"
            name="New Signups"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
