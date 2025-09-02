/**
 * Ad Insights API Service
 * Connects frontend to live backend ad insights endpoints
 */

import { createLogger } from '../utils/logger';
import { API_BASE_URL } from '@/config/constants';

const logger = createLogger('adInsightsApi');

// Base API configuration
const BASE = API_BASE_URL;

// Response types matching backend models
export interface UnifiedCampaignMetrics {
  platform: 'meta' | 'google';
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  date_start: string;
  date_stop: string;
  last_updated: string;
}

export interface AdInsightsResponse {
  campaigns: UnifiedCampaignMetrics[];
  summary: {
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    average_ctr: number;
    platforms_active: string[];
  };
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  average_ctr: number;
  last_sync: string;
}

export interface RealTimeAlert {
  id: string;
  alert_type: 'spend_threshold' | 'performance_drop' | 'budget_exhausted';
  platform: 'meta' | 'google';
  campaign_id: string;
  campaign_name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold_value: number;
  current_value: number;
  timestamp: string;
}

export interface CampaignHealthData {
  meta_status: 'healthy' | 'warning' | 'critical' | 'offline';
  google_status: 'healthy' | 'warning' | 'critical' | 'offline';
  overall_health: 'healthy' | 'warning' | 'critical';
  total_daily_spend: number;
  daily_spend_limit: number;
  active_campaigns: number;
  performance_score: number;
  last_updated: string;
}

class AdInsightsApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE}/api/v1${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if available
          ...(localStorage.getItem('accessToken') && {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.info(`API request successful: ${endpoint}`);
      return data;
    } catch (error) {
      logger.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get unified campaign insights from all platforms
   */
  async getCampaignInsights(
    params: {
      date_preset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d';
      account_ids?: string;
      include_inactive?: boolean;
      real_time?: boolean;
    } = {}
  ): Promise<AdInsightsResponse> {
    const searchParams = new URLSearchParams();

    if (params.date_preset) {
      searchParams.append('date_preset', params.date_preset);
    }
    if (params.account_ids) {
      searchParams.append('account_ids', params.account_ids);
    }
    if (params.include_inactive) {
      searchParams.append('include_inactive', 'true');
    }
    if (params.real_time) {
      searchParams.append('real_time', 'true');
    }

    const endpoint = `/ad-insights/campaigns${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.makeRequest<AdInsightsResponse>(endpoint);
  }

  /**
   * Get real-time alerts
   */
  async getAlerts(
    params: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      platform?: 'meta' | 'google';
      limit?: number;
    } = {}
  ): Promise<RealTimeAlert[]> {
    const searchParams = new URLSearchParams();

    if (params.severity) {
      searchParams.append('severity', params.severity);
    }
    if (params.platform) {
      searchParams.append('platform', params.platform);
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    const endpoint = `/ad-insights/alerts${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.makeRequest<RealTimeAlert[]>(endpoint);
  }

  /**
   * Get campaign health status
   */
  async getCampaignHealth(): Promise<CampaignHealthData> {
    return this.makeRequest<CampaignHealthData>('/ad-insights/health');
  }

  /**
   * Trigger manual campaign sync
   */
  async triggerSync(
    platforms?: ('meta' | 'google')[]
  ): Promise<{ success: boolean; message: string }> {
    const body = platforms ? { platforms } : {};

    return this.makeRequest('/ad-insights/sync', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get performance metrics for specific platform
   */
  async getPlatformMetrics(
    platform: 'meta' | 'google',
    params: {
      date_preset?: string;
      account_id?: string;
    } = {}
  ): Promise<UnifiedCampaignMetrics[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('platform', platform);

    if (params.date_preset) {
      searchParams.append('date_preset', params.date_preset);
    }
    if (params.account_id) {
      searchParams.append('account_id', params.account_id);
    }

    const endpoint = `/ad-insights/platform-metrics?${searchParams}`;
    return this.makeRequest<UnifiedCampaignMetrics[]>(endpoint);
  }
}

// Export singleton instance
export const adInsightsApi = new AdInsightsApiService();
