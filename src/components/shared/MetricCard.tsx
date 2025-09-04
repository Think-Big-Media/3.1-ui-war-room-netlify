import type React from 'react';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-white/70',
  trend,
  className,
}) => {
  // Determine trend if not provided
  const calculatedTrend =
    trend || (change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral');

  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    switch (calculatedTrend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card variant="glass" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/70 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white/95 mt-2">{value}</p>

          {change !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className={cn('flex items-center gap-1', getTrendColor())}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {change > 0 ? '+' : ''}
                  {change}%
                </span>
              </div>
              {changeLabel && <span className="text-xs text-white/60">{changeLabel}</span>}
            </div>
          )}
        </div>

        <div
          className={cn(
            'p-3 rounded-xl bg-white/10 backdrop-blur-sm transition-transform hover:scale-110',
            iconColor
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

export default MetricCard;
