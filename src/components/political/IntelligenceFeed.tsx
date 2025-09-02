import type React from 'react';
import { useState, useEffect } from 'react';
import Card from '../shared/Card';

interface IntelligenceFeedProps {
  className?: string;
  highlightedFeedId?: string | null;
}

interface FeedItem {
  id: string | null;
  type: 'info' | 'warning' | 'critical';
  content: string;
}

const IntelligenceFeed: React.FC<IntelligenceFeedProps> = ({
  className = '',
  highlightedFeedId,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const feedItems: FeedItem[] = [
    { id: 'wisconsin-opens', type: 'info', content: 'Wisconsin voter registration up 34%.' },
    { id: null, type: 'warning', content: 'Major news outlet published critical article.' },
    { id: 'fl-suburbs', type: 'info', content: 'Positive sentiment in Florida suburbs +12%.' },
    {
      id: 'viral-negative',
      type: 'critical',
      content: 'Viral negative mention detected. 12K retweets in PA.',
    },
    { id: 'competitor-launch', type: 'warning', content: 'Competitor launched $250K ad campaign.' },
    { id: 'youth-engagement', type: 'info', content: 'Youth voter engagement up 23% in Michigan.' },
    { id: null, type: 'info', content: 'Meta ads performing 52% above benchmark.' },
    { id: 'ad-fatigue', type: 'warning', content: 'Ad fatigue detected in target demographics.' },
    {
      id: 'brand-recognition',
      type: 'info',
      content: 'Brand recognition increased 18% this week.',
    },
    { id: null, type: 'critical', content: 'Opposition video trending #1 on Twitter.' },
  ];

  const getBorderColor = (type: FeedItem['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-400';
      case 'warning':
        return 'border-amber-400';
      case 'info':
        return 'border-blue-400';
    }
  };

  const getPrefix = (type: FeedItem['type']) => {
    switch (type) {
      case 'critical':
        return 'CRITICAL:';
      case 'warning':
        return 'WARNING:';
      case 'info':
        return 'INFO:';
    }
  };

  return (
    <Card className={`hoverable ${className}`} padding="md" variant="glass">
      <div className="space-y-3">
        <h3 className="section-header">LIVE INTELLIGENCE</h3>

        <div
          className="h-[380px] relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Fade gradients */}
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/10 to-transparent z-10 pointer-events-none" />

          <div
            className={`space-y-3 transition-all duration-300 ${isPaused ? '' : 'animate-scroll-feed'}`}
          >
            {/* Render items twice for seamless loop */}
            {[...feedItems, ...feedItems].map((item, index) => (
              <div
                key={`${item.id || 'null'}-${index}`}
                className={`bg-black/20 p-3 rounded border-l-2 text-sm min-h-[60px] flex items-center transition-all duration-300 ${getBorderColor(item.type)} ${
                  highlightedFeedId === item.id
                    ? 'bg-white/20 scale-105 shadow-lg z-10 relative'
                    : ''
                }`}
              >
                <span className="text-white/90">
                  <strong className="font-semibold font-mono">{getPrefix(item.type)}</strong>{' '}
                  {item.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IntelligenceFeed;
