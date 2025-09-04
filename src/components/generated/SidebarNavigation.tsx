import type React from 'react';
import { useState, useEffect, useRef } from 'react';
// Animation imports removed to prevent flashing
import { useNavigate, useLocation } from 'react-router-dom';
import { informationService } from '../../services/informationService';
import { type InformationItem } from '../../types/information';
import {
  getSectionTheme,
  getNavActiveClasses,
  getNavIconActiveClasses,
  getNavHoverClasses,
  getNavIconHoverClasses,
} from '../../utils/sectionTheming';
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

  // Load team alerts with proper cleanup
  useEffect(() => {
    let isSubscribed = true;

    const loadTeamAlerts = () => {
      if (isSubscribed) {
        const alerts = informationService.getTeamAlerts();
        setTeamAlerts(alerts);
      }
    };

    loadTeamAlerts();

    // Only refresh if component is still mounted and user is active
    const interval = setInterval(() => {
      if (isSubscribed && !document.hidden) {
        loadTeamAlerts();
      }
    }, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
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
      route: 'dashboard',
      active: location.pathname === '/',
      theme: getSectionTheme('/'),
      accent: 'var(--accent-dashboard)',
    },
    {
      icon: BarChart3,
      label: 'LIVE MONITORING',
      path: '/real-time-monitoring',
      route: 'live-monitoring',
      active: location.pathname === '/real-time-monitoring',
      theme: getSectionTheme('/real-time-monitoring'),
      accent: 'var(--accent-live-monitoring)',
    },
    {
      icon: Target,
      label: 'WAR ROOM',
      path: '/campaign-control',
      route: 'war-room',
      active: location.pathname === '/campaign-control',
      theme: getSectionTheme('/campaign-control'),
      accent: 'var(--accent-war-room)',
    },
    {
      icon: Brain,
      label: 'INTELLIGENCE',
      path: '/intelligence-hub',
      route: 'intelligence',
      active: location.pathname === '/intelligence-hub',
      theme: getSectionTheme('/intelligence-hub'),
      accent: 'var(--accent-intelligence)',
    },
    {
      icon: Bell,
      label: 'ALERT CENTER',
      path: '/alert-center',
      route: 'alert-center',
      active: location.pathname === '/alert-center',
      theme: getSectionTheme('/alert-center'),
      accent: 'var(--accent-alert-center)',
    },
    {
      icon: Settings,
      label: 'SETTINGS',
      path: '/settings',
      route: 'settings',
      active: location.pathname === '/settings',
      theme: getSectionTheme('/settings'),
      accent: 'var(--accent-settings)',
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Responsive - Click to go to Dashboard */}
          <button
            onClick={() => handleNavigation('/')}
            className="flex items-center ml-[25px] hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            {/* Full logo for large screens */}
            <img
              src="/images/WarRoom_Logo_White.png"
              alt="War Room"
              className="hidden lg:block h-[26px] w-auto object-contain"
              style={{ minWidth: '80px', maxWidth: '120px' }}
            />
            {/* Logomark for tablet */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F8686f311497044c0932b7d2247296478%2Ff489a630137d4a28b75e743a04ae8f49?format=webp&width=800"
              alt="War Room"
              className="hidden md:block lg:hidden h-[28px] w-auto object-contain"
              style={{ aspectRatio: '1/1' }}
            />
            {/* Small logo for mobile header */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F8686f311497044c0932b7d2247296478%2Ff489a630137d4a28b75e743a04ae8f49?format=webp&width=800"
              alt="War Room"
              className="block md:hidden h-[24px] w-auto"
            />
          </button>

          {/* Navigation Items - Responsive */}
          <div className="hidden md:flex items-center space-x-0.5 lg:space-x-1 xl:space-x-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                aria-current={item.active ? 'page' : undefined}
                data-route={item.route}
                style={
                  {
                    transition: 'all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '--item-accent': item.accent,
                  } as React.CSSProperties
                }
                className={`nav-item group px-1.5 lg:px-2 xl:px-3 py-1 rounded-lg text-[10px] md:text-[11px] lg:text-xs xl:text-sm flex items-center space-x-0.5 lg:space-x-1 ${
                  item.active
                    ? getNavActiveClasses(item.theme)
                    : 'text-white/70 hover:text-white hover:bg-white/10 hover:shadow-lg'
                }`}
              >
                {/* Hide icons on tablet, show on large screens */}
                <item.icon
                  className={`icon w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 flex-shrink-0 hidden lg:block ${
                    item.active
                      ? getNavIconActiveClasses(item.theme)
                      : getNavIconHoverClasses(item.theme)
                  }`}
                  style={{
                    transition: 'all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    ...(item.icon === Home
                      ? {
                          // More aggressive positioning - both states need similar adjustments
                          marginTop: '-2px', // Move up 2 pixels for better alignment
                          marginLeft: '-4px', // Move left 4 pixels relative to text
                          marginRight: '1px', // Compensate spacing
                        }
                      : {}),
                  }}
                />
                <span
                  className={`label ${item.active ? 'nav-active-text' : getNavHoverClasses(item.theme)} ${
                    ['LIVE MONITORING', 'WAR ROOM', 'ALERT CENTER'].includes(item.label)
                      ? 'nav-label'
                      : ''
                  }`}
                  style={{
                    transition: 'all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  {/* Full text for large screens */}
                  <span className="hidden lg:inline">{item.label}</span>
                  {/* Shorter text for tablet */}
                  <span className="lg:hidden">
                    {item.label === 'LIVE MONITORING'
                      ? 'LIVE'
                      : item.label === 'ALERT CENTER'
                        ? 'ALERTS'
                        : item.label}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Right Side Actions - Moved 25px left with tighter spacing */}
          <div className="flex items-center space-x-0.5 md:space-x-1 lg:space-x-1.5 xl:space-x-2 mr-[15px] lg:mr-[20px] xl:mr-[25px]">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1 md:p-1.5 lg:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 hover:shadow-md relative"
                style={{
                  transition: 'all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                <Bell className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                {unreadAlerts.length > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 notification-badge rounded-lg flex items-center justify-center transition-colors">
                    <span className="notification-badge-text text-[11px] font-medium">
                      {unreadAlerts.length}
                    </span>
                  </div>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50">
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
                                    className={`px-1.5 py-0.5 rounded text-xs ${getPriorityColor(alert.priority)}`}
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
                </div>
              )}
            </div>

            {/* User Profile */}
            <button
              onClick={() => navigate('/settings')}
              className="p-1 md:p-1.5 lg:p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 hover:shadow-md"
              style={{
                transition: 'all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
            </button>

            {/* Mobile Menu Button - Far Right */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 hover:shadow-md"
              style={{
                transition: 'all 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Proper Implementation */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Dropdown menu panel - attached to navigation */}
            <div className="md:hidden absolute right-0 top-full left-0 z-50">
              <div className="mx-4 mt-2 bg-slate-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Menu Items */}
                <div className="p-4 space-y-1">
                  {navItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleNavigation(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full px-4 py-4 rounded-xl font-medium text-left flex items-center space-x-4 text-base transition-all duration-200 ${
                        item.active
                          ? 'text-white font-semibold bg-white/20 border-l-4 border-l-white'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                      style={{ minHeight: '52px' }}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default TopNavigation;
