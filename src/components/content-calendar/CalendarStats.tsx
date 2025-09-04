import type React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import Card from '../shared/Card';

interface CalendarStatsProps {
  totalPosts: number;
  scheduled: number;
  published: number;
  engagement: number;
}

const CalendarStats: React.FC<CalendarStatsProps> = ({
  totalPosts,
  scheduled,
  published,
  engagement,
}) => {
  const stats = [
    {
      icon: Calendar,
      label: 'This Week',
      value: totalPosts,
      subtext: 'posts planned',
      color: 'text-blue-300',
    },
    {
      icon: Clock,
      label: 'Scheduled',
      value: scheduled,
      subtext: 'ready to go',
      color: 'text-yellow-300',
    },
    {
      icon: CheckCircle,
      label: 'Published',
      value: published,
      subtext: 'this week',
      color: 'text-green-300',
    },
    {
      icon: TrendingUp,
      label: 'Engagement',
      value: `${engagement}%`,
      subtext: '+5% avg rate',
      color: 'text-orange-300',
      trend: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-6"
    >
      <Card padding="md" variant="glass">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-white/70 text-sm mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-white/60 text-xs mt-1">
                {stat.trend ? (
                  <span className="text-green-400 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.subtext}
                  </span>
                ) : (
                  stat.subtext
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default CalendarStats;
