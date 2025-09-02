import type React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

const PerformanceMetrics: React.FC = () => {
  const metrics: MetricItem[] = [
    {
      label: 'Alert Response',
      value: '45s',
      change: 12,
      trend: 'up',
    },
    {
      label: 'Campaign ROI',
      value: '3.2x',
      change: 8,
      trend: 'up',
    },
    {
      label: 'Threat Score',
      value: '32',
      change: -5,
      trend: 'down',
    },
    {
      label: 'Voter Rate',
      value: '67%',
      change: 0,
      trend: 'neutral',
    },
    {
      label: 'Media Reach',
      value: '2.4M',
      change: 23,
      trend: 'up',
    },
    {
      label: 'Sentiment',
      value: '+18',
      change: 3,
      trend: 'up',
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatChange = (change: number, trend: string) => {
    if (trend === 'neutral') return '0%';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  return (
    <div className="bg-black/20 rounded-2xl border border-[#8B956D]/30 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-[#E8E4D0] mb-6 tracking-wide">
        PERFORMANCE METRICS
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-sm text-[#C5C1A8] mb-1 font-medium">{metric.label}</div>
            <div className="text-3xl font-bold text-[#E8E4D0] mb-2">{metric.value}</div>
            <div
              className={`flex items-center justify-center space-x-1 text-sm ${getTrendColor(metric.trend)}`}
            >
              {getTrendIcon(metric.trend)}
              <span>{formatChange(metric.change, metric.trend)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetrics;
