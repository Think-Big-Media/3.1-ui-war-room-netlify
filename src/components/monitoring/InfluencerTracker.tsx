// Influencer Tracker Component

import type React from 'react';
import Card from '../shared/Card';
import { type Influencer } from '../../types/monitoring';
import { getPlatformIcon, getSentimentIcon, formatNumber } from './utils';
import { createLogger } from '../../utils/logger';

const logger = createLogger('InfluencerTracker');

interface InfluencerTrackerProps {
  influencers: Influencer[];
}

const InfluencerTracker: React.FC<InfluencerTrackerProps> = ({ influencers }) => {
  const handleAddToWatchlist = (influencer: Influencer) => {
    logger.info('Add influencer to watchlist:', influencer.username);
    // Handle adding influencer to watchlist
  };

  const handleAmplify = (influencer: Influencer) => {
    logger.info('Amplify influencer:', influencer.username);
    // Handle amplifying influencer content
  };

  return (
    <Card
      padding="md"
      variant="glass"
      className="hoverable hover:scale-[1.02] transition-all duration-200"
    >
      <h3 className="section-header mb-4 tracking-wide ml-1.5">INFLUENCER TRACKER</h3>
      <div className="space-y-3 px-1.5">
        {influencers.map((influencer) => (
          <div
            key={influencer.id}
            className="bg-black/20 rounded-lg p-5 hoverable hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(influencer.platform)}
                <span className="text-white/90 font-medium text-sm">{influencer.username}</span>
              </div>
              <span className="text-white/70 text-xs font-mono uppercase">
                {influencer.lastPost}
              </span>
            </div>
            <div className="text-xs text-white/60 -mt-1 mb-2 font-mono uppercase">
              {formatNumber(influencer.followers)} FOLLOWERS • REACH: {influencer.reach}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getSentimentIcon(influencer.sentiment)}
                <span className="text-xs text-white/70 font-mono uppercase">
                  ENG: {influencer.engagement}%
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={() => handleAddToWatchlist(influencer)}
                className="btn-secondary-action"
              >
                Add to Watchlist
              </button>
              <button onClick={() => handleAmplify(influencer)} className="btn-secondary-neutral">
                Amplify
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default InfluencerTracker;
