// Example unified ads dashboard component using both Meta and Google Ads hooks
import type React from 'react';
import { useState } from 'react';
import {
  useMetaAuth,
  useMetaAccountInsights,
  useGoogleAdsAuth,
  useGoogleAdsAccountInsights,
  useGoogleAdsCustomers,
} from './index';
import type { InsightsParams as MetaInsightsParams } from '../../api/meta/types';
import type { InsightsParams as GoogleInsightsParams } from '../../api/google/types';

export const UnifiedAdsDashboard: React.FC = () => {
  // Meta authentication
  const {
    isAuthenticated: isMetaAuthenticated,
    getLoginUrl: getMetaLoginUrl,
    logout: logoutMeta,
  } = useMetaAuth();

  // Google Ads authentication
  const {
    isAuthenticated: isGoogleAuthenticated,
    getLoginUrl: getGoogleLoginUrl,
    logout: logoutGoogle,
  } = useGoogleAdsAuth();

  // Google Ads customers
  const { data: googleCustomers } = useGoogleAdsCustomers({
    enabled: isGoogleAuthenticated,
  });

  // State for selected accounts
  const [selectedMetaAccountId, setSelectedMetaAccountId] = useState<string>('');
  const [selectedGoogleCustomerId, setSelectedGoogleCustomerId] = useState<string>('');

  // Insights parameters
  const metaInsightsParams: MetaInsightsParams = {
    accountId: selectedMetaAccountId,
    date_preset: 'last_30d',
    fields: ['impressions', 'clicks', 'spend', 'ctr', 'conversions'],
    breakdowns: ['age', 'gender'],
  };

  const googleInsightsParams: GoogleInsightsParams = {
    account_id: selectedGoogleCustomerId,
    date_preset: 'last_30_days',
    fields: ['impressions', 'clicks', 'cost', 'conversions'],
    breakdowns: ['device'],
  };

  // Fetch insights
  const { data: metaInsights, isLoading: metaLoading } = useMetaAccountInsights(
    selectedMetaAccountId,
    metaInsightsParams,
    { enabled: isMetaAuthenticated && Boolean(selectedMetaAccountId) }
  );

  const { data: googleInsights, isLoading: googleLoading } = useGoogleAdsAccountInsights(
    selectedGoogleCustomerId,
    googleInsightsParams,
    { enabled: isGoogleAuthenticated && Boolean(selectedGoogleCustomerId) }
  );

  // Authentication handlers
  const handleMetaLogin = () => {
    const loginUrl = getMetaLoginUrl(['ads_read', 'ads_management']);
    window.location.href = loginUrl;
  };

  const handleGoogleLogin = () => {
    const loginUrl = getGoogleLoginUrl(['https://www.googleapis.com/auth/adwords']);
    window.location.href = loginUrl;
  };

  return (
    <div className="unified-ads-dashboard p-6">
      <h1 className="text-3xl font-bold mb-6">Unified Ads Dashboard</h1>

      {/* Authentication Status */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Meta Business</h2>
          {isMetaAuthenticated ? (
            <div>
              <p className="text-green-600 mb-4">✓ Connected</p>
              <button
                onClick={logoutMeta}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleMetaLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect Meta Business
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Google Ads</h2>
          {isGoogleAuthenticated ? (
            <div>
              <p className="text-green-600 mb-4">✓ Connected</p>
              <button
                onClick={logoutGoogle}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect Google Ads
            </button>
          )}
        </div>
      </div>

      {/* Account Selection */}
      {isGoogleAuthenticated && googleCustomers && (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Select Google Ads Account</label>
          <select
            value={selectedGoogleCustomerId}
            onChange={(e) => setSelectedGoogleCustomerId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select an account</option>
            {googleCustomers.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.descriptiveName} ({customer.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Insights Display */}
      <div className="grid grid-cols-2 gap-6">
        {/* Meta Insights */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Meta Insights (Last 30 Days)</h3>
          {metaLoading ? (
            <p>Loading Meta insights...</p>
          ) : metaInsights ? (
            <div className="space-y-2">
              <p>
                Impressions: {parseInt((metaInsights as any)?.impressions || '0').toLocaleString()}
              </p>
              <p>Clicks: {parseInt((metaInsights as any)?.clicks || '0').toLocaleString()}</p>
              <p>Spend: ${parseFloat((metaInsights as any)?.spend || '0').toFixed(2)}</p>
              <p>CTR: {parseFloat((metaInsights as any)?.ctr || '0').toFixed(2)}%</p>
              <p>
                Conversions:{' '}
                {(metaInsights as any)?.actions?.find((a: any) => a.action_type === 'conversions')
                  ?.value || '0'}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Select an account to view insights</p>
          )}
        </div>

        {/* Google Ads Insights */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Google Ads Insights (Last 30 Days)</h3>
          {googleLoading ? (
            <p>Loading Google Ads insights...</p>
          ) : googleInsights ? (
            <div className="space-y-2">
              <p>
                Impressions:{' '}
                {parseInt(
                  (googleInsights as any)?.summary?.totalImpressions || '0'
                ).toLocaleString()}
              </p>
              <p>
                Clicks:{' '}
                {parseInt((googleInsights as any)?.summary?.totalClicks || '0').toLocaleString()}
              </p>
              <p>Cost: ${((googleInsights as any)?.summary?.totalSpend || 0).toFixed(2)}</p>
              <p>
                Conversions:{' '}
                {((googleInsights as any)?.summary?.totalConversions || 0).toLocaleString()}
              </p>
              <p>
                CPC: $
                {(
                  ((googleInsights as any)?.summary?.totalSpend || 0) /
                  ((googleInsights as any)?.summary?.totalClicks || 1)
                ).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Select an account to view insights</p>
          )}
        </div>
      </div>

      {/* Combined Metrics */}
      {metaInsights && googleInsights && (
        <div className="mt-8 bg-gray-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Combined Performance</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Impressions</p>
              <p className="text-2xl font-bold">
                {(
                  parseInt((metaInsights as any)?.impressions || '0') +
                  parseInt((googleInsights as any)?.summary?.totalImpressions || '0')
                ).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold">
                {(
                  parseInt((metaInsights as any)?.clicks || '0') +
                  parseInt((googleInsights as any)?.summary?.totalClicks || '0')
                ).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold">
                $
                {(
                  parseFloat((metaInsights as any)?.spend || '0') +
                  ((googleInsights as any)?.summary?.totalSpend || 0)
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Conversions</p>
              <p className="text-2xl font-bold">
                {(
                  parseInt(
                    (metaInsights as any)?.actions?.find(
                      (a: any) => a.action_type === 'conversions'
                    )?.value || '0'
                  ) + ((googleInsights as any)?.summary?.totalConversions || 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAdsDashboard;
