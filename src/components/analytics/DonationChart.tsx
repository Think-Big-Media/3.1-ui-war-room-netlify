/**
 * Donation breakdown chart component.
 * Pie chart showing donation sources and amounts.
 */
import type React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';
import { useGetDonationChartQuery } from '../../services/analyticsApi';
import { useAppSelector } from '../../hooks/redux';
import { type DateRangeEnum } from '../../types/analytics';
import { Loader2 } from 'lucide-react';

// Colors for pie segments
const COLORS = {
  Individual: '#3B82F6',
  Corporate: '#10B981',
  PAC: '#F59E0B',
  Events: '#EF4444',
  Other: '#8B5CF6',
};

export const DonationChart: React.FC = () => {
  const dateRange = useAppSelector((state) => state.analytics.dateRange);
  const { data, isLoading, error } = useGetDonationChartQuery({
    dateRange: dateRange as DateRangeEnum,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Unable to load donation data</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.labels.map((label: string, index: number) => ({
    name: label,
    value: data.datasets[0]?.data[index] || 0,
    color: COLORS[label as keyof typeof COLORS] || COLORS.Other,
  }));

  // Calculate total
  const total = chartData.reduce((sum: number, entry: { value: number }) => sum + entry.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    if (percent < 0.05) {
      return null;
    } // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry: { color: string }, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <Label
              value={`$${(total / 1000).toFixed(0)}K`}
              position="center"
              style={{ fontSize: '24px', fontWeight: 'bold' }}
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
