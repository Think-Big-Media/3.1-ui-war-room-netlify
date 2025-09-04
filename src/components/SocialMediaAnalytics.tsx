import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { perfectCardShadow } from '../lib/utils';

interface AnalyticsMetric {
  label: string;
  value: string;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  progressColor: string;
}

interface SocialMediaAnalyticsProps {
  className?: string;
}

const SocialMediaAnalytics: React.FC<SocialMediaAnalyticsProps> = ({ className = '' }) => {
  const analytics: AnalyticsMetric[] = [
    {
      label: 'Current Volume',
      value: '24,011 interactions',
      percentage: 0,
      trend: 'neutral',
      color: 'text-gray-800',
      progressColor: 'bg-blue-500'
    },
    {
      label: 'Growth Rate',
      value: '-5.1%',
      percentage: 5.1,
      trend: 'down',
      color: 'text-red-600',
      progressColor: 'bg-red-400'
    },
    {
      label: 'Engagement',
      value: '9.7%',
      percentage: 9.7,
      trend: 'up',
      color: 'text-green-600',
      progressColor: 'bg-green-500'
    }
  ];

  const insights = [
    'Engagement is healthy at 9.7%',
    'Growth rate shows a decline, needs attention'
  ];

  const recommendation = 'Focus on content strategy and audience engagement to reverse the negative growth trend. Consider targeted campaigns for key demographics.';

  const renderProgressBar = (percentage: number, color: string, trend: 'up' | 'down' | 'neutral') => {
    const width = Math.min(Math.abs(percentage) * 10, 100); // Scale for visibility
    
    return (
      <div className="flex items-center space-x-2 mt-1">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${width}%` }}
          />
        </div>
        <div className="flex items-center space-x-1">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
          {trend === 'down' && <AlertTriangle className="w-3 h-3 text-orange-500" />}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 ${className}`}
      style={{ boxShadow: perfectCardShadow }}
    >
      <div className="mb-3">
        <h3 className="text-gray-800 font-semibold text-sm mb-2">Social Media Reach Analysis:</h3>
        <div className="border-b border-gray-300 mb-3" />
      </div>

      {/* Metrics */}
      <div className="space-y-2 mb-4">
        {analytics.map((metric, index) => (
          <div key={index}>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">• {metric.label}:</span>
              <span className={`text-sm font-medium ${metric.color}`}>
                {metric.value}
              </span>
            </div>
            {metric.percentage > 0 && renderProgressBar(metric.percentage, metric.progressColor, metric.trend)}
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="mb-4">
        <h4 className="text-gray-800 font-medium text-sm mb-2">Key Insights:</h4>
        <div className="space-y-1">
          {insights.map((insight, index) => (
            <div key={index} className="text-gray-700 text-sm">
              • {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <h4 className="text-gray-800 font-medium text-sm mb-2">Recommendation:</h4>
        <p className="text-gray-700 text-sm leading-relaxed">{recommendation}</p>
      </div>
    </div>
  );
};

export default SocialMediaAnalytics;