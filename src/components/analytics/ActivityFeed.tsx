/**
 * Real-time activity feed component.
 * Shows recent activities with auto-scroll and WebSocket updates.
 */
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAnalyticsWebSocket } from '../../hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  Calendar,
  DollarSign,
  MessageSquare,
  Mail,
  Phone,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { type Activity, type ActivityItem } from '../../types/analytics';

// Icon mapping for activity types
const activityIcons = {
  volunteer_signup: UserPlus,
  event_created: Calendar,
  donation: DollarSign,
  message: MessageSquare,
  milestone: TrendingUp,
  alert: AlertCircle,
  // Test compatibility
  volunteer: UserPlus,
  event: Calendar,
  contact: Users,
};

// Color mapping for activity types
const activityColors = {
  volunteer_signup: 'text-blue-600 bg-blue-100',
  event_created: 'text-green-600 bg-green-100',
  donation: 'text-yellow-600 bg-yellow-100',
  message: 'text-purple-600 bg-purple-100',
  milestone: 'text-indigo-600 bg-indigo-100',
  alert: 'text-red-600 bg-red-100',
  // Test compatibility
  volunteer: 'text-blue-600 bg-blue-100',
  event: 'text-purple-600 bg-purple-100',
  contact: 'text-green-600 bg-green-100',
};

interface ActivityFeedProps {
  activities?: (Activity | ActivityItem)[];
  loading?: boolean;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities: propActivities,
  loading = false,
  maxItems = 50,
}) => {
  const [internalActivities, setInternalActivities] = useState<ActivityItem[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const { lastMessage, isConnected } = useAnalyticsWebSocket();

  // Use prop activities if provided, otherwise use internal state
  const activities = propActivities || internalActivities;

  // Mock initial activities (only when not using prop activities)
  useEffect(() => {
    if (!propActivities) {
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'volunteer_signup',
          title: 'New volunteer signup',
          description: 'Sarah Johnson joined as a volunteer',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          user: { name: 'Sarah Johnson' },
        },
        {
          id: '2',
          type: 'event_created',
          title: 'New event scheduled',
          description: 'Town Hall Meeting on Main Street',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          metadata: { location: 'Main Street', attendees: 0 },
        },
        {
          id: '3',
          type: 'donation',
          title: 'Donation received',
          description: '$500 donation from anonymous donor',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          metadata: { amount: 500, anonymous: true },
        },
        {
          id: '4',
          type: 'milestone',
          title: 'Milestone reached!',
          description: 'Campaign reached 1,000 volunteers',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
          metadata: { milestone: 1000, type: 'volunteers' },
        },
      ];
      setInternalActivities(mockActivities);
    }
  }, [propActivities]);

  // Handle WebSocket messages (only when not using prop activities)
  useEffect(() => {
    if (!propActivities && lastMessage && lastMessage.type === 'activity_feed') {
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        ...lastMessage.data,
      };

      setInternalActivities((prev) => {
        const updated = [newActivity, ...prev];
        // Keep only last maxItems activities
        return updated.slice(0, maxItems);
      });
    }
  }, [lastMessage, propActivities, maxItems]);

  // Auto-scroll to top when new activities arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activities, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (feedRef.current) {
      const isAtTop = feedRef.current.scrollTop === 0;
      setAutoScroll(isAtTop);
    }
  };

  // Render activity item
  const renderActivity = (activity: Activity | ActivityItem) => {
    const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Users;
    const colorClass =
      activityColors[activity.type as keyof typeof activityColors] || 'text-gray-600 bg-gray-100';

    // Handle both Activity and ActivityItem interfaces
    const title = 'title' in activity ? activity.title : activity.message;
    const description = 'description' in activity ? activity.description : undefined;

    return (
      <div
        key={activity.id}
        className="flex space-x-3 p-3 hover:bg-gray-50 transition-colors rounded-lg"
        data-testid="activity-item"
      >
        <div className={cn('p-2 rounded-full flex-shrink-0', colorClass)}>
          <Icon className="h-4 w-4" data-testid={`icon-${activity.type}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {description && <p className="text-sm text-gray-500 truncate">{description}</p>}
          <p className="text-xs text-gray-400 mt-1" data-testid="activity-time">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-3 p-3" data-testid="activity-skeleton">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-gray-400')}
          />
          <span className="text-xs text-gray-500">{isConnected ? 'Live updates' : 'Offline'}</span>
        </div>

        <button
          onClick={() => {
            setAutoScroll(!autoScroll);
            if (!autoScroll && feedRef.current) {
              feedRef.current.scrollTop = 0;
            }
          }}
          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
          aria-label={autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
        >
          {autoScroll ? (
            <Pause className="h-3 w-3" data-testid="pause-icon" />
          ) : (
            <Play className="h-3 w-3" data-testid="play-icon" />
          )}
          <span>Auto-scroll</span>
        </button>
      </div>

      {/* Activity list */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-2 pr-2"
        style={{ maxHeight: '400px' }}
      >
        {loading ? (
          renderLoadingSkeleton()
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Activities will appear here as they happen</p>
          </div>
        ) : (
          activities.slice(0, maxItems).map(renderActivity)
        )}
      </div>

      {/* Load more */}
      {activities.length >= 20 && (
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">
          Load more activities
        </button>
      )}
    </div>
  );
};

// Activity item component for reuse
export const ActivityItemComponent: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
  const Icon = activityIcons[activity.type];
  const colorClass = activityColors[activity.type];

  return (
    <div className="flex items-start space-x-3">
      <div className={cn('p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        {activity.description && (
          <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
