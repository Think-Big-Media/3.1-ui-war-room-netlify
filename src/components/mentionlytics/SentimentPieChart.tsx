import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { MentionlyticsData } from '../../services/mentionlytics';
import { useDataMode } from '../../hooks/useDataMode';

interface SentimentPieChartProps {
  data: MentionlyticsData | null;
}

export const SentimentPieChart: React.FC<SentimentPieChartProps> = ({ data }) => {
  const { isLive } = useDataMode();

  const sentimentData = [
    {
      name: 'Positive',
      value: data?.sentiment?.positive || 67,
      color: '#10B981',
    },
    {
      name: 'Neutral',
      value: data?.sentiment?.neutral || 23,
      color: '#6B7280',
    },
    {
      name: 'Negative',
      value: data?.sentiment?.negative || 10,
      color: '#EF4444',
    },
  ];

  const total = sentimentData.reduce((sum, entry) => sum + entry.value, 0);
  const positiveScore = Math.round((sentimentData[0].value / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-barlow font-semibold text-white text-xs">Sentiment</h4>
        {!isLive && (
          <span className="text-[8px] text-yellow-400 uppercase font-jetbrains">Mock</span>
        )}
      </div>

      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sentimentData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value}%`, '']}
              labelStyle={{ color: '#000' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center score */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400 font-jetbrains">+{positiveScore}</div>
            <div className="text-[8px] text-white/60 font-barlow uppercase">Score</div>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {sentimentData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] text-white/70 font-barlow">{item.name}</span>
            </div>
            <span className="text-[9px] text-white font-jetbrains">{item.value}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
