// Campaign Control Utility Functions

import React from 'react';
import { Image, Video, FileText, Play, Folder, Target, Users, Activity, Zap } from 'lucide-react';

import {
  type ProjectStatus,
  type ProjectPriority,
  type AssetType,
  type ActivityType,
} from '../../types/campaign';

// Status color utilities - using neutral backgrounds with accent borders
export const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case 'planning':
      return 'bg-transparent text-white/90 border border-white/20';
    case 'in-progress':
      return 'bg-transparent text-white/90 border border-white/20';
    case 'review':
      return 'bg-transparent text-white/90 border border-white/20';
    case 'completed':
      return 'bg-transparent text-white/90 border border-white/20';
    default:
      return 'bg-transparent text-white/90 border border-white/20';
  }
};

// Priority color utilities - using neutral backgrounds with accent text
export const getPriorityColor = (priority: ProjectPriority): string => {
  switch (priority) {
    case 'urgent':
      return 'border-l-4 border-l-red-500 bg-transparent';
    case 'high':
      return 'border-l-4 border-l-orange-500 bg-transparent';
    case 'medium':
      return 'border-l-4 border-l-yellow-500 bg-transparent';
    case 'low':
      return 'border-l-4 border-l-gray-500 bg-transparent';
    default:
      return 'border-l-4 border-l-gray-500 bg-transparent';
  }
};

// Asset icon utilities
export const getAssetIcon = (type: AssetType) => {
  switch (type) {
    case 'image':
      return <Image className="w-5 h-5 text-blue-400" />;
    case 'video':
      return <Video className="w-5 h-5 text-purple-400" />;
    case 'document':
      return <FileText className="w-5 h-5 text-green-400" />;
    case 'audio':
      return <Play className="w-5 h-5 text-orange-400" />;
    case 'template':
      return <Folder className="w-5 h-5 text-yellow-400" />;
    default:
      return <FileText className="w-5 h-5 text-gray-400" />;
  }
};

// Activity icon utilities
export const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'project':
      return <Target className="w-4 h-4 text-blue-400" />;
    case 'asset':
      return <FileText className="w-4 h-4 text-green-400" />;
    case 'team':
      return <Users className="w-4 h-4 text-purple-400" />;
    case 'system':
      return <Zap className="w-4 h-4 text-orange-400" />;
    default:
      return <Activity className="w-4 h-4 text-gray-400" />;
  }
};

// Avatar generation utility
export const generateAvatar = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};
