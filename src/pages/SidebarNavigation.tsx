import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { informationService } from '../services/informationService';
import { type InformationItem } from '../types/information';
import {
  getSectionTheme,
  getNavActiveClasses,
  getNavIconActiveClasses,
  getNavHoverClasses,
  getNavIconHoverClasses,
} from '../utils/sectionTheming';
import {
  Home,
  Target,
  Calendar,
  Zap,
  BarChart3,
  Settings,
  Search,
  Bell,
  User,
  Brain,
  Menu,
  X,
  TrendingUp,
  Activity,
} from 'lucide-react';

const TopNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [teamAlerts, setTeamAlerts] = useState<InformationItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Get current section theme
  const currentTheme = getSectionTheme(location.pathname);

  // Load team alerts
  useEffect(() => {
    const loadTeamAlerts = () => {
      const alerts = informationService.getTeamAlerts();
      setTeamAlerts(alerts);
    };

    loadTeamAlerts();

    // Refresh every 30 seconds
    const interval = setInterval(loadTeamAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const navItems = [
    {
      icon: Home,
      label: 'DASHBOARD',
      path: '/',
      active: location.pathname === '/',
      theme: getSectionTheme('/'),
    },
    {
      icon: BarChart3,
      label: 'LIVE MONITORING',
      path: '/real-time-monitoring',
      active: location.pathname === '/real-time-monitoring',
      theme: getSectionTheme('/real-time-monitoring'),
    },
    {
      icon: Target,
      label: 'WAR ROOM',
      path: '/campaign-control',
      active: location.pathname === '/campaign-control',
      theme: getSectionTheme('/campaign-control'),
    },
    {
      icon: Brain,
      label: 'INTELLIGENCE',
      path: '/intelligence-hub',
      active: location.pathname === '/intelligence-hub',
      theme: getSectionTheme('/intelligence-hub'),
    },
    {
      icon: Bell,
      label: 'ALERT CENTER',
      path: '/alert-center',
      active: location.pathname === '/alert-center',
      theme: getSectionTheme('/alert-center'),
    },
    {
      icon: Settings,
      label: 'SETTINGS',
      path: '/settings',
      active: location.pathname === '/settings',
      theme: getSectionTheme('/settings'),
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleNotificationClick = (alert: InformationItem) => {
    informationService.markAsRead(alert.id);
    setShowNotifications(false);
    navigate(alert.deepLink);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const unreadAlerts = teamAlerts.filter((alert) => alert.status === 'unread');

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-purple-500/30"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <img
              src="/src/assets/images/war-room-logo.png"
              alt="War Room"
              className="h-10 w-auto"
            />
          </div>

          {/* Navigation Items - Compact spacing */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigation(item.path)}
                aria-current={item.active ? 'page' : undefined}
                className={`group px-3 py-1 rounded-lg text-sm transition-all duration-200 flex items-center space-x-1 ${
                  item.active ? getNavActiveClasses(item.theme) : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 ${item.icon === Home ? '-translate-y-0.5' : ''} ${
                    item.active
                      ? getNavIconActiveClasses(item.theme)
                      : getNavIconHoverClasses(item.theme)
                  }`}
                />
                <span
                  className={`whitespace-nowrap overflow-hidden text-ellipsis ${item.active ? '' : getNavHoverClasses(item.theme)}`}
                >
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadAlerts.length > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center justify-center transition-colors">
                    <span className="text-red-400 text-[11px] font-medium">
                      {unreadAlerts.length}
                    </span>
                  </div>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-800 font-semibold">
                        Team Alerts ({unreadAlerts.length})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate('/alert-center')}
                          className="text-gray-600 hover:text-gray-800 transition-colors text-xs"
                        >
                          View All
                        </button>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {teamAlerts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No team alerts at this time
                        </div>
                      ) : (
                        teamAlerts.slice(0, 5).map((alert) => (
                          <div
                            key={alert.id}
                            onClick={() => handleNotificationClick(alert)}
                            className={`p-3 rounded-lg border hover:bg-gray-200/50 transition-colors cursor-pointer ${
                              alert.status === 'unread'
                                ? 'bg-gray-100/70 border-gray-200/50'
                                : 'bg-gray-50/50 border-gray-200/30'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getPriorityColor(alert.priority)}`}>
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <div className="text-gray-800 font-medium text-sm">
                                    {alert.title}
                                  </div>
                                  {alert.status === 'unread' && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                                <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                                  {alert.text}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="text-gray-500 text-xs">
                                    {formatTimestamp(alert.timestamp)}
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-xs ${
                                      alert.priority === 'critical'
                                        ? 'bg-red-100 text-red-600'
                                        : alert.priority === 'high'
                                          ? 'bg-orange-100 text-orange-600'
                                          : alert.priority === 'medium'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {alert.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* User Profile */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <User className="w-5 h-5" />
            </motion.button>

            {/* Mobile Menu Button - Far Right */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Full Screen Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden fixed inset-0 bg-white z-50"
            >
              {/* Close Button */}
              <div className="flex justify-end p-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-white/70 hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Menu Items */}
              <div className="px-6 py-4 space-y-4">
                {navItems.map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleNavigation(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`group w-full px-6 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-3 ${
                      item.active
                        ? `text-white font-extrabold border-l-4 border-l-white/20`
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                    aria-current={item.active ? 'page' : undefined}
                  >
                    <item.icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        item.active
                          ? getNavIconActiveClasses(item.theme)
                          : getNavIconHoverClasses(item.theme)
                      }`}
                    />
                    <span
                      className={`text-lg ${item.active ? '' : getNavHoverClasses(item.theme)}`}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default TopNavigation;
