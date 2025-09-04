import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const items = informationService.getTickerItems(20);
      setTickerItems(items);
    };

    loadTickerItems();

    // Refresh ticker items every 30 seconds
    // Only refresh when page is visible and component mounted
    const interval = setInterval(() => {
      if (!document.hidden) {
        informationService.refreshData();
        loadTickerItems();
      }
    }, 45000); // Increased interval to reduce resource usage

    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (item: InformationItem, index: number) => {
    // Mark as read
    informationService.markAsRead(item.id);
    // Navigate to deep link
    navigate(item.deepLink);
  };

  const getCategoryColor = (category: string) => {
    // Use CSS variable for consistent theming
    return 'ticker-accent';
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

  // Render individual ticker item
  const renderTickerItem = (item: InformationItem, index: number, keyPrefix: string) => {
    const IconComponent = getIcon(item);
    return (
      <div
        key={`${keyPrefix}-${item.id}-${index}`}
        className={`ticker-item flex items-center space-x-3 px-4 py-1 cursor-pointer rounded-lg ${getPriorityOpacity(item.priority)}`}
        onClick={() => handleItemClick(item, index)}
        title={`${item.category.replace('-', ' ')} - ${item.priority} priority`}
      >
        <div className={`p-1.5 rounded-full bg-black/20 ${getCategoryColor(item.category)}`}>
          <IconComponent className="w-3 h-3 ticker-accent" />
        </div>
        <div className="flex flex-col py-1 space-y-0">
          <span className="text-white/90 text-sm font-medium font-mono uppercase">
            {item.title}
          </span>
          <span className="text-white/60 text-xs font-mono max-w-md truncate uppercase">
            {item.text}
          </span>
        </div>
        <div className="w-1 h-4 rounded-full ticker-accent-bg" />
        {item.priority === 'critical' && (
          <div className="w-2 h-2 ticker-accent-bg rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  if (tickerItems.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 border-t border-white/20 h-12 flex items-center justify-center">
        <span className="text-white/50 text-sm font-mono">Loading ticker...</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 border-t border-white/20 overflow-hidden h-12">
      <style>{`
        @keyframes ticker-seamless {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .ticker-track {
          animation: ticker-seamless 45s linear infinite;
          will-change: transform;
          display: flex;
          align-items: center;
          white-space: nowrap;
          gap: 2rem;
          height: 48px;
        }

        /* Override reduced motion for essential ticker functionality */
        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: ticker-seamless 45s linear infinite !important;
          }
        }

        .ticker-track:hover {
          animation-play-state: paused;
        }

        .ticker-item {
          transition: transform 0.2s ease, background-color 0.2s ease;
          flex-shrink: 0;
        }

        .ticker-item:hover {
          transform: scale(1.02);
          background-color: rgba(255, 255, 255, 0.1);
        }

        .ticker-content {
          display: flex;
          gap: 2rem;
          flex-shrink: 0;
        }
      `}</style>

      <div className="ticker-track">
        {/* First copy of content */}
        <div className="ticker-content">
          {tickerItems.map((item, index) => renderTickerItem(item, index, 'first'))}
        </div>

        {/* Second copy for seamless loop - positioned immediately after first */}
        <div className="ticker-content">
          {tickerItems.map((item, index) => renderTickerItem(item, index, 'second'))}
        </div>
      </div>

      {/* Quick access to Information Center */}
      <div className="absolute top-0 right-4 h-12 flex items-center">
        <button
          onClick={() => navigate('/alert-center')}
          className="text-white/50 hover:text-white/80 transition-colors text-xs font-mono uppercase"
          title="Open Alert Center"
        >
          View All →
        </button>
      </div>
    </div>
  );
};

export default TickerTape;
