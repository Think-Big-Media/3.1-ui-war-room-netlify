/**
 * Real-time Activity Feed Component
 * Shows live updates of campaign activities from API
 */

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Users,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Activity,
  ArrowRight,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  UserPlus,
  FileUp,
  Heart,
  Share2,
  Target,
  Wifi,
  WifiOff,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useRecentActivities } from '../../hooks/useActivities';
import { useAdMonitorWebSocket } from '../../hooks/useAdMonitorWebSocket';
import { ConnectionStatus } from '../common/ConnectionStatus';
import type { ActivityEvent } from '../../services/activityApi';

interface ActivityFeedProps {
  limit?: number;
  filter?: string[];
  showTimestamps?: boolean;
  compact?: boolean;
  onActivityClick?: (activity: ActivityEvent) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  limit = 20,
  filter,
  showTimestamps = true,
  compact = false,
  onActivityClick,
}) => {
  const feedRef = useRef<HTMLDivElement>(null);

  // Live activity data from API
  const {
    data: activityData,
    isLoading,
    error,
  } = useRecentActivities({
    limit,
    types: filter,
    autoRefresh: true,
  });

  // Real-time WebSocket connection for instant updates
  const wsConnection = useAdMonitorWebSocket();

  const activities = (activityData as any)?.activities || [];
  const isConnected = (!error && activities.length > 0) || wsConnection.isConnected;

  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      campaign_update: BarChart3,
      spend_alert: AlertCircle,
      performance_change: TrendingUp,
      api_sync: Zap,
      system_alert: Bell,
      donation: DollarSign,
      volunteer_signup: UserPlus,
      event_registration: Calendar,
      document_upload: FileUp,
      contact_added: Users,
      email_sent: Mail,
      call_made: Phone,
      goal_reached: Target,
      alert: AlertCircle,
      social_share: Share2,
    };
    return iconMap[type] || Activity;
  };

  // Activity color mapping
  const getActivityColor = (type: string, severity?: string) => {
    if (severity === 'critical') {
      return 'text-red-600 bg-red-50';
    }
    if (severity === 'high') {
      return 'text-orange-600 bg-orange-50';
    }
    if (severity === 'medium') {
      return 'text-yellow-600 bg-yellow-50';
    }
    if (severity === 'low') {
      return 'text-gray-600 bg-gray-50';
    }

    const colorMap: Record<string, string> = {
      campaign_update: 'text-blue-600 bg-blue-50',
      spend_alert: 'text-red-600 bg-red-50',
      performance_change: 'text-green-600 bg-green-50',
      api_sync: 'text-purple-600 bg-purple-50',
      system_alert: 'text-gray-600 bg-gray-50',
      donation: 'text-green-600 bg-green-50',
      volunteer_signup: 'text-blue-600 bg-blue-50',
      event_registration: 'text-purple-600 bg-purple-50',
      document_upload: 'text-orange-600 bg-orange-50',
      contact_added: 'text-indigo-600 bg-indigo-50',
      email_sent: 'text-teal-600 bg-teal-50',
      call_made: 'text-cyan-600 bg-cyan-50',
      goal_reached: 'text-emerald-600 bg-emerald-50',
      alert: 'text-amber-600 bg-amber-50',
      social_share: 'text-pink-600 bg-pink-50',
    };
    return colorMap[type] || 'text-gray-600 bg-gray-50';
  };

  // Priority indicator
  const getPriorityIndicator = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      case 'high':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return null;
    }
  };

  // Filter activities
  const filteredActivities = filter
    ? activities.filter((a: ActivityEvent) => filter.includes(a.type))
    : activities;

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredActivities.slice(0, 5).map((activity: ActivityEvent) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <div
              key={activity.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onActivityClick?.(activity)}
            >
              <Icon className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{activity.title}</p>
              </div>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-5">
      {/* Enhanced Connection Status */}
      <ConnectionStatus
        isConnected={wsConnection.isConnected}
        isConnecting={wsConnection.isConnecting}
        error={wsConnection.error}
        reconnectAttempts={wsConnection.reconnectAttempts}
        maxReconnectAttempts={10}
        onReconnect={wsConnection.connect}
        compact={true}
        className="mb-4"
      />

      {/* Activity Feed */}
      <div
        ref={feedRef}
        className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scroll-fade-subtle"
      >
        {filteredActivities.map((activity: ActivityEvent) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type, activity.severity);

          return (
            <div
              key={activity.id}
              className={`group relative flex items-start space-x-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer ${
                activity.priority === 'critical' ? 'border-red-200 bg-red-50/30' : 'bg-white'
              }`}
              onClick={() => onActivityClick?.(activity)}
            >
              {/* Priority Indicator */}
              {activity.priority && (
                <div className="absolute top-2 right-2">
                  {getPriorityIndicator(activity.priority)}
                </div>
              )}

              {/* Icon */}
              <div className={`p-2.5 rounded-xl ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>

                    {/* Metadata */}
                    {activity.metadata && (
                      <div className="flex items-center space-x-4 mt-2">
                        {activity.metadata.amount && (
                          <span className="text-xs font-medium text-green-600">
                            ${activity.metadata.amount.toLocaleString()}
                          </span>
                        )}
                        {activity.metadata.location && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            {activity.metadata.location}
                          </span>
                        )}
                        {activity.metadata.tags && (
                          <div className="flex items-center space-x-1">
                            {activity.metadata.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* User Info */}
                    {activity.user && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {activity.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono uppercase">
                          {activity.user.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  {showTimestamps && (
                    <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                {activity.status && (
                  <div className="flex items-center space-x-1 mt-2">
                    {activity.status === 'success' && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                    {activity.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                    {activity.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                    {activity.status === 'warning' && (
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                    )}
                    <span
                      className={`text-xs capitalize ${
                        activity.status === 'success'
                          ? 'text-green-600'
                          : activity.status === 'pending'
                            ? 'text-yellow-600'
                            : activity.status === 'error'
                              ? 'text-red-600'
                              : 'text-amber-600'
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Arrow */}
              <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}

        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No activities to display</p>
          </div>
        )}
      </div>
    </div>
  );
};
