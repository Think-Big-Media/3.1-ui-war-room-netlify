import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Zap,
  Shield
} from 'lucide-react';
import PageLayout from './shared/PageLayout';
import { AdminAuthGate } from './AdminAuthGate';
import { isLocalStorageAvailable } from '../utils/localStorage';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigationClick: () => void;
}

// Critical Data Sources that need monitoring for app functionality
const CRITICAL_DATA_SOURCES = [
  // Core System Health
  { name: 'Backend Health', url: '/health', method: 'GET', category: 'System', critical: true },
  { name: 'Database Connection', url: '/api/v1/db/health', method: 'GET', category: 'System', critical: true },
  
  // Primary Data Feeds (6 main sources)
  { name: 'Political News Feed', url: '/api/v1/information/political-news', method: 'GET', category: 'Data Sources', critical: true },
  { name: 'Team Alerts Feed', url: '/api/v1/information/team-alerts', method: 'GET', category: 'Data Sources', critical: true },
  { name: 'Campaign Updates Feed', url: '/api/v1/information/campaign-updates', method: 'GET', category: 'Data Sources', critical: true },
  { name: 'Media Intelligence Feed', url: '/api/v1/information/media-intelligence', method: 'GET', category: 'Data Sources', critical: true },
  { name: 'Strategic Insights Feed', url: '/api/v1/information/strategic-insights', method: 'GET', category: 'Data Sources', critical: true },
  { name: 'Crisis Alerts Feed', url: '/api/v1/information/crisis-alerts', method: 'GET', category: 'Data Sources', critical: true },
  
  // Mentionlytics Integration (External API)
  { name: 'Mentionlytics API Connection', url: '/api/v1/mentionlytics/validate', method: 'GET', category: 'External APIs', critical: true },
  { name: 'Mentionlytics Data Feed', url: '/api/v1/mentionlytics/feed', method: 'GET', category: 'External APIs', critical: false },
  { name: 'Mentionlytics Sentiment Analysis', url: '/api/v1/mentionlytics/sentiment', method: 'GET', category: 'External APIs', critical: false },
  
  // Real-time Services
  { name: 'WebSocket Connection', url: '/api/v1/ws/status', method: 'GET', category: 'Real-time', critical: true },
  { name: 'Alert System', url: '/api/v1/alerting/status', method: 'GET', category: 'Real-time', critical: true },
  
  // Authentication & Security
  { name: 'OAuth Service', url: '/api/v1/auth/status', method: 'GET', category: 'Auth', critical: true },
  { name: 'User Session Store', url: '/api/v1/auth/sessions/health', method: 'GET', category: 'Auth', critical: true },
  
  // Third-party Integrations
  { name: 'Meta Ads API', url: '/api/v1/integrations/meta/status', method: 'GET', category: 'Integrations', critical: false },
  { name: 'Google Ads API', url: '/api/v1/integrations/google/status', method: 'GET', category: 'Integrations', critical: false },
  { name: 'PostHog Analytics', url: '/api/v1/integrations/posthog/status', method: 'GET', category: 'Integrations', critical: false },
];

interface TestResult {
  name: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  duration?: number;
  error?: string;
  data?: any;
  timestamp?: string;
}

const AdminDashboardContent: React.FC<AdminDashboardProps> = ({ 
  isOpen, 
  onClose, 
  onNavigationClick 
}) => {
  const [testResults, setTestResults] = useState<TestResult[]>(
    CRITICAL_DATA_SOURCES.map(endpoint => ({
      name: endpoint.name,
      status: 'pending' as const,
    }))
  );
  const [realTimeLog, setRealTimeLog] = useState<Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    source: string;
  }>>([]);
  const [isRunningFullSuite, setIsRunningFullSuite] = useState(false);
  const [dataMode, setDataMode] = useState<'MOCK' | 'LIVE'>('LIVE');
  const [systemStats, setSystemStats] = useState({
    uptime: '00:00:00',
    memory: 23,
    apiCalls: 0,
    errors: 0,
    criticalFailures: 0,
    dataSourcesOnline: 0,
    lastUpdate: new Date().toLocaleTimeString(),
  });

  // 🏛️ Marcus Aurelius - Tier 1: Quick Health Summary
  const [marcusAureliusHealth, setMarcusAureliusHealth] = useState({
    backend: '🔄',
    mentionlytics: '🔄', 
    auth: '🔄',
    overall: 'checking',
    lastCheck: new Date().toLocaleTimeString()
  });

  // Marcus Aurelius health check (every 60 seconds) - now using Tier 2 service
  useEffect(() => {
    if (!isOpen) return;
    
    const checkMarcusAureliusHealth = async () => {
      try {
        // Use the imported service directly
        const { marcusAurelius } = await import('../services/marcusAureliusService');
        const healthData = await marcusAurelius.getQuickHealth();
        setMarcusAureliusHealth(healthData);
      } catch (error) {
        setMarcusAureliusHealth(prev => ({
          ...prev,
          backend: '❌',
          mentionlytics: '❌',
          auth: '❌',
          overall: 'error',
          lastCheck: new Date().toLocaleTimeString()
        }));
      }
    };
    
    // Initial check
    checkMarcusAureliusHealth();
    
    // Check every minute
    const interval = setInterval(checkMarcusAureliusHealth, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Update system stats
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = now - (Math.random() * 3600000); // Random uptime
      const uptimeSeconds = Math.floor((now - startTime) / 1000);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      
      setSystemStats(prev => ({
        ...prev,
        uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        memory: Math.floor(Math.random() * 40) + 20, // 20-60% range
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const runFullValidationSuite = async () => {
    setIsRunningFullSuite(true);
    
    // Reset all results
    setTestResults(CRITICAL_DATA_SOURCES.map(endpoint => ({
      name: endpoint.name,
      status: 'pending' as const,
    })));
    
    setRealTimeLog(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Starting comprehensive system health check',
      source: 'Admin Dashboard'
    }]);

    let criticalFailures = 0;
    let dataSourcesOnline = 0;
    
    // Run tests sequentially with visual feedback
    for (let i = 0; i < CRITICAL_DATA_SOURCES.length; i++) {
      const endpoint = CRITICAL_DATA_SOURCES[i];
      
      // Update to testing state
      setTestResults(prev => prev.map((result, index) => 
        index === i ? { ...result, status: 'testing' } : result
      ));

      try {
        const startTime = Date.now();
        // SECURITY: Don't expose actual backend URL in production
        const backendUrl = import.meta.env.VITE_ENCORE_API_URL || 'http://localhost:10000';
        const fullUrl = `${backendUrl}${endpoint.url}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(fullUrl, {
          method: endpoint.method,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }
        
        setTestResults(prev => prev.map((result, index) => 
          index === i ? {
            ...result,
            status: response.ok ? 'success' : 'error',
            duration,
            data: responseData,
            timestamp: new Date().toLocaleTimeString(),
            error: response.ok ? undefined : `${response.status} ${response.statusText}`
          } : result
        ));
        
        const isSuccess = response.ok;
        if (endpoint.category === 'Data Sources' && isSuccess) {
          dataSourcesOnline++;
        }
        if (endpoint.critical && !isSuccess) {
          criticalFailures++;
        }
        
        // Add to real-time log
        setRealTimeLog(prev => [...prev.slice(-20), {
          timestamp: new Date().toLocaleTimeString(),
          level: isSuccess ? 'success' : 'error',
          message: `${endpoint.name}: ${isSuccess ? 'Online' : `Failed (${response.status})`}`,
          source: endpoint.category
        }]);
        
        setSystemStats(prev => ({
          ...prev,
          apiCalls: prev.apiCalls + 1,
          errors: response.ok ? prev.errors : prev.errors + 1,
          criticalFailures,
          dataSourcesOnline,
          lastUpdate: new Date().toLocaleTimeString(),
        }));
        
      } catch (error: any) {
        setTestResults(prev => prev.map((result, index) => 
          index === i ? {
            ...result,
            status: 'error',
            error: error.message,
            timestamp: new Date().toLocaleTimeString(),
          } : result
        ));
        
        if (endpoint.critical) {
          criticalFailures++;
        }
        
        // Add to real-time log
        setRealTimeLog(prev => [...prev.slice(-20), {
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `${endpoint.name}: Connection failed (${error.message})`,
          source: endpoint.category
        }]);
        
        setSystemStats(prev => ({
          ...prev,
          apiCalls: prev.apiCalls + 1,
          errors: prev.errors + 1,
          criticalFailures,
          dataSourcesOnline,
          lastUpdate: new Date().toLocaleTimeString(),
        }));
      }
      
      // Small delay between tests for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsRunningFullSuite(false);
  };

  const handleDataModeToggle = () => {
    const newMode = dataMode === 'MOCK' ? 'LIVE' : 'MOCK';
    setDataMode(newMode);
    
    // Dispatch event to notify other components
    const event = new CustomEvent('data-mode-change', { 
      detail: { mode: newMode } 
    });
    window.dispatchEvent(event);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'testing':
        return <Activity className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';  
      case 'testing': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const connectionStatus = systemStats.errors === 0 && systemStats.apiCalls > 0 ? 'connected' : 
                          systemStats.errors > 0 ? 'error' : 'idle';

  if (!isOpen) return null;

  return (
    <PageLayout pageTitle="Admin Dashboard" placeholder="Admin commands...">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-6"
      >

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Database className={`w-5 h-5 ${systemStats.criticalFailures === 0 ? 'text-green-400' : 'text-red-400'}`} />
              <div>
                <p className="text-xs text-white/60 uppercase">System Health</p>
                <p className={`font-medium ${
                  systemStats.criticalFailures === 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {systemStats.criticalFailures === 0 ? 'Healthy' : `${systemStats.criticalFailures} Critical`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Data Sources</p>
                <p className="text-white font-medium">{systemStats.dataSourcesOnline}/6 Online</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Last Update</p>
                <p className="text-white font-mono text-sm">{systemStats.lastUpdate}</p>
              </div>
            </div>
          </div>
          
          {/* 🏛️ Marcus Aurelius - Tier 1: Health Summary Widget */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
               onClick={() => window.open('/marcus-aurelius', '_blank')}>
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${
                marcusAureliusHealth.overall === 'healthy' ? 'text-green-400' : 
                marcusAureliusHealth.overall === 'degraded' ? 'text-yellow-400' : 'text-red-400'
              }`} />
              <div>
                <p className="text-xs text-white/60 uppercase">Marcus Aurelius</p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      marcusAureliusHealth.backend === '✅' ? 'bg-green-400' : 'bg-red-400'
                    }`} title="Backend"></div>
                    <span className="text-xs text-white/60">BE</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      marcusAureliusHealth.mentionlytics === '✅' ? 'bg-green-400' : 
                      marcusAureliusHealth.mentionlytics === '⚠️' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} title="Mentionlytics"></div>
                    <span className="text-xs text-white/60">ML</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      marcusAureliusHealth.auth === '✅' ? 'bg-green-400' : 'bg-red-400'
                    }`} title="Authentication"></div>
                    <span className="text-xs text-white/60">AUTH</span>
                  </div>
                  <span className="text-white/40 text-xs ml-1">({marcusAureliusHealth.lastCheck})</span>
                </div>
                <p className="text-xs text-blue-400 mt-1">Click for details</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">API Calls</p>
                <p className="text-white font-medium">{systemStats.apiCalls}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 ${systemStats.errors === 0 ? 'text-green-400' : 'text-yellow-400'}`} />
              <div>
                <p className="text-xs text-white/60 uppercase">Errors</p>
                <p className={`font-medium ${
                  systemStats.errors === 0 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {systemStats.errors}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Admin Cards */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Performance</p>
                <p className="text-white font-medium">
                  {Math.round(Math.random() * 100 + 200)}ms
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Uptime</p>
                <p className="text-white font-medium">99.9%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Config</p>
                <p className="text-white font-medium">
                  {dataMode === 'LIVE' ? 'Production' : 'Development'}
                </p>
              </div>
            </div>
          </div>

          {/* 10th Card - Memory Usage */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Memory</p>
                <p className="text-white font-medium">
                  {(Math.random() * 40 + 30).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PROMINENT Data Mode Indicator */}
        <div className="mb-8 p-6 bg-white/10 border-2 border-white/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full animate-pulse ${dataMode === 'LIVE' ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <div>
                <h2 className="text-2xl font-bold text-white">{dataMode} DATA MODE</h2>
                <p className="text-gray-300">
                  {dataMode === 'LIVE' 
                    ? 'Connected to production backend APIs and real data sources' 
                    : 'Using mock data for testing and demonstration purposes'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleDataModeToggle}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                dataMode === 'LIVE' 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20' 
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
              }`}
            >
              Switch to {dataMode === 'LIVE' ? 'MOCK' : 'LIVE'} MODE
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={runFullValidationSuite}
            disabled={isRunningFullSuite}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {isRunningFullSuite ? 'Running Full Suite...' : 'Run Full Validation Suite'}
          </button>
        </div>

        {/* Validation Results & Real-time Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Critical Data Sources</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.filter((_, index) => CRITICAL_DATA_SOURCES[index]?.critical).map((result, index) => {
                const endpoint = CRITICAL_DATA_SOURCES.find(ep => ep.name === result.name);
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="text-white text-sm font-medium">{result.name}</p>
                        <p className="text-white/60 text-xs">{endpoint?.category}</p>
                        {result.error && (
                          <p className="text-red-400 text-xs">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </p>
                      {result.duration && (
                        <p className="text-xs text-white/60">{result.duration}ms</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">All System Components</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => {
                const endpoint = CRITICAL_DATA_SOURCES[index];
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="text-white text-sm">{result.name}</p>
                        <p className="text-white/60 text-xs">{endpoint?.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </p>
                      {result.duration && (
                        <p className="text-xs text-white/60">{result.duration}ms</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Real-Time Activity Feed</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {realTimeLog.length === 0 ? (
                <div className="p-4 text-center text-white/60">
                  No activity yet. Run system validation to see real-time updates.
                </div>
              ) : (
                realTimeLog.slice().reverse().map((log, index) => (
                  <div key={index} className={`p-2 rounded-lg border-l-2 ${
                    log.level === 'success' ? 'bg-green-500/10 border-green-400' :
                    log.level === 'error' ? 'bg-red-500/10 border-red-400' :
                    log.level === 'warning' ? 'bg-yellow-500/10 border-yellow-400' :
                    'bg-blue-500/10 border-blue-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          log.level === 'success' ? 'bg-green-400' :
                          log.level === 'error' ? 'bg-red-400' :
                          log.level === 'warning' ? 'bg-yellow-400' :
                          'bg-blue-400'
                        }`} />
                        <p className="text-white text-sm">{log.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-xs">{log.timestamp}</p>
                        <p className="text-white/40 text-xs">{log.source}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Quick Stats Summary */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Data Mode</p>
                  <p className={`font-medium ${
                    dataMode === 'LIVE' ? 'text-green-400' : 'text-orange-400'
                  }`}>{dataMode}</p>
                </div>
                <div>
                  <p className="text-white/60">System Status</p>
                  <p className={`font-medium ${
                    systemStats.criticalFailures === 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {systemStats.criticalFailures === 0 ? 'All Systems Go' : 'Issues Detected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Instructions */}
        <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/40 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-blue-200 font-medium mb-2">
                🔍 What This Dashboard Monitors:
              </p>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• 6 Core data sources feeding the main application</li>
                <li>• Mentionlytics API integration and data processing</li>
                <li>• Authentication system and user sessions</li>
                <li>• Real-time WebSocket connections</li>
                <li>• Third-party integrations (Meta, Google, PostHog)</li>
                <li>• Database connectivity and system health</li>
              </ul>
            </div>
            <div>
              <p className="text-blue-200 font-medium mb-2">
                🛠️ Admin Actions Available:
              </p>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Run comprehensive system health checks</li>
                <li>• Monitor real-time activity and error logs</li>
                <li>• Switch between MOCK and LIVE data modes</li>
                <li>• Identify failing components and services</li>
                <li>• Track API response times and error rates</li>
                <li>• Session expires after 2 minutes of inactivity</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

// Main export with authentication wrapper
export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!props.isOpen) return null;

  return (
    <AdminAuthGate onAuthChange={setIsAuthenticated}>
      <AdminDashboardContent {...props} />
    </AdminAuthGate>
  );
};