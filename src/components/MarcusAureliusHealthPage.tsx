// 🏛️ Marcus Aurelius - Tier 3: Dedicated Health Monitoring Page
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  Server,
  Database,
  Zap,
  BarChart3
} from 'lucide-react';
import PageLayout from './shared/PageLayout';
import { marcusAurelius, SystemHealthReport, HealthStatus } from '../services/marcusAureliusService';

export default function MarcusAureliusHealthPage() {
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthReport = async () => {
    setIsRefreshing(true);
    try {
      const report = await marcusAurelius.getSystemHealthReport();
      setHealthReport(report);
    } catch (error) {
      console.error('Failed to fetch health report:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthReport();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthReport, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'degraded': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'backend': return <Server className="w-5 h-5" />;
      case 'mentionlytics': return <BarChart3 className="w-5 h-5" />;
      case 'authentication': return <Shield className="w-5 h-5" />;
      case 'campaign management': return <Zap className="w-5 h-5" />;
      case 'intelligence hub': return <Activity className="w-5 h-5" />;
      case 'alert center': return <AlertCircle className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  if (!healthReport) {
    return (
      <PageLayout pageTitle="Marcus Aurelius - System Health" placeholder="Loading health data...">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-white/60">Loading system health...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout pageTitle="Marcus Aurelius - System Health" placeholder="Monitor system health...">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-6 space-y-6"
      >
        
        {/* Header with Overall Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className={`w-8 h-8 ${
              healthReport.overall === 'healthy' ? 'text-green-400' : 
              healthReport.overall === 'degraded' ? 'text-yellow-400' : 'text-red-400'
            }`} />
            <div>
              <h1 className="text-2xl font-bold text-white">System Health Monitor</h1>
              <p className="text-white/60">
                Overall Status: <span className={`font-medium ${
                  healthReport.overall === 'healthy' ? 'text-green-400' : 
                  healthReport.overall === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {healthReport.overall.charAt(0).toUpperCase() + healthReport.overall.slice(1)}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={fetchHealthReport}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase">Total Services</p>
                <p className="text-2xl font-bold text-white">{healthReport.summary.total}</p>
              </div>
              <Server className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase">Healthy</p>
                <p className="text-2xl font-bold text-green-400">{healthReport.summary.healthy}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase">Degraded</p>
                <p className="text-2xl font-bold text-yellow-400">{healthReport.summary.degraded}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase">Error</p>
                <p className="text-2xl font-bold text-red-400">{healthReport.summary.error}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Service Details
          </h2>
          
          <div className="space-y-3">
            {healthReport.services.map((service, index) => (
              <motion.div
                key={service.service}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center gap-3">
                  {getServiceIcon(service.service)}
                  <div>
                    <h3 className="font-medium text-white">{service.service}</h3>
                    <p className="text-sm text-white/60">{service.endpoint}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{service.responseTime}ms</p>
                    <p className="text-xs text-white/60">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <span className="text-sm font-medium capitalize">{service.status}</span>
                  </div>
                </div>
                
                {service.details && (
                  <div className="text-sm text-white/60 italic">
                    {service.details}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Uptime</p>
                <p className="font-medium text-white">{healthReport.uptime}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Version</p>
                <p className="font-medium text-white">{healthReport.version}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-white/60 uppercase">Last Updated</p>
                <p className="font-medium text-white">
                  {new Date(healthReport.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </PageLayout>
  );
}