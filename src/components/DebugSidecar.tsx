import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Bug,
  X,
  Database,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Settings,
  Move,
  TrendingUp,
  TrendingDown,
  MapPin,
} from 'lucide-react';
import { safeParseJSON, safeSetJSON, isLocalStorageAvailable } from '../utils/localStorage';
import { useDataMode } from '../hooks/useDataMode';
import { useMentionlyticsDashboard } from '../hooks/useMentionlytics';
import { api } from '../lib/api';
import { API_BASE_URL } from '../config/constants';

interface DebugSidecarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DebugPanelSettings {
  selectedEndpoint: string;
  lastTestResults: Record<string, any>;
  testParameters: Record<string, Record<string, any>>;
  preferredDataMode: 'MOCK' | 'LIVE';
}

const DEFAULT_DEBUG_SETTINGS: DebugPanelSettings = {
  selectedEndpoint: '',
  lastTestResults: {},
  testParameters: {},
  preferredDataMode: 'MOCK',
};

export const DebugSidecar: React.FC<DebugSidecarProps> = ({ isOpen, onClose }) => {
  
  // Custom close handler that exits admin mode completely
  const handleAdminExit = () => {
    console.log('🔧 [DEBUG-PANEL] X button clicked - Exiting admin mode securely');
    
    // Clear admin mode from localStorage SAFELY
    if (isLocalStorageAvailable()) {
      safeSetJSON('war-room-admin-mode', false, false); // Silent errors for exit
      safeSetJSON('war-room-admin-session', null, false); // Clear auth session
    }
    
    // Dispatch admin mode change event to notify other components
    const event = new CustomEvent('admin-mode-change', { 
      detail: { isAdminMode: false } 
    });
    window.dispatchEvent(event);
    
    // Call the original onClose handler
    onClose();
    
    // Navigate back to dashboard
    window.location.href = '/';
    console.log('🔧 [SUCCESS] Debug panel X - Admin mode exited securely');
  };
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>(
    []
  );
  // Resizing state
  const [panelHeight, setPanelHeight] = useState(() => {
    // Default to 50% of window height
    return Math.floor(window.innerHeight * 0.5);
  });
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);
  const [systemStats, setSystemStats] = useState({
    memory: 0,
    apiCalls: 0,
    errors: 0,
    uptime: '00:00:00',
  });
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: 'Not tested' });
  // Load persisted settings
  const [debugSettings, setDebugSettings] = useState<DebugPanelSettings>(() => {
    const saved = safeParseJSON<DebugPanelSettings>('debug-panel-settings', {
      fallback: DEFAULT_DEBUG_SETTINGS,
    });
    return saved || DEFAULT_DEBUG_SETTINGS;
  });

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(debugSettings.selectedEndpoint);
  const [endpointTestResult, setEndpointTestResult] = useState<any>(null);
  const { isLive, toggleMode, dataMode } = useDataMode();
  const { sentiment, loading, error, dataMode: hookDataMode } = useMentionlyticsDashboard();
  const [startTime] = useState(Date.now());
  const location = useLocation();

  // All API endpoints from backend
  const API_ENDPOINTS = [
    // Auth endpoints
    { id: 'auth-register', name: 'Register User', method: 'POST', path: '/api/v1/auth/register' },
    { id: 'auth-login', name: 'Login User', method: 'POST', path: '/api/v1/auth/login' },
    { id: 'auth-me', name: 'Get Current User', method: 'GET', path: '/api/v1/auth/me' },
    {
      id: 'auth-test-flow',
      name: 'Test Auth Flow',
      method: 'GET',
      path: '/api/v1/auth/test-auth-flow',
    },

    // Monitoring endpoints
    { id: 'monitoring-health', name: 'Health Check', method: 'GET', path: '/health' },
    { id: 'monitoring-ping', name: 'Ping', method: 'GET', path: '/ping' },
    { id: 'monitoring-status', name: 'Status', method: 'GET', path: '/status' },
    {
      id: 'monitoring-mentions',
      name: 'Get Mentions',
      method: 'GET',
      path: '/api/v1/monitoring/mentions',
    },
    {
      id: 'monitoring-sentiment',
      name: 'Sentiment Analysis',
      method: 'GET',
      path: '/api/v1/monitoring/sentiment',
    },
    {
      id: 'monitoring-trends',
      name: 'Trending Topics',
      method: 'GET',
      path: '/api/v1/monitoring/trends',
    },

    // Analytics endpoints
    {
      id: 'analytics-summary',
      name: 'Analytics Summary',
      method: 'GET',
      path: '/api/v1/analytics/summary',
    },
    {
      id: 'analytics-sentiment',
      name: 'Sentiment Trend',
      method: 'GET',
      path: '/api/v1/analytics/sentiment',
    },

    // Alerting endpoints
    {
      id: 'alerting-crisis',
      name: 'Crisis Detection',
      method: 'GET',
      path: '/api/v1/alerts/crisis',
    },
    { id: 'alerting-list', name: 'List Alerts', method: 'GET', path: '/api/v1/crisis/alerts' },
    { id: 'alerting-test', name: 'Test Alert', method: 'POST', path: '/api/v1/alerts/test' },

    // Intelligence endpoints
    {
      id: 'intelligence-documents',
      name: 'List Documents',
      method: 'GET',
      path: '/api/v1/documents',
    },
    {
      id: 'intelligence-chat-history',
      name: 'Chat History',
      method: 'GET',
      path: '/api/v1/chat/history',
    },

    // Reporting endpoints
    {
      id: 'reporting-generate',
      name: 'Generate Report',
      method: 'POST',
      path: '/api/v1/reports/generate',
    },
  ];

  // Helper function to add logs
  const addLog = (level: string, message: string) => {
    setLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      },
      ...prev.slice(0, 49),
    ]); // Keep last 50 logs
  };

  // Persistence helper functions
  const saveDebugSettings = (newSettings: Partial<DebugPanelSettings>) => {
    const updated = { ...debugSettings, ...newSettings };
    setDebugSettings(updated);
    safeSetJSON('debug-panel-settings', updated);
    addLog('debug', `Settings saved: ${Object.keys(newSettings).join(', ')}`);
  };

  const resetDebugSettings = () => {
    setDebugSettings(DEFAULT_DEBUG_SETTINGS);
    setSelectedEndpoint('');
    setEndpointTestResult(null);
    safeSetJSON('debug-panel-settings', DEFAULT_DEBUG_SETTINGS);
    addLog('info', 'Debug panel settings reset to defaults');
  };

  // 🔍 Page-Specific Admin Details
  const getPageSpecificInfo = () => {
    const path = location.pathname;
    const currentTime = new Date().toLocaleTimeString();
    
    const pageInfo: { [key: string]: { name: string; components: string[]; apis: string[]; features: string[] } } = {
      '/': {
        name: 'Dashboard',
        components: ['SWOT Radar', 'Activity Feed', 'Quick Stats', 'Navigation'],
        apis: ['/api/v1/analytics/summary', '/api/v1/monitoring/mentions', '/health'],
        features: ['Real-time metrics', 'SWOT analysis', 'Activity tracking']
      },
      '/command-center': {
        name: 'Command Center', 
        components: ['Command Panel', 'System Status', 'Action Buttons'],
        apis: ['/api/v1/command/status', '/api/v1/system/health'],
        features: ['System control', 'Command execution', 'Status monitoring']
      },
      '/real-time-monitoring': {
        name: 'Live Monitoring',
        components: ['Live Feed', 'Metrics Dashboard', 'Alert Panel'], 
        apis: ['/api/v1/monitoring/mentions', '/api/v1/monitoring/sentiment', '/api/v1/monitoring/trends'],
        features: ['Real-time data', 'Sentiment analysis', 'Trend detection']
      },
      '/campaign-control': {
        name: 'War Room',
        components: ['Campaign Manager', 'Performance Metrics', 'Control Panel'],
        apis: ['/api/v1/campaigns/active', '/api/v1/analytics/performance'],
        features: ['Campaign management', 'Performance tracking', 'Control operations']
      },
      '/intelligence-hub': {
        name: 'Intelligence Hub',
        components: ['Intel Feed', 'Analysis Tools', 'Report Generator'],
        apis: ['/api/v1/intelligence/reports', '/api/v1/analytics/intelligence'],
        features: ['Intelligence gathering', 'Data analysis', 'Report generation']
      },
      '/alert-center': {
        name: 'Alert Center',
        components: ['Alert List', 'Notification Panel', 'Priority Queue'],
        apis: ['/api/v1/alerts/active', '/api/v1/notifications/status'],
        features: ['Alert management', 'Notification system', 'Priority handling']
      },
      '/settings': {
        name: 'Settings',
        components: ['Configuration Panel', 'User Preferences', 'System Settings'],
        apis: ['/api/v1/config/user', '/api/v1/system/settings'],
        features: ['User configuration', 'System settings', 'Preference management']
      },
      '/admin-dashboard': {
        name: 'Admin Dashboard',
        components: ['Admin Controls', 'System Overview', 'Management Tools'],
        apis: ['/api/v1/admin/stats', '/api/v1/system/overview', '/health'],
        features: ['System administration', 'User management', 'System monitoring']
      }
    };

    const currentPage = pageInfo[path] || {
      name: 'Unknown Page',
      components: ['Standard Layout', 'Navigation'],
      apis: ['/health'],
      features: ['Basic functionality']
    };

    return {
      ...currentPage,
      path,
      timestamp: currentTime,
      dataMode: dataMode
    };
  };

  // Simulate debug logs
  useEffect(() => {
    if (!isOpen) return;

    // Initial logs
    addLog('info', `Debug sidecar opened - Mode: ${dataMode}`);
    addLog('info', `Backend connection: ${error ? 'Failed' : 'Ready'}`);
    addLog('info', `Backend URL configured: ${API_BASE_URL}`);

    // Auto-test connection on first open
    setTimeout(() => {
      testBackendConnection();
    }, 1000);

    // Periodic system updates
    const interval = setInterval(() => {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;

      setSystemStats((prev) => ({
        memory: Math.floor(Math.random() * 100),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 3),
        errors: error ? prev.errors + 1 : prev.errors,
        uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      }));

      if (Math.random() > 0.7) {
        const messages = [
          'Fetching Mentionlytics data...',
          'Processing sentiment analysis...',
          'Updating real-time metrics...',
          'Caching competitor data...',
          'Refreshing dashboard widgets...',
        ];
        addLog('debug', messages[Math.floor(Math.random() * messages.length)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, dataMode, error, startTime]);

  // Load previous test results when endpoint is selected
  useEffect(() => {
    if (selectedEndpoint && debugSettings.lastTestResults[selectedEndpoint]) {
      const previousResult = debugSettings.lastTestResults[selectedEndpoint];
      setEndpointTestResult(previousResult);
      addLog(
        'info',
        `Loaded previous test result for ${selectedEndpoint} from ${new Date(previousResult.timestamp).toLocaleTimeString()}`
      );
    }
  }, [selectedEndpoint, debugSettings.lastTestResults]);

  const testBackendConnection = async () => {
    setConnectionTest({ status: 'testing', message: 'Testing connection...' });
    addLog('info', `Testing backend connection to ${API_BASE_URL}`);

    try {
      // Try multiple health check endpoints
      const endpoints = ['/health', '/api/health', '/api/v1/health', '/'];
      let success = false;
      let lastError = '';

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          setConnectionTest({
            status: 'success',
            message: `Connected! Endpoint: ${endpoint} (${response.status})`,
          });
          addLog('success', `Backend connection successful: ${endpoint}`);
          success = true;
          break;
        } catch (err: any) {
          lastError = err.message || 'Unknown error';
          addLog('warn', `Endpoint ${endpoint} failed: ${lastError}`);
        }
      }

      if (!success) {
        throw new Error(lastError);
      }
    } catch (err: any) {
      setConnectionTest({
        status: 'error',
        message: `Connection failed: ${err.message}`,
      });
      addLog('error', `Backend connection failed: ${err.message}`);
    }
  };

  const testSpecificEndpoint = async () => {
    if (!selectedEndpoint) return;

    const endpoint = API_ENDPOINTS.find((e) => e.id === selectedEndpoint);
    if (!endpoint) return;

    addLog('info', `Testing endpoint: ${endpoint.path}`);
    setEndpointTestResult(null);

    try {
      const startTime = Date.now();
      let response;

      if (endpoint.method === 'GET') {
        response = await api.get(endpoint.path);
      } else if (endpoint.method === 'POST') {
        // Send minimal test data for POST endpoints
        const testData = endpoint.path.includes('auth/register')
          ? { email: 'test@example.com', password: 'test123' }
          : endpoint.path.includes('auth/login')
            ? { email: 'test@example.com', password: 'test123' }
            : {};
        response = await api.post(endpoint.path, testData);
      }

      const responseTime = Date.now() - startTime;
      const testResult = {
        success: true,
        status: response.status,
        data: response.data,
        responseTime,
        timestamp: new Date().toISOString(),
      };
      setEndpointTestResult(testResult);
      // Persist the test result
      const updatedResults = { ...debugSettings.lastTestResults, [selectedEndpoint]: testResult };
      saveDebugSettings({ lastTestResults: updatedResults });
      addLog('success', `${endpoint.name} - ${response.status} (${responseTime}ms)`);
    } catch (err: any) {
      const testResult = {
        success: false,
        error: err.message,
        status: err.response?.status,
        timestamp: new Date().toISOString(),
      };
      setEndpointTestResult(testResult);
      // Persist the error result
      const updatedResults = { ...debugSettings.lastTestResults, [selectedEndpoint]: testResult };
      saveDebugSettings({ lastTestResults: updatedResults });
      addLog('error', `${endpoint.name} failed: ${err.message}`);
    }
  };

  const getConnectionStatus = () => {
    if (error) return { status: 'error', color: 'text-red-400', icon: WifiOff };
    if (loading) return { status: 'connecting', color: 'text-yellow-400', icon: Activity };
    return { status: 'connected', color: 'text-green-400', icon: Wifi };
  };

  const connection = getConnectionStatus();
  const ConnectionIcon = connection.icon;

  // Resizing functionality
  // Fixed resizing handlers with proper event handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    console.log('🔧 [RESIZE] Starting resize operation');
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = panelHeight;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      const newHeight = Math.min(
        Math.max(startHeight.current + deltaY, 200), // Min height 200px
        window.innerHeight - 100 // Max height (leave 100px from top)
      );
      setPanelHeight(newHeight);
      console.log('🔧 [RESIZE] New height:', newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      console.log('🔧 [RESIZE] Resize operation completed');
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelHeight]);

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => {
      // Cleanup any stray event listeners on unmount
      setIsResizing(false);
    };
  }, []);

  // Get Mentionlytics status
  const getMentionlyticsStatus = () => {
    if (loading) return { status: 'connecting', color: 'text-yellow-400', icon: Activity, message: 'Connecting to Mentionlytics...' };
    if (error) return { status: 'error', color: 'text-red-400', icon: AlertCircle, message: 'Mentionlytics connection failed' };
    if (sentiment) return { status: 'active', color: 'text-green-400', icon: CheckCircle, message: 'Mentionlytics active & tracking' };
    return { status: 'idle', color: 'text-gray-400', icon: Database, message: 'Mentionlytics idle' };
  };

  const mentionlyticsStatus = getMentionlyticsStatus();
  const MentionlyticsIcon = mentionlyticsStatus.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Bottom Debug Panel - Resizable (No Backdrop) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/20 z-50 flex flex-col"
            style={{ height: `${panelHeight}px` }}
          >
            {/* Resize Handle */}
            <div 
              ref={dragRef}
              onMouseDown={handleMouseDown}
              className={`flex items-center justify-center h-2 bg-white/10 hover:bg-white/20 cursor-ns-resize transition-colors ${
                isResizing ? 'bg-blue-500/30' : ''
              }`}
              title="Drag to resize panel"
            >
              <Move className="w-4 h-4 text-white/40 rotate-90" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-green-400" />
                <h2 className="font-barlow font-semibold text-white">Debug Panel</h2>
              </div>
              <button 
                onClick={handleAdminExit} 
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Exit Admin Mode"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Main Content - Horizontal Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - System Status & Controls */}
              <div className="w-80 p-4 border-r border-white/10 flex flex-col">
                <h3 className="text-xs text-white/60 font-barlow uppercase mb-3">System Status</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <ConnectionIcon className={`w-4 h-4 ${connection.color}`} />
                    <span className="text-xs text-white/70 font-barlow uppercase">
                      {connection.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/70 font-barlow uppercase">{dataMode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white font-jetbrains">{systemStats.uptime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-white font-jetbrains">
                      {systemStats.memory}% RAM
                    </span>
                  </div>
                </div>

                {/* 🔍 Page-Specific Admin Details - NEW SECTION */}
                <div className="pt-3 border-t border-white/10 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/60 font-barlow uppercase">Current Page</span>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    {(() => {
                      const pageInfo = getPageSpecificInfo();
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">{pageInfo.name}</span>
                            <span className="text-xs text-blue-400 font-mono">{pageInfo.path}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div>
                              <span className="text-white/50">Components:</span>
                              <div className="text-green-400 font-mono">
                                {pageInfo.components.join(' • ')}
                              </div>
                            </div>
                            <div>
                              <span className="text-white/50">Key APIs:</span>
                              <div className="text-yellow-400 font-mono">
                                {pageInfo.apis.join(' • ')}
                              </div>
                            </div>
                            <div>
                              <span className="text-white/50">Features:</span>
                              <div className="text-purple-400 font-mono">
                                {pageInfo.features.join(' • ')}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-white/30 mt-2 font-mono">
                            Last updated: {pageInfo.timestamp} • Mode: {pageInfo.dataMode}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Mentionlytics Status - PROMINENT */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 mb-4">
                  <span className="text-xs text-white/60 font-barlow uppercase">Mentionlytics</span>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    mentionlyticsStatus.status === 'active' 
                      ? 'bg-green-500/20 border-green-500/30'
                      : mentionlyticsStatus.status === 'error'
                        ? 'bg-red-500/20 border-red-500/30'
                        : mentionlyticsStatus.status === 'connecting'
                          ? 'bg-yellow-500/20 border-yellow-500/30'
                          : 'bg-gray-500/20 border-gray-500/30'
                  }`}>
                    <MentionlyticsIcon className={`w-3 h-3 ${mentionlyticsStatus.color} ${
                      mentionlyticsStatus.status === 'connecting' ? 'animate-spin' : ''
                    }`} />
                    <span className={`text-xs font-jetbrains font-bold ${mentionlyticsStatus.color}`}>
                      {mentionlyticsStatus.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Toggle Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-white/60 font-barlow uppercase">Data Mode</span>
                  <button
                    onClick={toggleMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      isLive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {isLive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span className="text-xs font-jetbrains font-bold">
                      {isLive ? 'LIVE' : 'MOCK'}
                    </span>
                  </button>
                </div>

                {/* Connection Test */}
                <div className="mt-4 pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs text-white/60 font-barlow uppercase">Backend Test</h3>
                    <button
                      onClick={testBackendConnection}
                      disabled={connectionTest.status === 'testing'}
                      className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 text-blue-400 disabled:text-gray-400 rounded transition-colors font-barlow uppercase"
                    >
                      {connectionTest.status === 'testing' ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                  <div
                    className={`text-xs font-jetbrains ${
                      connectionTest.status === 'success'
                        ? 'text-green-400'
                        : connectionTest.status === 'error'
                          ? 'text-red-400'
                          : connectionTest.status === 'testing'
                            ? 'text-yellow-400'
                            : 'text-white/50'
                    }`}
                  >
                    {connectionTest.message}
                  </div>
                </div>

                {/* Endpoint Testing */}
                <div className="mt-4 pb-3 border-b border-white/10">
                  <h3 className="text-xs text-white/60 font-barlow uppercase mb-2">
                    Test Endpoints
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => {
                        const newEndpoint = e.target.value;
                        setSelectedEndpoint(newEndpoint);
                        saveDebugSettings({ selectedEndpoint: newEndpoint });
                        // Clear previous test result when switching endpoints
                        setEndpointTestResult(null);
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-black/30 text-white border border-white/20 rounded font-jetbrains"
                    >
                      <option value="">Select endpoint...</option>
                      {API_ENDPOINTS.map((endpoint) => (
                        <option key={endpoint.id} value={endpoint.id}>
                          {endpoint.method} {endpoint.path}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={testSpecificEndpoint}
                      disabled={!selectedEndpoint}
                      className="px-3 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-500/20 text-purple-400 disabled:text-gray-400 rounded transition-colors font-barlow uppercase"
                    >
                      Test
                    </button>
                  </div>
                  {endpointTestResult && (
                    <div
                      className={`mt-2 text-xs font-jetbrains ${
                        endpointTestResult.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {endpointTestResult.success
                        ? `✓ ${endpointTestResult.status} (${endpointTestResult.responseTime}ms)`
                        : `✗ ${endpointTestResult.error}`}
                    </div>
                  )}
                </div>

                {/* API Stats */}
                <div className="mt-4">
                  <h3 className="text-xs text-white/60 font-barlow uppercase mb-2">
                    API Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-400 font-jetbrains">
                        {systemStats.apiCalls}
                      </div>
                      <div className="text-[10px] text-white/50 font-barlow">Calls</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400 font-jetbrains">
                        {Math.max(0, systemStats.apiCalls - systemStats.errors)}
                      </div>
                      <div className="text-[10px] text-white/50 font-barlow">Success</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400 font-jetbrains">
                        {systemStats.errors}
                      </div>
                      <div className="text-[10px] text-white/50 font-barlow">Errors</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Panel - Mentionlytics Status & Data Preview */}
              <div className="flex-1 p-4 border-r border-white/10">
                <h3 className="text-xs text-white/60 font-barlow uppercase mb-2">Mentionlytics Status</h3>
                <div className="bg-black/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-barlow text-white/60">SERVICE STATUS</span>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${mentionlyticsStatus.color} ${
                      mentionlyticsStatus.status === 'active' ? 'bg-green-500/20' :
                      mentionlyticsStatus.status === 'error' ? 'bg-red-500/20' :
                      mentionlyticsStatus.status === 'connecting' ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                    }`}>
                      {mentionlyticsStatus.status.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs text-white/70 mb-3">{mentionlyticsStatus.message}</p>
                  {sentiment && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${typeof sentiment === 'number' && sentiment > 0 ? 'text-green-400' : typeof sentiment === 'number' && sentiment < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {typeof sentiment === 'number' ? (sentiment > 0 ? '+' : '') + sentiment.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-[10px] text-white/50">Sentiment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">
                          {Math.floor(Math.random() * 50) + 10}
                        </div>
                        <div className="text-[10px] text-white/50">Mentions</div>
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-xs text-white/60 font-barlow uppercase mb-2">Current Data</h3>
                <div className="bg-black/30 rounded-lg p-3 flex-1 overflow-y-auto">
                  <pre className="text-[10px] text-green-400 font-mono">
                    {JSON.stringify(
                      {
                        mode: dataMode,
                        mentionlytics: {
                          status: mentionlyticsStatus.status,
                          loading,
                          hasData: !!sentiment,
                          sentiment: sentiment || null,
                        },
                        api: {
                          baseUrl: API_BASE_URL,
                          connectionTest: connectionTest.status,
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              {/* Right Panel - Debug Logs */}
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs text-white/60 font-barlow uppercase">Debug Logs</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLogs([])}
                      className="text-xs text-white/40 hover:text-white/60 font-barlow uppercase"
                    >
                      Clear
                    </button>
                    <button
                      onClick={resetDebugSettings}
                      className="text-xs text-orange-400 hover:text-orange-300 font-barlow uppercase"
                    >
                      Reset Settings
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-black/30 rounded-lg p-3 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-xs text-white/40 italic">No logs yet...</div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 mb-1 text-[10px]">
                        <span className="text-white/40 font-mono shrink-0">{log.timestamp}</span>
                        <span
                          className={`uppercase font-bold shrink-0 ${
                            log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                                ? 'text-yellow-400'
                                : log.level === 'info'
                                  ? 'text-blue-400'
                                  : 'text-green-400'
                          }`}
                        >
                          {log.level}
                        </span>
                        <span className="text-white/70 break-words">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// 🔧 [MOVED] useDebugTrigger has been moved to /src/hooks/useDebugTrigger.ts
// This resolves React Fast Refresh compatibility issues
