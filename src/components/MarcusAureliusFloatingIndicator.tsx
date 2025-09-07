// 🏛️ Marcus Aurelius - Tier 4: Floating Health Indicator
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { marcusAurelius } from '../services/marcusAureliusService';

interface FloatingHealthData {
  backend: string;
  mentionlytics: string;
  auth: string;
  overall: 'healthy' | 'degraded' | 'critical';
  lastCheck: string;
}

export default function MarcusAureliusFloatingIndicator() {
  const [healthData, setHealthData] = useState<FloatingHealthData>({
    backend: '🔄',
    mentionlytics: '🔄',
    auth: '🔄',
    overall: 'healthy',
    lastCheck: 'checking...'
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const health = await marcusAurelius.getQuickHealth();
        setHealthData(health);
      } catch (error) {
        setHealthData(prev => ({
          ...prev,
          backend: '❌',
          mentionlytics: '❌',
          auth: '❌',
          overall: 'critical',
          lastCheck: new Date().toLocaleTimeString()
        }));
      }
    };

    // Initial check
    fetchHealth();
    
    // Check every 2 minutes
    const interval = setInterval(fetchHealth, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (healthData.overall) {
      case 'healthy': return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'degraded': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'critical': return 'bg-red-500/20 border-red-500/30 text-red-400';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  const getIconColor = () => {
    switch (healthData.overall) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={`${getStatusColor()} backdrop-blur-md border rounded-xl shadow-2xl overflow-hidden`}
        >
          {/* Collapsed State */}
          <motion.div
            className="flex items-center gap-2 p-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Shield className={`w-4 h-4 ${getIconColor()}`} />
            <span className="text-sm font-medium">
              {healthData.overall === 'healthy' ? 'System OK' : 
               healthData.overall === 'degraded' ? 'Issues' : 'Critical'}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="w-4 h-4" />
            </motion.div>
            
            {/* Pulse indicator for critical issues */}
            {healthData.overall === 'critical' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-red-400 rounded-full"
              />
            )}
          </motion.div>

          {/* Expanded State */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-white/10"
              >
                <div className="p-4 space-y-3">
                  {/* Service Status Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        healthData.backend === '✅' ? 'bg-green-400' : 'bg-red-400'
                      }`} title="Backend"></div>
                      <div className="text-xs text-white/60">Backend</div>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        healthData.mentionlytics === '✅' ? 'bg-green-400' : 
                        healthData.mentionlytics === '⚠️' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} title="Mentionlytics"></div>
                      <div className="text-xs text-white/60">Social</div>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                        healthData.auth === '✅' ? 'bg-green-400' : 'bg-red-400'
                      }`} title="Authentication"></div>
                      <div className="text-xs text-white/60">Auth</div>
                    </div>
                  </div>

                  {/* Last Check */}
                  <div className="text-xs text-white/50 text-center">
                    Last check: {healthData.lastCheck}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open('/marcus-aurelius', '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Details
                    </button>
                    <button
                      onClick={() => setIsVisible(false)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition-colors text-sm"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}