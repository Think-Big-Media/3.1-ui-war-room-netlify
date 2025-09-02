/**
 * Event attendance chart component.
 * Bar chart showing attendance across different event types.
 */
import type React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGetEventChartQuery } from '../../services/analyticsApi';
import { useAppSelector } from '../../hooks/redux';
import { type DateRangeEnum } from '../../types/analytics';
import { Loader2 } from 'lucide-react';

// Color palette for bars
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const EventAttendanceChart: React.FC = () => {
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { data, isLoading, error } = useGetEventChartQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Unable to load event data</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.labels.map((label: string, index: number) => ({
    name: label,
    attendance: data.datasets[0]?.data[index] || 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">Attendance: {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text x={x + width / 2} y={y - 5} fill="#6B7280" textAnchor="middle" fontSize={12}>
        {value}
      </text>
    );
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Bar dataKey="attendance" radius={[8, 8, 0, 0]} label={renderCustomLabel}>
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
