import type React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Globe,
  Target,
  Bell,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Archive,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Shield,
  Video,
  Award,
  BarChart3,
  Lightbulb,
  Zap,
} from 'lucide-react';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import { informationService } from '../services/informationService';
import { type InformationItem, type InformationFilters } from '../types/information';

const InformationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('live-stream');
  const [items, setItems] = useState<InformationItem[]>([]);
  const [filters, setFilters] = useState<InformationFilters>({
    category: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Icon mapping
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    TrendingUp,
    DollarSign,
    Lightbulb,
    Globe,
    Activity,
    BarChart3,
    Calendar,
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

  useEffect(() => {
    // Check for deep link parameters
    const category = searchParams.get('category');
    const itemId = searchParams.get('item');

    if (category && category !== 'all') {
      setActiveTab('notification-center');
      setFilters((prev) => ({
        ...prev,
        category: category as InformationFilters['category'],
      }));
    }

    if (itemId) {
      // Mark specific item as read and scroll to it
      informationService.markAsRead(itemId);
    }

    loadItems();
  }, [searchParams]);

  useEffect(() => {
    loadItems();
  }, [filters, activeTab]);

  const loadItems = () => {
    const filteredItems = informationService.getItems(filters);
    setItems(filteredItems);
  };

  const handleItemClick = (item: InformationItem) => {
    informationService.markAsRead(item.id);
    navigate(item.deepLink);
  };

  const handleMarkAllAsRead = () => {
    informationService.markAllAsRead();
    loadItems();
  };

  const getCategoryIcon = (category: string) => {
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

  const getCategoryColor = (category: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const getIcon = (item: InformationItem) => {
    if (item.icon && iconMap[item.icon]) {
      return iconMap[item.icon];
    }
    return getCategoryIcon(item.category);
  };

  const formatTimestamp = (timestamp: string) => {
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

  return (
    <PageLayout
      pageTitle="Information Center"
      placeholder="Ask War Room about campaign information..."
    >
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-3 overflow-x-auto">
        {[
          { id: 'live-stream', label: 'Live Stream', icon: Activity },
          {
            id: 'notification-center',
            label: 'Notification Center',
            icon: Bell,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Live Stream Tab */}
      {activeTab === 'live-stream' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Political News',
                count: items.filter((i) => i.category === 'political-news').length,
                icon: Globe,
                color: 'text-blue-400',
              },
              {
                title: 'Smart Recommendations',
                count: items.filter((i) => i.category === 'smart-recommendations').length,
                icon: Target,
                color: 'text-orange-400',
              },
              {
                title: 'Team Alerts',
                count: items.filter((i) => i.category === 'team-alerts').length,
                icon: Bell,
                color: 'text-red-400',
              },
            ].map((stat, index) => (
              <Card key={index} className="text-center" padding="sm" variant="glass">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold font-condensed text-white/95">{stat.count}</div>
                <div className="text-sm text-white/70">{stat.title}</div>
              </Card>
            ))}
          </div>

          {/* Live Stream Items */}
          <Card padding="md" variant="glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header">Live Stream</h3>
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Mark All as Read
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto scroll-fade">
              {items.slice(0, 20).map((item) => {
                const IconComponent = getIcon(item);
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      item.status === 'unread'
                        ? 'bg-white/10 border-white/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-white/95">{item.title}</h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)} border`}
                          >
                            {item.priority}
                          </span>
                          {item.status === 'unread' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-white/70 text-sm mb-2">{item.text}</p>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          <span className="capitalize">{item.category.replace('-', ' ')}</span>
                          {item.actionable && <span className="text-green-400">• Actionable</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Notification Center Tab */}
      {activeTab === 'notification-center' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filters */}
          <Card padding="sm" variant="glass">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search information..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                    className="pl-10 bg-black/20 border border-white/30 rounded-xl px-3 py-2.5 text-white/70 placeholder-white/50 focus:outline-none focus:ring-0 transition-all duration-300"
                  />
                </div>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value as InformationFilters['category'],
                    }))
                  }
                  className="bg-black/20 border border-white/30 rounded-xl px-3 py-2.5 text-white/70 focus:outline-none focus:ring-0 transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="political-news">Political News</option>
                  <option value="smart-recommendations">Smart Recommendations</option>
                  <option value="team-alerts">Team Alerts</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value as InformationFilters['priority'],
                    }))
                  }
                  className="bg-black/20 border border-white/30 rounded-xl px-3 py-2.5 text-white/70 focus:outline-none focus:ring-0 transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value as InformationFilters['status'],
                    }))
                  }
                  className="bg-black/20 border border-white/30 rounded-xl px-3 py-2.5 text-white/70 focus:outline-none focus:ring-0 transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/70 text-sm">{items.length} items</span>
                <button onClick={handleMarkAllAsRead} className="btn-secondary-neutral">
                  Mark All Read
                </button>
              </div>
            </div>
          </Card>

          {/* Organized Items */}
          <div className="space-y-4 pb-5">
            {items.map((item) => {
              const IconComponent = getIcon(item);
              return (
                <Card
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  className={`cursor-pointer border-l-4 ${getPriorityColor(item.priority)}`}
                  padding="sm"
                  variant="glass"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-white/95">{item.title}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)} border`}
                        >
                          {item.priority}
                        </span>
                        {item.status === 'unread' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-white/80 mb-3">{item.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          <span className="capitalize">{item.category.replace('-', ' ')}</span>
                          {item.actionable && <span className="text-green-400">• Actionable</span>}
                          {item.metadata?.assignee && <span>• {item.metadata.assignee}</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              informationService.markAsRead(item.id);
                              loadItems();
                            }}
                            className="text-white/70 hover:text-white transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="text-white/70 hover:text-white transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </PageLayout>
  );
};

export default InformationCenter;
