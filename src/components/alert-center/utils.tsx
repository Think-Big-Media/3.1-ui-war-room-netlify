import type React from 'react';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  FileText,
  Bell,
  Clock,
  CheckCircle,
  Globe,
  Target,
  Activity,
  DollarSign,
  Lightbulb,
  BarChart3,
  Users,
  Zap,
  Award,
  Video,
} from 'lucide-react';
import { Alert } from '../../types/alert';

// Icon mapping for information items
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  DollarSign,
  Lightbulb,
  Globe,
  Activity,
  BarChart3,
  Calendar: Clock,
  Target,
  Users,
  Zap,
  Award,
  Video,
  CheckCircle,
  AlertCircle,
  Shield,
  Bell,
};

// Get alert icon based on type
export const getAlertIcon = (type: string) => {
  switch (type) {
    case 'crisis':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'opportunity':
      return <TrendingUp className="w-5 h-5 text-green-400" />;
    case 'polling-shift':
      return <TrendingDown className="w-5 h-5 text-blue-400" />;
    case 'ad-violation':
      return <Shield className="w-5 h-5 text-yellow-400" />;
    case 'media-coverage':
      return <FileText className="w-5 h-5 text-purple-400" />;
    default:
      return <Bell className="w-5 h-5 text-gray-400" />;
  }
};

// Get priority color class
export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'border-red-500 bg-red-500/10';
    case 'high':
      return 'border-orange-500 bg-orange-500/10';
    case 'medium':
      return 'border-yellow-500 bg-yellow-500/10';
    case 'low':
      return 'border-gray-500 bg-gray-500/10';
    default:
      return 'border-gray-500 bg-gray-500/10';
  }
};

// Get status color class
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-500';
    case 'in-progress':
      return 'bg-yellow-500';
    case 'resolved':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

// Get status icon
export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new':
      return <Bell className="w-4 h-4" />;
    case 'in-progress':
      return <Clock className="w-4 h-4" />;
    case 'resolved':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

// Get category icon for information items
export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'political-news':
      return Globe;
    case 'smart-recommendations':
      return Target;
    case 'team-alerts':
      return Bell;
    default:
      return Activity;
  }
};

// Get category color for information items
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'political-news':
      return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
    case 'smart-recommendations':
      return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
    case 'team-alerts':
      return 'text-red-400 bg-red-400/20 border-red-400/30';
    default:
      return 'text-white/70 bg-white/20 border-white/30';
  }
};

// Format timestamp to relative time
export const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    return `${Math.floor(diffMinutes / 60)}h ago`;
  }
  return `${Math.floor(diffMinutes / 1440)}d ago`;
};
