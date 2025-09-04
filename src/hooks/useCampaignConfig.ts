import { useState, useEffect } from 'react';

export interface CampaignConfig {
  candidate: string;
  party: 'Democrat' | 'Republican' | 'Independent';
  competitors: string[];
  keywords: string[];
  mentionlyticsToken?: string;
}

const DEFAULT_CONFIG: CampaignConfig = {
  candidate: '',
  party: 'Democrat',
  competitors: [],
  keywords: [],
};

const STORAGE_KEY = 'war-room-campaign-config';

export const useCampaignConfig = () => {
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CONFIG);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load config from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedConfig = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
        setIsConfigured(!!parsedConfig.candidate && parsedConfig.keywords.length > 0);
      } catch (error) {
        console.warn('Failed to parse stored campaign config:', error);
      }
    }
  }, []);

  const saveConfig = (newConfig: Partial<CampaignConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
    setIsConfigured(!!updatedConfig.candidate && updatedConfig.keywords.length > 0);
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    setIsConfigured(false);
  };

  return {
    config,
    isConfigured,
    saveConfig,
    resetConfig,
  };
};
