/**
 * Data Mode Indicator Component
 * Shows whether the app is using mock or real data
 * Only visible in development mode
 */

import React from 'react';
import { useDataMode } from '../hooks/useWarRoomData';

export const DataModeIndicator: React.FC = () => {
  const { isMock, mode, apiUrl } = useDataMode();

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg font-mono text-xs ${
          isMock
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isMock ? 'bg-yellow-500' : 'bg-green-500'
            } animate-pulse`}
          />
          <span className="font-semibold">{mode} DATA</span>
        </div>
        {!isMock && <div className="mt-1 text-xs opacity-75">API: {apiUrl}</div>}
        <button
          onClick={() => {
            const newMode = !isMock;
            localStorage.setItem('VITE_USE_MOCK_DATA', newMode.toString());
            window.location.reload();
          }}
          className="mt-2 text-xs underline hover:no-underline"
        >
          Switch to {isMock ? 'LIVE' : 'MOCK'}
        </button>
      </div>
    </div>
  );
};

export default DataModeIndicator;
