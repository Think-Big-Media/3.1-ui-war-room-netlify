import type React from 'react';
import { Bell, TrendingUp, MessageSquare, Brain } from 'lucide-react';
import Card from '../shared/Card';

interface PoliticalMetricsProps {
  className?: string;
}

interface MetricData {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PoliticalMetrics: React.FC<PoliticalMetricsProps> = ({ className = '' }) => {
  const metrics: MetricData[] = [
    {
      label: 'Real-Time Alerts',
      value: '7',
      color: 'text-red-400',
      icon: Bell,
    },
    {
      label: 'Ad Spend',
      value: '$47.2K',
      color: 'text-blue-400',
      icon: TrendingUp,
    },
    {
      label: 'Mention Volume',
      value: '2,847',
      color: 'text-emerald-400',
      icon: MessageSquare,
    },
    {
      label: 'Sentiment Score',
      value: '74%',
      color: 'text-emerald-400',
      icon: Brain,
    },
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Card key={index} className="hoverable text-center" padding="md" variant="glass">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-black/20 rounded-lg border border-white/20">
              <metric.icon className="w-6 h-6 text-white/80" />
            </div>
            <div className={`text-2xl lg:text-3xl font-bold font-condensed ${metric.color}`}>
              {metric.value}
            </div>
            <div className="text-xs text-white/60 uppercase font-mono tracking-wide text-center leading-tight">
              {metric.label.split(' ').map((word, i) => (
                <div key={i}>{word}</div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PoliticalMetrics;
