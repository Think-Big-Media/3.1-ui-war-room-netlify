import type React from 'react';
import { AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Card from '../shared/Card';
import { type Alert } from '../../types/alert';

interface AlertSummaryProps {
  alerts: Alert[];
}

const AlertSummary: React.FC<AlertSummaryProps> = ({ alerts }) => {
  const criticalCount = alerts.filter(
    (a) => a.priority === 'critical' && a.status !== 'resolved'
  ).length;
  const newCount = alerts.filter((a) => a.status === 'new').length;
  const inProgressCount = alerts.filter((a) => a.status === 'in-progress').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const summaryItems = [
    {
      label: 'Critical Alerts',
      value: criticalCount,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      label: 'New Alerts',
      value: newCount,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      label: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
  ];

  return (
    <Card padding="sm" variant="glass">
      <h3 className="text-xl font-semibold text-white/40 tracking-wide font-barlow-condensed mb-4">
        QUICK STATS
      </h3>
      <div className="space-y-3">
        {summaryItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-white/70 text-sm">{item.label}</span>
            </div>
            <span className="text-white/95 font-semibold text-lg">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AlertSummary;
