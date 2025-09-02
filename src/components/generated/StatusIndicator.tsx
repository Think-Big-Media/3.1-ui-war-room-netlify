import React from 'react';
import { motion } from 'framer-motion';
interface StatusIndicatorProps {
  name: string;
  status: string;
  type: 'success' | 'warning' | 'error';
}

// @component: StatusIndicator
export const StatusIndicator = ({ name, status, type }: StatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-orange-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-green-400';
    }
  };
  const getDotColor = () => {
    switch (type) {
      case 'success':
        return '#4ade80';
      case 'warning':
        return '#fb923c';
      case 'error':
        return '#f87171';
      default:
        return '#4ade80';
    }
  };

  // @return
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-xs leading-none"
        style={{
          color: getDotColor(),
        }}
      >
        ●
      </span>

      <span
        className="text-xs text-gray-400"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {name}
      </span>
    </div>
  );
};
