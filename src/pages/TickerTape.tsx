import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '../utils/logger';

const logger = createLogger('TickerTape');
import {
  TrendingUp,
  Zap,
  Target,
  Users,
  BarChart3,
  CheckCircle,
  Lightbulb,
  Globe,
  DollarSign,
  Calendar,
  Activity,
  Award,
  Video,
  AlertCircle,
  Shield,
  Bell,
} from 'lucide-react';
import { informationService } from '../services/informationService';
import { type InformationItem } from '../types/information';

const TickerTape: React.FC = () => {
  const [tickerItems, setTickerItems] = useState<InformationItem[]>([]);
  const navigate = useNavigate();

  // Icon mapping for information items
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
    // Load ticker items from information service
    const loadTickerItems = () => {
      const items = informationService.getTickerItems(20); // Get more items for continuous scroll
      setTickerItems(items);
    };

    loadTickerItems();

    // Refresh ticker items every 30 seconds
    const interval = setInterval(() => {
      informationService.refreshData();
      loadTickerItems();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (item: InformationItem, index: number) => {
    logger.debug(`Ticker item clicked: ${item.title}`);

    // Mark as read
    informationService.markAsRead(item.id);

    // Navigate to deep link
    navigate(item.deepLink);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'political-news':
        return 'text-blue-400';
      case 'smart-recommendations':
        return 'text-orange-400';
      case 'team-alerts':
        return 'text-red-400';
      default:
        return 'text-white/70';
    }
  };

  const getPriorityOpacity = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'opacity-100';
      case 'high':
        return 'opacity-90';
      case 'medium':
        return 'opacity-80';
      case 'low':
        return 'opacity-70';
      default:
        return 'opacity-80';
    }
  };

  const getIcon = (item: InformationItem) => {
    if (item.icon && iconMap[item.icon]) {
      return iconMap[item.icon];
    }

    // Fallback icons based on category
    switch (item.category) {
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-lg border-t border-white/20 overflow-hidden">
      <div className="h-8 flex items-center">
        <style>{`
          @keyframes ticker-scroll {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          
          .ticker-content {
            animation: ticker-scroll 60s linear infinite;
            will-change: transform;
          }
          
          .ticker-item {
            transition: all 0.3s ease;
          }
          
          .ticker-item:hover {
            transform: scale(1.05);
            background-color: rgba(255, 255, 255, 0.1);
          }
        `}</style>
        <div className="ticker-content flex items-center space-x-8 whitespace-nowrap">
          {/* Repeat items multiple times to ensure seamless loop */}
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => {
            const IconComponent = getIcon(item);
            return (
              <div
                key={`ticker-${item.id}-${index}`}
                className={`ticker-item flex items-center space-x-3 px-4 py-1 cursor-pointer rounded-lg transition-all duration-300 ${getPriorityOpacity(item.priority)}`}
                onClick={() => handleItemClick(item, index)}
                title={`${item.category.replace('-', ' ')} - ${item.priority} priority`}
              >
                <div
                  className={`p-1.5 rounded-full bg-black/20 ${getCategoryColor(item.category)}`}
                >
                  <IconComponent className="w-3 h-3" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/90 text-sm font-medium font-mono">{item.title}</span>
                  <span className="text-white/60 text-xs font-mono max-w-md truncate">
                    {item.text}
                  </span>
                </div>
                {/* Category indicator */}
                <div
                  className={`w-1 h-4 rounded-full ${getCategoryColor(item.category).replace('text-', 'bg-')}`}
                />
                {/* Priority indicator */}
                {item.priority === 'critical' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                {index < tickerItems.length * 3 - 1 && (
                  <div className="w-1 h-1 bg-white/30 rounded-full ml-8" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick access to Information Center */}
      <div className="absolute top-0 right-4 h-8 flex items-center">
        <button
          onClick={() => navigate('/alert-center')}
          className="text-white/50 hover:text-white/80 transition-colors text-xs font-mono"
          title="Open Alert Center"
        >
          View All →
        </button>
      </div>

      {/* Debug info (only in development) */}
      {import.meta.env.DEV && (
        <div className="absolute top-0 left-4 text-xs text-white/50">
          {tickerItems.length} items • Mixed feed
        </div>
      )}
    </div>
  );
};

export default TickerTape;
