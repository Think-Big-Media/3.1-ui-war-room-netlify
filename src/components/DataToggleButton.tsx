/**
 * Data Toggle Button Component
 * Prominent button for switching between mock and real data
 * Used for demos, A/B testing, and alpha testing
 */

import React, { useState, useEffect } from 'react';
import { useDataMode } from '../hooks/useWarRoomData';

export const DataToggleButton: React.FC = () => {
  const { isMock: initialMock } = useDataMode();
  const [isMock, setIsMock] = useState(initialMock);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    const newMode = !isMock;

    // Update localStorage
    localStorage.setItem('VITE_USE_MOCK_DATA', newMode.toString());

    // Show animation before reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      {/* Main Toggle Button - Top Right, Always Visible */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleToggle}
          disabled={isAnimating}
          className={`
            group relative px-6 py-3 rounded-full font-condensed font-bold text-white
            transition-all duration-300 transform hover:scale-105
            shadow-xl hover:shadow-2xl
            ${
              isMock
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
                : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800'
            }
            ${isAnimating ? 'animate-pulse scale-110' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{isMock ? '🔧' : '🚀'}</span>
            <div className="text-left">
              <div className="text-sm opacity-90 font-mono">
                {isMock ? 'MOCK MODE' : 'LIVE MODE'}
              </div>
              <div className="text-xs opacity-75 font-mono">Click to switch</div>
            </div>
          </div>

          {/* Animated indicator dot */}
          <div
            className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full
            ${isMock ? 'bg-yellow-300' : 'bg-[var(--accent-live-monitoring)]'}
            animate-ping
          `}
          />
        </button>

        {/* Info tooltip on hover */}
        <div
          className="
          absolute top-full right-0 mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none whitespace-nowrap font-mono
        "
        >
          {isMock ? 'Using mock data for testing' : 'Connected to live backend'}
        </div>
      </div>

      {/* Additional Status Bar - Bottom of screen */}
      <div
        className={`
        fixed bottom-0 left-0 right-0 h-8 z-40
        flex items-center justify-center
        font-mono text-xs text-white
        ${isMock ? 'bg-yellow-600 bg-opacity-90' : 'bg-green-700 bg-opacity-90'}
      `}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`
              w-2 h-2 rounded-full animate-pulse
              ${isMock ? 'bg-yellow-300' : 'bg-green-300'}
            `}
            />
            <span className="font-semibold">{isMock ? 'MOCK DATA MODE' : 'LIVE DATA MODE'}</span>
          </div>
          <span className="opacity-75">|</span>
          <span className="opacity-75">
            {isMock ? 'Perfect for demos & testing' : 'Connected to production backend'}
          </span>
          <span className="opacity-75">|</span>
          <button
            onClick={handleToggle}
            className="underline hover:no-underline"
            disabled={isAnimating}
          >
            Switch to {isMock ? 'LIVE' : 'MOCK'}
          </button>
        </div>
      </div>

      {/* Loading overlay during switch */}
      {isAnimating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="font-condensed text-lg">
                Switching to {!isMock ? 'MOCK' : 'LIVE'} mode...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataToggleButton;
