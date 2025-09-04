// Sentiment Breakdown Component

import type React from 'react';
import Card from '../shared/Card';
import { type SentimentData } from '../../types/monitoring';
import { getSentimentWidth } from './utils';

interface SentimentBreakdownProps {
  sentimentData: SentimentData;
}

const SentimentBreakdown: React.FC<SentimentBreakdownProps> = ({ sentimentData }) => {
  // Calculate actual percentages from raw counts
  const positivePercentage = sentimentData.total > 0 ? Math.round((sentimentData.positive / sentimentData.total) * 100) : 0;
  const negativePercentage = sentimentData.total > 0 ? Math.round((sentimentData.negative / sentimentData.total) * 100) : 0;
  const neutralPercentage = sentimentData.total > 0 ? Math.round((sentimentData.neutral / sentimentData.total) * 100) : 0;

  return (
    <Card
      padding="md"
      variant="glass"
      className="hoverable hover:scale-[1.02] transition-all duration-200"
    >
      <h3 className="section-header mb-4 tracking-wide ml-1.5">SENTIMENT BREAKDOWN</h3>
      <div className="space-y-4 px-1.5 pb-5">
        <div className="flex items-center justify-between">
          <span className="text-white/80">Positive</span>
          <span className="text-green-400 font-medium">{positivePercentage}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2">
          <div
            className={`bg-[var(--accent-live-monitoring)] h-2 rounded-full ${getSentimentWidth(positivePercentage)}`}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/80">Neutral</span>
          <span className="text-gray-400 font-medium">{neutralPercentage}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2">
          <div
            className={`bg-gray-400 h-2 rounded-full ${getSentimentWidth(neutralPercentage)}`}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/80">Negative</span>
          <span className="text-red-400 font-medium">{negativePercentage}%</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2">
          <div
            className={`bg-red-400 h-2 rounded-full ${getSentimentWidth(negativePercentage)}`}
          />
        </div>
      </div>
    </Card>
  );
};

export default SentimentBreakdown;
