/**
 * SentimentGauge Component
 * Real-time sentiment visualization with Mentionlytics monitoring
 * Includes trend analysis and historical chart
 */

import type React from 'react';
import { memo, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, MessageSquare } from 'lucide-react';
import { useDashboardStore, selectSentimentTrend } from '../../store/dashboardStore';

// Gauge configuration
const GAUGE_CONFIG = {
  minAngle: -120,
  maxAngle: 120,
  minValue: -100,
  maxValue: 100,
  colorStops: [
    { value: -100, color: '#ef4444' }, // red
    { value: -50, color: '#f97316' }, // orange
    { value: 0, color: '#eab308' }, // yellow
    { value: 50, color: '#22c55e' }, // green
    { value: 100, color: '#10b981' }, // emerald
  ],
  zones: [
    { min: -100, max: -60, label: 'Crisis', color: 'bg-red-500' },
    { min: -60, max: -20, label: 'Negative', color: 'bg-orange-500' },
    { min: -20, max: 20, label: 'Neutral', color: 'bg-yellow-500' },
    { min: 20, max: 60, label: 'Positive', color: 'bg-green-500' },
    { min: 60, max: 100, label: 'Excellent', color: 'bg-emerald-500' },
  ],
};

// Helper to get color for sentiment value
function getSentimentColor(value: number): string {
  const { colorStops } = GAUGE_CONFIG;

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (value >= colorStops[i].value && value <= colorStops[i + 1].value) {
      // Linear interpolation between colors
      const ratio = (value - colorStops[i].value) / (colorStops[i + 1].value - colorStops[i].value);
      return interpolateColor(colorStops[i].color, colorStops[i + 1].color, ratio);
    }
  }

  return colorStops[colorStops.length - 1].color;
}

// Color interpolation helper
function interpolateColor(color1: string, color2: string, ratio: number): string {
  // Simple hex color interpolation
  const hex1 = parseInt(color1.slice(1), 16);
  const hex2 = parseInt(color2.slice(1), 16);

  const r1 = (hex1 >> 16) & 255;
  const g1 = (hex1 >> 8) & 255;
  const b1 = hex1 & 255;

  const r2 = (hex2 >> 16) & 255;
  const g2 = (hex2 >> 8) & 255;
  const b2 = hex2 & 255;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Sentiment gauge visualization
const GaugeChart = memo<{ value: number; label: string }>(({ value, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { minAngle, maxAngle, minValue, maxValue } = GAUGE_CONFIG;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gauge background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, (minAngle * Math.PI) / 180, (maxAngle * Math.PI) / 180);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 20;
    ctx.stroke();

    // Draw colored zones
    GAUGE_CONFIG.zones.forEach((zone) => {
      const startAngle =
        minAngle + ((zone.min - minValue) / (maxValue - minValue)) * (maxAngle - minAngle);
      const endAngle =
        minAngle + ((zone.max - minValue) / (maxValue - minValue)) * (maxAngle - minAngle);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, (startAngle * Math.PI) / 180, (endAngle * Math.PI) / 180);
      ctx.strokeStyle = getSentimentColor((zone.min + zone.max) / 2);
      ctx.lineWidth = 20;
      ctx.stroke();
    });

    // Draw needle
    const needleAngle =
      minAngle + ((value - minValue) / (maxValue - minValue)) * (maxAngle - minAngle);
    const needleRad = (needleAngle * Math.PI) / 180;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleRad);

    // Needle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    // Draw needle
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(0, -radius + 30);
    ctx.lineTo(5, 0);
    ctx.fillStyle = '#374151';
    ctx.fill();

    // Needle center
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2937';
    ctx.fill();

    ctx.restore();

    // Draw value text
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(value).toString(), centerX, centerY + 40);

    // Draw label
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px sans-serif';
    ctx.fillText(label, centerX, centerY + 65);
  }, [value, label, minAngle, maxAngle, minValue, maxValue]);

  return <canvas ref={canvasRef} width={240} height={180} className="w-full max-w-[240px]" />;
});

GaugeChart.displayName = 'GaugeChart';

// Trend line chart for sentiment history
const TrendChart = memo<{ data: Array<{ timestamp: Date; score: number }> }>(({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-400">
        <p className="text-sm">No historical data</p>
      </div>
    );
  }

  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const range = maxScore - minScore || 1;

  return (
    <div className="h-24 relative">
      <svg className="w-full h-full">
        <defs>
          <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getSentimentColor(maxScore)} stopOpacity="0.3" />
            <stop offset="100%" stopColor={getSentimentColor(minScore)} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={data
            .map((point, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((point.score - minScore) / range) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')}
          fill="none"
          stroke={getSentimentColor(data[data.length - 1].score)}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={`${data
            .map((point, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((point.score - minScore) / range) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')} L 100 100 L 0 100 Z`}
          fill="url(#sentimentGradient)"
        />
      </svg>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';

// Main SentimentGauge component
export const SentimentGauge: React.FC = memo(() => {
  const { sentiment, sentimentHistory } = useDashboardStore();
  const trend = useDashboardStore(selectSentimentTrend);

  // Get current zone
  const currentZone = useMemo(() => {
    if (!sentiment) {
      return GAUGE_CONFIG.zones[2];
    } // Default to neutral

    return (
      GAUGE_CONFIG.zones.find(
        (zone) => sentiment.overall >= zone.min && sentiment.overall <= zone.max
      ) || GAUGE_CONFIG.zones[2]
    );
  }, [sentiment]);

  // Calculate trend icon
  const TrendIcon =
    trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;

  if (!sentiment) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sentiment Analysis</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Powered by Mentionlytics
            </p>
          </div>

          <div
            className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${currentZone.color} bg-opacity-20
          `}
          >
            {currentZone.label}
          </div>
        </div>
      </div>

      {/* Gauge and metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauge visualization */}
          <div className="flex justify-center">
            <GaugeChart value={sentiment.overall} label="Weighted Score" />
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            {/* Platform scores */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mentionlytics</span>
                <span className="font-semibold">{sentiment.mentionlyticsScore.toFixed(1)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mentionlytics (40%)
                </span>
                <span className="font-semibold">{sentiment.mentionlyticsScore.toFixed(1)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Weighted Average</span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: getSentimentColor(sentiment.overall) }}
                  >
                    {sentiment.overall.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Trend and volume */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Trend</span>
                  <TrendIcon
                    size={16}
                    className={
                      trend === 'improving'
                        ? 'text-green-600'
                        : trend === 'declining'
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }
                  />
                </div>
                <p className="font-semibold capitalize">{trend}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Volume</span>
                  <MessageSquare size={16} className="text-gray-500" />
                </div>
                <p className="font-semibold">{formatNumber(sentiment.volume)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Historical trend */}
        {sentimentHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              24 Hour Trend
            </h3>
            <TrendChart data={sentimentHistory} />
          </div>
        )}

        {/* Real-time indicator */}
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Activity size={16} className="text-green-500 animate-pulse" />
            <span>Real-time monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  );
});

SentimentGauge.displayName = 'SentimentGauge';

// Utility function
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}
