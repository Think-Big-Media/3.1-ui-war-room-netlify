import React, { useState, useEffect } from 'react';
import { MetricsDisplay } from './MetricsDisplay';

// @component: TimeAndMetrics
export const TimeAndMetrics = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'America/New_York',
    };
    return date.toLocaleDateString('en-US', options).toUpperCase() + ' EST';
  };

  // @return
  return (
    <div className="flex items-center">
      <MetricsDisplay />

      <span className="text-gray-600 mx-3 text-xs">|</span>

      <span
        className="text-xs text-gray-300"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {formatTime(currentTime)}
      </span>
    </div>
  );
};
