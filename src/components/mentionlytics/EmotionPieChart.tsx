import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { MentionlyticsData } from '../../services/mentionlytics';
import { useDataMode } from '../../hooks/useDataMode';

interface EmotionPieChartProps {
  data: MentionlyticsData | null;
}

export const EmotionPieChart: React.FC<EmotionPieChartProps> = ({ data }) => {
  const { isLive } = useDataMode();

  const emotionData = [
    {
      name: 'Trust',
      value: data?.emotions?.trust || 34,
      color: '#3B82F6',
    },
    {
      name: 'Joy',
      value: data?.emotions?.joy || 28,
      color: '#10B981',
    },
    {
      name: 'Fear',
      value: data?.emotions?.fear || 15,
      color: '#F59E0B',
    },
    {
      name: 'Anger',
      value: data?.emotions?.anger || 12,
      color: '#EF4444',
    },
    {
      name: 'Surprise',
      value: data?.emotions?.surprise || 11,
      color: '#8B5CF6',
    },
  ];

  const dominantEmotion = emotionData.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-barlow font-semibold text-white text-xs">Emotion</h4>
        {!isLive && (
          <span className="text-[8px] text-yellow-400 uppercase font-jetbrains">Mock</span>
        )}
      </div>

      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={emotionData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {emotionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value}%`, '']}
              labelStyle={{ color: '#000' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center dominant emotion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-sm font-bold font-jetbrains"
              style={{ color: dominantEmotion.color }}
            >
              {dominantEmotion.value}%
            </div>
            <div className="text-[8px] text-white/60 font-barlow uppercase">
              {dominantEmotion.name}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1 max-h-16 overflow-y-auto">
        {emotionData.slice(0, 3).map((item, idx) => (
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
