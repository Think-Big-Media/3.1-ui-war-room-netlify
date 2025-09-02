// Activity Feed Component

import type React from 'react';
import Card from '../shared/Card';
import { type CampaignActivityItem } from '../../types/campaign';
import { getActivityIcon } from './utils';

interface ActivityFeedProps {
  activities: CampaignActivityItem[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <Card padding="md" variant="glass">
        <h3
          className="text-xl font-semibold text-white/40 mb-4 font-condensed tracking-wide ml-1.5"
          style={{
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            fontKerning: 'normal',
            textSizeAdjust: '100%',
          }}
        >
          RECENT ACTIVITY
        </h3>
        <div className="space-y-3 px-1.5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="space-x-3"
            >
              <div className="p-5 bg-black/20 rounded-lg">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <div className="text-white/90 text-sm">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-white/70"> {activity.action} </span>
                  <span className="font-medium">{activity.target}</span>
                </div>
                <div className="text-white/60 text-xs -mt-1">{activity.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ActivityFeed;
