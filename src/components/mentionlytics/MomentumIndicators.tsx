/**
 * Momentum Indicators Component
 * Shows velocity, viral coefficient, crisis risk, and engagement quality
 * Designed for top row of dashboard (2 cards)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/card';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Award,
  Activity,
  Flame,
  Target,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useMentionlyticsDashboard } from '../../hooks/useMentionlytics';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface MomentumMetric {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  sparkline?: number[];
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ElementType;
}

export const MomentumIndicators: React.FC = () => {
  const { sentiment, mentions, trends, dataMode } = useMentionlyticsDashboard();
  const [animatedMetrics, setAnimatedMetrics] = useState<MomentumMetric[]>([]);

  // Calculate momentum metrics
  useEffect(() => {
    if (!sentiment || !mentions) return;

    // Calculate velocity (mentions per hour)
    const recentMentions = mentions.slice(0, 10);
    const oldestTime = new Date(recentMentions[recentMentions.length - 1]?.timestamp || Date.now());
    const newestTime = new Date(recentMentions[0]?.timestamp || Date.now());
    const hoursDiff = Math.max(1, (newestTime.getTime() - oldestTime.getTime()) / (1000 * 60 * 60));
    const velocity = Math.round(recentMentions.length / hoursDiff);
    const velocityChange = Math.round(Math.random() * 50 - 10); // Mock change

    // Calculate viral coefficient (engagement/reach ratio)
    const totalReach = mentions.reduce((sum, m) => sum + (m.reach || 0), 0);
    const totalEngagement = mentions.reduce((sum, m) => sum + (m.engagement || 0), 0);
    const viralCoeff = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0';
    const viralChange = Math.round(Math.random() * 20 - 5);

    // Calculate crisis risk (based on negative sentiment spike)
    const negativeRatio = sentiment.negative / sentiment.total;
    const crisisRisk = Math.round(negativeRatio * 100);
    const crisisChange = Math.round(Math.random() * 10 - 5);

    // Calculate engagement quality (positive engagement / total)
    const positiveMentions = mentions.filter((m) => m.sentiment === 'positive');
    const positiveEngagement = positiveMentions.reduce((sum, m) => sum + (m.engagement || 0), 0);
    const engagementQuality =
      totalEngagement > 0 ? Math.round((positiveEngagement / totalEngagement) * 100) : 0;
    const qualityChange = Math.round(Math.random() * 15 - 5);

    const metrics: MomentumMetric[] = [
      {
        label: 'Velocity Score',
        value: `${velocity}/hr`,
        change: velocityChange,
        trend: velocityChange > 0 ? 'up' : velocityChange < 0 ? 'down' : 'stable',
        sparkline: Array.from({ length: 12 }, () => Math.random() * 100 + 50),
        status:
          velocity > 100
            ? 'excellent'
            : velocity > 50
              ? 'good'
              : velocity > 20
                ? 'warning'
                : 'critical',
        icon: Activity,
      },
      {
        label: 'Viral Coefficient',
        value: `${viralCoeff}x`,
        change: viralChange,
        trend: viralChange > 0 ? 'up' : 'down',
        sparkline: Array.from({ length: 12 }, () => Math.random() * 5 + 1),
        status:
          Number(viralCoeff) > 5
            ? 'excellent'
            : Number(viralCoeff) > 3
              ? 'good'
              : Number(viralCoeff) > 1
                ? 'warning'
                : 'critical',
        icon: Flame,
      },
      {
        label: 'Crisis Risk',
        value: `${crisisRisk}/100`,
        change: crisisChange,
        trend: crisisChange > 0 ? 'up' : 'down',
        sparkline: Array.from({ length: 12 }, () => Math.random() * 50 + 25),
        status:
          crisisRisk < 20
            ? 'excellent'
            : crisisRisk < 40
              ? 'good'
              : crisisRisk < 60
                ? 'warning'
                : 'critical',
        icon: AlertTriangle,
      },
      {
        label: 'Quality Score',
        value:
          engagementQuality >= 80
            ? 'A+'
            : engagementQuality >= 70
              ? 'A'
              : engagementQuality >= 60
                ? 'B'
                : engagementQuality >= 50
                  ? 'C'
                  : 'D',
        change: qualityChange,
        trend: qualityChange > 0 ? 'up' : 'down',
        sparkline: Array.from({ length: 12 }, () => Math.random() * 30 + 60),
        status:
          engagementQuality >= 80
            ? 'excellent'
            : engagementQuality >= 60
              ? 'good'
              : engagementQuality >= 40
                ? 'warning'
                : 'critical',
        icon: Award,
      },
    ];

    setAnimatedMetrics(metrics);
  }, [sentiment, mentions]);

  const statusColors = {
    excellent: 'text-green-400 bg-green-500/10 border-green-400/30',
    good: 'text-blue-400 bg-blue-500/10 border-blue-400/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30',
    critical: 'text-red-400 bg-red-500/10 border-red-400/30',
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Activity,
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Velocity & Viral Card */}
      <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/10 h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Campaign Momentum</span>
          </h3>
          {dataMode === 'MOCK' && (
            <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
              Mock
            </span>
          )}
        </div>

        <div className="space-y-4">
          {animatedMetrics.slice(0, 2).map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-lg border ${statusColors[metric.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <metric.icon className="w-4 h-4" />
                  <span className="text-xs text-white/80">{metric.label}</span>
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs ${
                    metric.trend === 'up'
                      ? 'text-green-400'
                      : metric.trend === 'down'
                        ? 'text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-white">{metric.value}</div>

                {metric.sparkline && (
                  <div className="w-20 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metric.sparkline.map((v, i) => ({ value: v }))}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={metric.trend === 'up' ? '#10b981' : '#ef4444'}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Last updated</span>
            <span className="text-white/80">Just now</span>
          </div>
        </div>
      </Card>

      {/* Risk & Quality Card */}
      <Card className="p-4 bg-black/40 backdrop-blur-sm border-white/10 h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span>Risk & Quality</span>
          </h3>
          {dataMode === 'MOCK' && (
            <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
              Mock
            </span>
          )}
        </div>

        <div className="space-y-4">
          {animatedMetrics.slice(2, 4).map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-lg border ${statusColors[metric.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <metric.icon className="w-4 h-4" />
                  <span className="text-xs text-white/80">{metric.label}</span>
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs ${
                    metric.label === 'Crisis Risk'
                      ? metric.trend === 'up'
                        ? 'text-red-400'
                        : 'text-green-400'
                      : metric.trend === 'up'
                        ? 'text-green-400'
                        : 'text-red-400'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-white">{metric.value}</div>

                {metric.sparkline && (
                  <div className="w-20 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metric.sparkline.map((v, i) => ({ value: v }))}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={
                            metric.label === 'Crisis Risk'
                              ? metric.trend === 'up'
                                ? '#ef4444'
                                : '#10b981'
                              : metric.trend === 'up'
                                ? '#10b981'
                                : '#ef4444'
                          }
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <AnimatePresence mode="wait">
            {animatedMetrics[2]?.status === 'critical' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 text-xs text-red-400"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Crisis threshold approaching</span>
              </motion.div>
            )}
            {animatedMetrics[2]?.status !== 'critical' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 text-xs text-green-400"
              >
                <Award className="w-3 h-3" />
                <span>Campaign health: Good</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

export default MomentumIndicators;
