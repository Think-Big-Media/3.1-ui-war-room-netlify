/**
 * Main Layout Component - CleanMyMac-inspired design
 * Professional desktop-first campaign intelligence interface
 */

import type React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
// import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Shield,
  Zap,
  AlertCircle,
  ChevronLeft,
  Menu,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
}

export function MainLayout() {
  console.error('🚨🚨🚨 MAINLAYOUT LOADED - DEBUG BANNER SHOULD BE VISIBLE 🚨🚨🚨');
  const navigate = useNavigate();
  const location = useLocation();
  // const { user, signOut } = useSupabaseAuth();
  const user = { email: 'demo@warroom.com' }; // Temporary mock user
  const signOut = async () => {};
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      path: '/documents',
      badge: 3,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
    },
    { id: 'contacts', label: 'Contacts', icon: Users, path: '/contacts' },
    { id: 'automation', label: 'Automation', icon: Zap, path: '/automation' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* DEBUG BANNER - REMOVE AFTER TESTING */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black text-center py-2 font-bold">
        🚨 DEBUG: Changes Applied at {new Date().toLocaleTimeString()} - Font: 15px (90% scale) - No
        Transitions
      </div>
      <div className="flex h-screen bg-gray-50 overflow-hidden pt-8">
        {/* Sidebar */}
        <div
          className={`${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-white border-r border-gray-200 flex flex-col`}
        >
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <span className="ml-3 text-xl font-bold text-gray-900">War Room</span>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              {isSidebarCollapsed ? (
                <Menu className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                  group relative
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                >
                  <div className="flex items-center">
                    {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-100 p-3">
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">D</span>
                </div>
                {!isSidebarCollapsed && (
                  <div className="ml-3 text-left flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">Demo User</p>
                    <p className="text-xs text-gray-500">Campaign Manager</p>
                  </div>
                )}
              </button>

              {/* Profile Menu */}
              {isProfileMenuOpen && !isSidebarCollapsed && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center flex-1">
              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns, documents, contacts..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Alert Status */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
