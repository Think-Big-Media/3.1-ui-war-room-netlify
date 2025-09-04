/**
 * MetricsDisplay Component
 * Real-time display of aggregated Meta & Google Ads metrics from live APIs
 * Performance target: <100ms render time
 */

import type React from 'react';
import { memo, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAdInsights, usePlatformMetrics } from '../../hooks/useAdInsights';

// Types
interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

interface PlatformMetricsProps {
  platform: 'meta' | 'google';
  metrics: any;
  color: string;
}

// Memoized metric card for performance
const MetricCard = memo<MetricCardProps>(
  ({ label, value, change, icon, color, prefix = '', suffix = '', loading = false }) => {
    const isPositiveChange = change && change > 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 will-change-transform fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>

        <div className="flex items-baseline justify-between">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {prefix}
              {value}
              {suffix}
            </span>
          )}

          {change !== undefined && !loading && (
            <div
              className={`flex items-center text-sm ${
                isPositiveChange ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositiveChange ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{formatPercentage(Math.abs(change))}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';

// Platform-specific metrics display
const PlatformMetrics = memo<PlatformMetricsProps>(({ platform, metrics, color }) => {
  if (!metrics || metrics.length === 0) {
    return (
      <div className={`rounded-lg p-4 ${color} bg-opacity-10`}>
        <h3 className="text-lg font-semibold mb-3 uppercase font-condensed tracking-wide text-white/40">
          {platform} ADS
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Aggregate metrics from campaigns array
  const aggregated = metrics.reduce(
    (acc: any, campaign: any) => ({
      spend: acc.spend + campaign.spend,
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
      conversions: acc.conversions + campaign.conversions,
      ctr: acc.ctr + campaign.ctr,
      cpc: acc.cpc + campaign.cpc,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0 }
  );

  const avgCtr = metrics.length > 0 ? aggregated.ctr / metrics.length : 0;
  const avgCpc = metrics.length > 0 ? aggregated.cpc / metrics.length : 0;
  const roas = aggregated.spend > 0 ? (aggregated.conversions * 50) / aggregated.spend : 0; // Estimated conversion value

  return (
    <div className={`rounded-lg p-4 ${color} bg-opacity-10 fade-in`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold uppercase font-condensed tracking-wide text-white/40">
          {platform} ADS
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {metrics.length} campaign{metrics.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Spend</p>
          <p className="text-lg font-bold">{formatCurrency(aggregated.spend)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">ROAS</p>
          <p className="text-lg font-bold">{roas.toFixed(2)}x</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">CTR</p>
          <p className="text-lg font-bold">{formatPercentage(avgCtr)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">CPC</p>
          <p className="text-lg font-bold">{formatCurrency(avgCpc)}</p>
        </div>
      </div>
    </div>
  );
});

PlatformMetrics.displayName = 'PlatformMetrics';

// Main MetricsDisplay component
export const MetricsDisplay: React.FC = memo(() => {
  // Live API data
  const {
    data: campaignData,
    isLoading,
    error,
  } = useAdInsights({
    date_preset: 'last_7d',
    real_time: true,
  });

  const { data: metaMetrics, isLoading: metaLoading } = usePlatformMetrics('meta', {
    date_preset: 'last_7d',
  });

  const { data: googleMetrics, isLoading: googleLoading } = usePlatformMetrics('google', {
    date_preset: 'last_7d',
  });

  const totalSpend = campaignData?.total_spend || 0;
  const isAnyLoading = isLoading || metaLoading || googleLoading;

  // Calculate performance metrics
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 100) {
        console.warn(`MetricsDisplay render time: ${renderTime}ms`);
      }
    };
  });

  // Memoize computed values from live API data
  const metrics = useMemo(() => {
    if (!campaignData || error) {
      return {
        spend: { value: '0', change: 0 },
        impressions: { value: '0', change: 0 },
        clicks: { value: '0', change: 0 },
        conversions: { value: '0', change: 0 },
      };
    }

    const totalConversions = campaignData.campaigns.reduce(
      (sum: number, c: any) => sum + c.conversions,
      0
    );

    return {
      spend: {
        value: formatCurrency(campaignData.total_spend),
        change: 12.5, // TODO: Calculate from historical data
      },
      impressions: {
        value: formatNumber(campaignData.total_impressions),
        change: 8.3, // TODO: Calculate from historical data
      },
      clicks: {
        value: formatNumber(campaignData.total_clicks),
        change: -2.1, // TODO: Calculate from historical data
      },
      conversions: {
        value: formatNumber(totalConversions),
        change: 15.7, // TODO: Calculate from historical data
      },
    };
  }, [campaignData, error]);

  // Show connection status
  const showConnectionWarning = error !== null;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {showConnectionWarning && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 fade-in">
          <div className="flex items-center space-x-2">
            <WifiOff size={16} className="text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-200">
              Unable to connect to live campaign data. Using fallback data.
            </p>
          </div>
        </div>
      )}
      {!showConnectionWarning && campaignData && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 fade-in">
          <div className="flex items-center space-x-2">
            <Wifi size={16} className="text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Live data connected • Last sync:{' '}
              {new Date(campaignData.last_sync).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Aggregated Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Spend"
          value={metrics.spend.value}
          change={metrics.spend.change}
          icon={<DollarSign size={20} />}
          color="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
          loading={isAnyLoading}
        />

        <MetricCard
          label="Impressions"
          value={metrics.impressions.value}
          change={metrics.impressions.change}
          icon={<Eye size={20} />}
          color="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
          loading={isAnyLoading}
        />

        <MetricCard
          label="Clicks"
          value={metrics.clicks.value}
          change={metrics.clicks.change}
          icon={<MousePointer size={20} />}
          color="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
          loading={isAnyLoading}
        />

        <MetricCard
          label="Conversions"
          value={metrics.conversions.value}
          change={metrics.conversions.change}
          icon={<Target size={20} />}
          color="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
          loading={isAnyLoading}
        />
      </div>

      {/* Platform-Specific Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlatformMetrics platform="meta" metrics={metaMetrics} color="bg-blue-500" />

        <PlatformMetrics platform="google" metrics={googleMetrics} color="bg-green-500" />
      </div>

      {/* Spend Distribution Chart */}
      {campaignData && totalSpend > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm fade-in">
          <h3 className="text-lg font-semibold mb-4">Spend Distribution</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex h-8 rounded-lg overflow-hidden">
                {(() => {
                  const metaSpend = campaignData.campaigns
                    .filter((c: any) => c.platform === 'meta')
                    .reduce((sum: number, c: any) => sum + c.spend, 0);
                  const googleSpend = campaignData.campaigns
                    .filter((c: any) => c.platform === 'google')
                    .reduce((sum: number, c: any) => sum + c.spend, 0);

                  return (
                    <>
                      <div
                        style={{
                          width: `${(metaSpend / totalSpend) * 100}%`,
                        }}
                        className="bg-blue-500"
                      />
                      <div
                        style={{
                          width: `${(googleSpend / totalSpend) * 100}%`,
                        }}
                        className="bg-green-500"
                      />
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex space-x-4 text-sm">
              {(() => {
                const metaSpend = campaignData.campaigns
                  .filter((c: any) => c.platform === 'meta')
                  .reduce((sum: number, c: any) => sum + c.spend, 0);
                const googleSpend = campaignData.campaigns
                  .filter((c: any) => c.platform === 'google')
                  .reduce((sum: number, c: any) => sum + c.spend, 0);

                return (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
                      <span>Meta: {formatPercentage((metaSpend / totalSpend) * 100)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                      <span>Google: {formatPercentage((googleSpend / totalSpend) * 100)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MetricsDisplay.displayName = 'MetricsDisplay';

// Utility functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
