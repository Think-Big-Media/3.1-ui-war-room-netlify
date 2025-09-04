import React from 'react';
import { SystemHealthIndicators } from './SystemHealthIndicators';
import { TimeAndMetrics } from './TimeAndMetrics';

// @component: StatusBar
export const StatusBar = () => {
  // @return
  return (
    <div className="fixed top-0 left-0 w-full h-10 bg-gray-900/95 border-b border-gray-800 z-fixed backdrop-blur-sm">
      <div className="relative h-full flex items-center px-4">
        {/* Left side - Platform indicators */}
        <div className="flex items-center">
          <SystemHealthIndicators />
          <span className="text-gray-600 mx-6 text-xs">|</span>
        </div>

        {/* Center/Right - Metrics and Time */}
        <div className="flex-1 flex items-center justify-end">
          <TimeAndMetrics />
        </div>
      </div>
    </div>
  );
};
