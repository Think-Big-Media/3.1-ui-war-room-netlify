/**
 * Share of Voice Chart Component
 * Shows competitive landscape with animated transitions
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useShareOfVoice, useMentionlyticsMode } from '../../hooks/useMentionlytics';
import { Card } from '../ui/card';
import { Loader2, TrendingUp, TrendingDown, Users, MessageSquare, Eye } from 'lucide-react';

const PARTY_COLORS = {
  Democrat: '#3B82F6', // blue-500
  Republican: '#EF4444', // red-500
  Independent: '#A855F7', // purple-500
  Other: '#6B7280', // gray-500
};

interface ShareOfVoiceChartProps {
  campaignData?: {
    candidateName: string;
    candidateParty: string;
    competitors: Array<{
      name: string;
      party: string;
    }>;
  };
}

export const ShareOfVoiceChart: React.FC<ShareOfVoiceChartProps> = ({ campaignData }) => {
  const { data: shareData, loading, error, dataMode } = useShareOfVoice();
  const [selectedMetric, setSelectedMetric] = useState<'mentions' | 'reach' | 'engagement'>(
    'mentions'
  );
  const [animatedData, setAnimatedData] = useState<any[]>([]);

  // Load campaign data from localStorage if not provided
  const campaign = campaignData || JSON.parse(localStorage.getItem('warRoomCampaignSetup') || '{}');

  // Animate data changes
  useEffect(() => {
    if (shareData) {
      const timer = setTimeout(() => {
        setAnimatedData(shareData);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shareData]);

  if (loading) {
    return (
      <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      </Card>
    );
  }

  if (error || !shareData) {
    return (
      <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10">
        <div className="text-red-400 text-center">Failed to load share of voice data</div>
      </Card>
    );
  }

  // Map data to political context
  const mappedData = shareData.map((item, idx) => {
    const isCandidate = idx === 0 || item.brand === campaign.candidateName;
    const party = isCandidate
      ? campaign.candidateParty
      : campaign.competitors?.[idx - 1]?.party || 'Other';

    return {
      ...item,
      name: item.brand,
      party,
      color: PARTY_COLORS[party as keyof typeof PARTY_COLORS] || PARTY_COLORS.Other,
      isCandidate,
    };
  });

  // Calculate trends (mock for now)
  const trends = mappedData.map((item) => ({
    ...item,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.floor(Math.random() * 20) - 10,
  }));

  // Time series data (mock)
  const timeSeriesData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      ...mappedData.reduce(
        (acc, item) => ({
          ...acc,
          [item.name]: Math.floor(item.percentage + (Math.random() * 10 - 5)),
        }),
        {}
      ),
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-white/20">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            {selectedMetric === 'mentions' && `${data.value.toLocaleString()} mentions`}
            {selectedMetric === 'reach' && `${(data.value / 1000).toFixed(1)}K reach`}
            {selectedMetric === 'engagement' && `${(data.value / 1000).toFixed(1)}K engagements`}
          </p>
          <p className="text-xs text-white/60">{data.payload.percentage.toFixed(1)}% share</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Main Share of Voice Card */}
      <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-1">Share of Voice</h3>
          <p className="text-sm text-white/60">Campaign dominance in the conversation</p>
          {dataMode === 'MOCK' && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
              Mock Data
            </span>
          )}
        </div>

        {/* Metric Selector */}
        <div className="flex space-x-2 mb-4">
          {(['mentions', 'reach', 'engagement'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                selectedMetric === metric
                  ? 'bg-blue-600 text-white'
                  : 'bg-black/40 text-white/60 hover:bg-black/60'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {metric === 'mentions' && <MessageSquare className="w-4 h-4" />}
                {metric === 'reach' && <Eye className="w-4 h-4" />}
                {metric === 'engagement' && <Users className="w-4 h-4" />}
                <span className="capitalize">{metric}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Competitive Bubbles */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {trends.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div
                className="p-4 rounded-xl border transition-all hover:scale-105"
                style={{
                  backgroundColor: `${item.color}20`,
                  borderColor: `${item.color}40`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">
                    {item.name}
                    {item.isCandidate && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        YOU
                      </span>
                    )}
                  </span>
                  <div
                    className={`flex items-center space-x-1 text-sm ${
                      item.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {item.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(item.trendValue)}%</span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-white mb-1">
                  {item.percentage.toFixed(1)}%
                </div>

                <div className="text-xs text-white/60">
                  {selectedMetric === 'mentions' && `${item.mentions.toLocaleString()} mentions`}
                  {selectedMetric === 'reach' && `${(item.reach / 1000).toFixed(0)}K reach`}
                  {selectedMetric === 'engagement' &&
                    `${(item.engagement / 1000).toFixed(0)}K engagements`}
                </div>

                {/* Party indicator */}
                <div className="absolute top-2 right-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                    title={item.party}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Donut Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={mappedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              dataKey={selectedMetric}
              animationBegin={0}
              animationDuration={800}
            >
              {mappedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Time Series Trend */}
      <Card className="p-6 bg-black/40 backdrop-blur-sm border-white/10">
        <h4 className="text-lg font-semibold text-white mb-4">7-Day Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            {mappedData.map((item, idx) => (
              <Area
                key={item.name}
                type="monotone"
                dataKey={item.name}
                stackId="1"
                stroke={item.color}
                fill={item.color}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ShareOfVoiceChart;
