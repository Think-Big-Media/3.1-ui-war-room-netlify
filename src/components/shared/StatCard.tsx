import type React from 'react';
import { memo } from 'react';
import { type LucideIcon } from 'lucide-react';
import Card from './Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatCardComponent: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  color = 'blue',
  size = 'md',
  className,
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  };

  const sizeClasses = {
    sm: {
      padding: 'p-4',
      valueText: 'text-2xl',
      labelText: 'text-xs',
      iconSize: 'w-4 h-4',
    },
    md: {
      padding: 'p-6',
      valueText: 'text-3xl',
      labelText: 'text-sm',
      iconSize: 'w-5 h-5',
    },
    lg: {
      padding: 'p-8',
      valueText: 'text-4xl',
      labelText: 'text-base',
      iconSize: 'w-6 h-6',
    },
  };

  const { padding, valueText, labelText, iconSize } = sizeClasses[size];

  return (
    <Card
      variant="glass"
      padding="none"
      className={cn('bg-gradient-to-br border', colorClasses[color], padding, className)}
    >
      <div className="flex flex-col gap-3">
        {Icon && (
          <div className="self-start">
            <Icon className={cn('text-white/70', iconSize)} />
          </div>
        )}

        <div>
          <p className={cn('text-white/70 font-medium uppercase tracking-wide', labelText)}>
            {label}
          </p>
          <p className={cn('font-bold text-white/95 mt-1', valueText)}>{value}</p>
          {subValue && <p className="text-sm text-white/60 mt-1">{subValue}</p>}
        </div>
      </div>
    </Card>
  );
};

// Memoized version for performance optimization
const StatCard = memo(StatCardComponent);
export default StatCard;
