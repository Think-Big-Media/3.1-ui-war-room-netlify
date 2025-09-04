/**
 * Dual Pie Charts Component - Sentiment + Emotion Analysis
 * Designed to fit in the top row of the dashboard (2 charts side by side)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSentimentAnalysis } from '../../hooks/useMentionlytics';
import { Card } from '../ui/card';
import { Loader2, Brain, Heart, TrendingUp, AlertCircle } from 'lucide-react';

// Sentiment colors
const SENTIMENT_COLORS = {
  positive: '#10b981', // green-500
  negative: '#ef4444', // red-500
  neutral: '#6b7280', // gray-500
};

// Emotion colors - more nuanced palette
const EMOTION_COLORS = {
  joy: '#fbbf24', // yellow-400
  trust: '#60a5fa', // blue-400
  fear: '#a78bfa', // purple-400
  surprise: '#f472b6', // pink-400
  sadness: '#94a3b8', // slate-400
  disgust: '#f87171', // red-400
  anger: '#dc2626', // red-600
  anticipation: '#34d399', // emerald-400
};

// Mock emotion data (would come from Mentionlytics emotion analysis)
const mockEmotionData = [
  { name: 'Joy', value: 245, percentage: 24 },
  { name: 'Trust', value: 189, percentage: 18 },
  { name: 'Fear', value: 156, percentage: 15 },
  { name: 'Anger', value: 134, percentage: 13 },
  { name: 'Sadness', value: 98, percentage: 10 },
  { name: 'Surprise', value: 87, percentage: 9 },
  { name: 'Anticipation', value: 76, percentage: 7 },
  { name: 'Disgust', value: 54, percentage: 4 },
];

export const DualPieCharts: React.FC = () => {
  const { data: sentiment, loading, error, dataMode } = useSentimentAnalysis();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 bg-black/40 backdrop-blur-sm border-white/10 h-[280px]">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !sentiment) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/10 h-[280px]">
          <div className="text-red-400 text-center">Failed to load data</div>
        </Card>
      </div>
    );
  }

  const sentimentData = [
    {
      name: 'Positive',
      value: sentiment.positive,
      percentage: ((sentiment.positive / sentiment.total) * 100).toFixed(1),
    },
    {
      name: 'Negative',
      value: sentiment.negative,
      percentage: ((sentiment.negative / sentiment.total) * 100).toFixed(1),
    },
    {
      name: 'Neutral',
      value: sentiment.neutral,
      percentage: ((sentiment.neutral / sentiment.total) * 100).toFixed(1),
    },
  ];

  // Calculate net sentiment score
  const netSentiment = (
    ((sentiment.positive - sentiment.negative) / sentiment.total) *
    100
  ).toFixed(1);
  const sentimentTrend =
    Number(netSentiment) > 0 ? 'positive' : Number(netSentiment) < 0 ? 'negative' : 'neutral';

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 text-white p-2 rounded-lg shadow-xl border border-white/20">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-xs">
            {data.value} mentions ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-xs"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Sentiment Analysis Chart */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/10 h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Sentiment Analysis</h3>
            </div>
            <div
              className={`flex items-center space-x-1 text-xs ${
                sentimentTrend === 'positive'
                  ? 'text-green-400'
                  : sentimentTrend === 'negative'
                    ? 'text-red-400'
                    : 'text-gray-400'
              }`}
            >
              {sentimentTrend === 'positive' && <TrendingUp className="w-3 h-3" />}
              {sentimentTrend === 'negative' && <AlertCircle className="w-3 h-3" />}
              <span>
                {netSentiment > 0 ? '+' : ''}
                {netSentiment}%
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                labelLine={false}
                label={CustomLabel}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {sentimentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      SENTIMENT_COLORS[entry.name.toLowerCase() as keyof typeof SENTIMENT_COLORS]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex justify-around mt-2">
            {sentimentData.map((item, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-2 h-2 rounded-full mx-auto mb-1"
                  style={{
                    backgroundColor:
                      SENTIMENT_COLORS[item.name.toLowerCase() as keyof typeof SENTIMENT_COLORS],
                  }}
                />
                <div className="text-xs text-white/60">{item.name}</div>
                <div className="text-xs font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          {dataMode === 'MOCK' && (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                Mock
              </span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Emotion Analysis Chart */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/10 h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Emotion Analysis</h3>
            </div>
            <span className="text-xs text-white/60">8 emotions</span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={mockEmotionData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {mockEmotionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={EMOTION_COLORS[entry.name.toLowerCase() as keyof typeof EMOTION_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-1 mt-2">
            {mockEmotionData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-2 h-2 rounded-full mx-auto mb-0.5"
                  style={{
                    backgroundColor:
                      EMOTION_COLORS[item.name.toLowerCase() as keyof typeof EMOTION_COLORS],
                  }}
                />
                <div className="text-xs text-white/60">{item.name}</div>
                <div className="text-xs font-bold text-white">{item.percentage}%</div>
              </div>
            ))}
          </div>

          {dataMode === 'MOCK' && (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                Mock
              </span>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default DualPieCharts;
