/**
 * Campaign Data Hooks - Meta & Google Ads Integration
 * Provides unified interface for campaign performance data
 */

import { useState, useEffect } from 'react';
import { useNotifications } from '../components/shared/NotificationSystem';
import { useMentionlyticsMode } from './useMentionlytics';

export interface MetaCampaignSummary {
  totalSpend: number;
  totalImpressions: number;
  totalConversions: number;
  averageRoas: number;
  campaigns: MetaCampaign[];
  lastUpdated: string;
}

export interface GoogleCampaignSummary {
  totalCost: number;
  totalImpressions: number;
  totalConversions: number;
  averageRoas: number;
  campaigns: GoogleCampaign[];
  lastUpdated: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  spend: number;
  impressions: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpm: number;
}

export interface GoogleCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  cost: number;
  impressions: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpc: number;
}

// Mock data for development - will be replaced with real API calls
const mockMetaData: MetaCampaignSummary = {
  totalSpend: 12450,
  totalImpressions: 1247500,
  totalConversions: 423,
  averageRoas: 4.2,
  campaigns: [
    {
      id: 'meta_001',
      name: 'Healthcare Reform Awareness',
      status: 'active',
      spend: 5200,
      impressions: 520000,
      conversions: 187,
      roas: 4.8,
      ctr: 2.3,
      cpm: 12.50
    },
    {
      id: 'meta_002', 
      name: 'Economic Policy Outreach',
      status: 'active',
      spend: 4800,
      impressions: 480000,
      conversions: 156,
      roas: 3.9,
      ctr: 1.9,
      cpm: 14.20
    },
    {
      id: 'meta_003',
      name: 'Voter Engagement Drive',
      status: 'paused',
      spend: 2450,
      impressions: 247500,
      conversions: 80,
      roas: 3.8,
      ctr: 2.1,
      cpm: 11.80
    }
  ],
  lastUpdated: new Date().toISOString()
};

const mockGoogleData: GoogleCampaignSummary = {
  totalCost: 8950,
  totalImpressions: 956000,
  totalConversions: 298,
  averageRoas: 3.8,
  campaigns: [
    {
      id: 'google_001',
      name: 'Search - Healthcare Policy',
      status: 'active',
      cost: 4200,
      impressions: 420000,
      conversions: 145,
      roas: 4.1,
      ctr: 3.2,
      cpc: 2.85
    },
    {
      id: 'google_002',
      name: 'Display - Economic Message',
      status: 'active', 
      cost: 3200,
      impressions: 380000,
      conversions: 102,
      roas: 3.6,
      ctr: 2.1,
      cpc: 1.95
    },
    {
      id: 'google_003',
      name: 'Video - Voter Outreach',
      status: 'active',
      cost: 1550,
      impressions: 156000,
      conversions: 51,
      roas: 3.4,
      ctr: 1.8,
      cpc: 3.20
    }
  ],
  lastUpdated: new Date().toISOString()
};

export const useMetaCampaigns = () => {
  const [data, setData] = useState<MetaCampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useNotifications();
  const { mode: dataMode } = useMentionlyticsMode();

  const fetchMetaCampaigns = async (showNotification = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with real Meta API call
      // const response = await fetch('/api/v1/campaigns/meta');
      // const campaigns = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setData({
        ...mockMetaData,
        lastUpdated: new Date().toISOString()
      });
      
      if (showNotification) {
        showSuccess('Meta campaigns synced', 'Latest data retrieved from Facebook Ads Manager');
      }
    } catch (err) {
      const errorMsg = 'Failed to fetch Meta campaign data';
      setError(errorMsg);
      if (showNotification) {
        showError('Sync failed', errorMsg);
      }
      console.error('Meta campaigns error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      // TODO: Replace with real Meta API call
      // const response = await fetch(`/api/v1/campaigns/meta/${campaignId}/pause`, { method: 'PATCH' });
      
      // Update local state optimistically
      if (data) {
        const updatedCampaigns = data.campaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: campaign.status === 'active' ? 'paused' as const : 'active' as const }
            : campaign
        );
        setData({ ...data, campaigns: updatedCampaigns });
        
        const campaign = data.campaigns.find(c => c.id === campaignId);
        const newStatus = campaign?.status === 'active' ? 'paused' : 'active';
        showSuccess(`Campaign ${newStatus}`, `${campaign?.name} is now ${newStatus}`);
      }
    } catch (err) {
      showError('Failed to update campaign', 'Please try again or check your connection');
      console.error('Pause campaign error:', err);
    }
  };

  useEffect(() => {
    fetchMetaCampaigns();
  }, []);

  return {
    data,
    loading,
    error,
    dataMode,
    refetch: () => fetchMetaCampaigns(true),
    pauseCampaign
  };
};

export const useGoogleCampaigns = () => {
  const [data, setData] = useState<GoogleCampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useNotifications();
  const { mode: dataMode } = useMentionlyticsMode();

  const fetchGoogleCampaigns = async (showNotification = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with real Google Ads API call
      // const response = await fetch('/api/v1/campaigns/google');
      // const campaigns = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setData({
        ...mockGoogleData,
        lastUpdated: new Date().toISOString()
      });
      
      if (showNotification) {
        showSuccess('Google campaigns synced', 'Latest data retrieved from Google Ads');
      }
    } catch (err) {
      const errorMsg = 'Failed to fetch Google campaign data';
      setError(errorMsg);
      if (showNotification) {
        showError('Sync failed', errorMsg);
      }
      console.error('Google campaigns error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      // TODO: Replace with real Google Ads API call
      // const response = await fetch(`/api/v1/campaigns/google/${campaignId}/pause`, { method: 'PATCH' });
      
      // Update local state optimistically
      if (data) {
        const updatedCampaigns = data.campaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: campaign.status === 'active' ? 'paused' as const : 'active' as const }
            : campaign
        );
        setData({ ...data, campaigns: updatedCampaigns });
        
        const campaign = data.campaigns.find(c => c.id === campaignId);
        const newStatus = campaign?.status === 'active' ? 'paused' : 'active';
        showSuccess(`Campaign ${newStatus}`, `${campaign?.name} is now ${newStatus}`);
      }
    } catch (err) {
      showError('Failed to update campaign', 'Please try again or check your connection');
      console.error('Pause campaign error:', err);
    }
  };

  useEffect(() => {
    fetchGoogleCampaigns();
  }, []);

  return {
    data,
    loading,
    error,
    dataMode,
    refetch: () => fetchGoogleCampaigns(true),
    pauseCampaign
  };
};

export const useCampaignSummary = () => {
  const metaCampaigns = useMetaCampaigns();
  const googleCampaigns = useGoogleCampaigns();

  const syncAll = async () => {
    await Promise.all([
      metaCampaigns.refetch(),
      googleCampaigns.refetch()
    ]);
  };

  return {
    meta: metaCampaigns,
    google: googleCampaigns,
    loading: metaCampaigns.loading || googleCampaigns.loading,
    syncAll
  };
};