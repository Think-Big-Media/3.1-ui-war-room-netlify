import { useState, useEffect } from 'react';

export const useDataMode = () => {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Check if we have real API credentials configured
    const hasCredentials =
      import.meta.env.VITE_MENTIONLYTICS_TOKEN || localStorage.getItem('mentionlytics-token');

    setIsLive(!!hasCredentials);
  }, []);

  const toggleMode = () => {
    setIsLive((prev) => !prev);
  };

  return {
    isLive,
    toggleMode,
    dataMode: isLive ? 'LIVE' : 'MOCK',
  };
};
