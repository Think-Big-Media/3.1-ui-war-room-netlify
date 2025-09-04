/**
 * Connection Status Indicator Component
 * Shows WebSocket connection status with real-time updates
 */

import type React from 'react';
import { Wifi, WifiOff, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  onReconnect?: () => void;
  className?: string;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  error,
  reconnectAttempts,
  maxReconnectAttempts,
  onReconnect,
  className,
  compact = false,
}) => {
  const getStatusConfig = () => {
    if (isConnecting) {
      return {
        icon: RotateCcw,
        color: 'text-blue-600 bg-blue-50',
        label: 'Connecting...',
        description:
          reconnectAttempts > 0
            ? `Retry ${reconnectAttempts}/${maxReconnectAttempts}`
            : 'Establishing connection',
      };
    }

    if (isConnected) {
      return {
        icon: Wifi,
        color: 'text-green-600 bg-green-50',
        label: 'Connected',
        description: 'Real-time updates active',
      };
    }

    if (error) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-50',
        label: 'Connection Error',
        description: reconnectAttempts >= maxReconnectAttempts ? 'Max retries reached' : error,
      };
    }

    return {
      icon: WifiOff,
      color: 'text-gray-600 bg-gray-50',
      label: 'Disconnected',
      description: 'No real-time updates',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className={cn('p-1 rounded-full', config.color)}>
          <Icon className={cn('w-3 h-3', isConnecting && 'animate-spin')} />
        </div>
        <span className="text-xs font-medium text-gray-700">{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border animate-fade-in',
        config.color.includes('green')
          ? 'border-green-200'
          : config.color.includes('red')
            ? 'border-red-200'
            : config.color.includes('blue')
              ? 'border-blue-200'
              : 'border-gray-200',
        config.color,
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            config.color.includes('green')
              ? 'bg-green-100'
              : config.color.includes('red')
                ? 'bg-red-100'
                : config.color.includes('blue')
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              isConnecting && 'animate-spin',
              config.color.split(' ')[0] // Extract text color
            )}
          />
        </div>

        <div>
          <p className={cn('text-sm font-medium', config.color.split(' ')[0])}>{config.label}</p>
          <p className="text-xs text-gray-500">{config.description}</p>
        </div>
      </div>

      {/* Reconnect button for error states */}
      {error && onReconnect && reconnectAttempts < maxReconnectAttempts && (
        <button
          onClick={onReconnect}
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors animate-fade-in"
        >
          Retry
        </button>
      )}

      {/* Connection pulse indicator */}
      {isConnected && (
        <div className="relative">
          <div className="w-2 h-2 bg-[var(--accent-live-monitoring)] rounded-full" />
          <div className="absolute inset-0 w-2 h-2 bg-[var(--accent-live-monitoring)]/70 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};
