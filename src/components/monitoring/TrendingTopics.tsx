// Trending Topics Component

import type React from 'react';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../shared/Card';
import { type TrendingTopic } from '../../types/monitoring';
import { getTrendColor, formatNumber } from './utils';
import { createLogger } from '../../utils/logger';
import { safeParseJSON } from '../../utils/localStorage';
import { CampaignSetupData } from '../../types/campaign';

const logger = createLogger('TrendingTopics');

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ topics }) => {
  const [campaignKeywords, setCampaignKeywords] = useState<string[]>([]);

  // Load campaign keywords from localStorage
  useEffect(() => {
    const campaignData = safeParseJSON<CampaignSetupData>('warRoomCampaignSetup', { fallback: null });
    if (campaignData?.keywords) {
      setCampaignKeywords(campaignData.keywords);
    }
  }, []);

  // Mock keywords for fallback when no campaign data exists
  const mockKeywords = ['HEALTHCARE REFORM', 'ECONOMIC POLICY', 'INFRASTRUCTURE', 'EDUCATION FUNDING'];
  
  // Use campaign keywords if available, otherwise use mock keywords
  const keywordsToUse = campaignKeywords.length > 0 ? campaignKeywords : mockKeywords;
  
  // Create trending topics from keywords (campaign or mock)
  const campaignTopics: TrendingTopic[] = keywordsToUse.slice(0, 4).map((keyword, index) => ({
    id: `campaign-${index}`,
    keyword: keyword.toUpperCase(),
    change: [45, -12, 23, 67][index] || Math.floor(Math.random() * 100) - 25,
    mentions: [2847, 1923, 3456, 1234][index] || Math.floor(Math.random() * 5000) + 1000,
    region: ['District 3', 'Statewide', 'District 7', 'District 3'][index] || 'Statewide',
    timeframe: '24h'
  }));

  // Always use our generated topics (either from campaign or mock data)
  const displayTopics = campaignTopics;
  const handleViewMentions = (topic: TrendingTopic) => {
    logger.info('View mentions for topic:', topic.keyword);
    // Handle viewing mentions for topic
  };

  const handleDraftResponse = (topic: TrendingTopic) => {
    logger.info('Draft response for topic:', topic.keyword);
    // Handle drafting response for topic
  };

  return (
    <Card padding="md" variant="glass" className="hoverable">
      <h3 className="section-header mb-4 tracking-wide ml-2">
        TRENDING TOPICS (Issue Spike Detector)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-black/20 rounded-lg p-6 hoverable cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xl font-bold text-white uppercase tracking-wide font-barlow-semi-condensed">{topic.keyword || 'NO KEYWORD'}</h4>
              <div className={`flex items-center space-x-1 ${getTrendColor(topic.change)}`}>
                {topic.change > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {topic.change > 0 ? '+' : ''}
                  {topic.change}%
                </span>
              </div>
            </div>
            <div className="text-sm text-white/70 mb-2 font-mono uppercase">
              {formatNumber(topic.mentions)} MENTIONS
            </div>
            <div className="flex items-center justify-between text-xs text-white/60 font-mono uppercase">
              <span>{topic.region}</span>
              <span>LAST {topic.timeframe}</span>
            </div>
            <div className="flex items-center space-x-2 mt-4 -ml-2">
              <button onClick={() => handleViewMentions(topic)} className="btn-secondary-action">
                View mentions
              </button>
              <button onClick={() => handleDraftResponse(topic)} className="btn-secondary-neutral">
                Draft response
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TrendingTopics;
