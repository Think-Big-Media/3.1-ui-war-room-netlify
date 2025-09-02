/**
 * Example React Component using Meta Business API
 */

import React, { useState, useEffect } from 'react';
import { createMetaApi } from './index';
import { type AdAccount, type Campaign, type InsightData } from './types';

// Initialize Meta API
const metaApi = createMetaApi();

export function MetaIntegrationExample() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Check authentication status
  useEffect(() => {
    const token = metaApi.auth.getCurrentToken();
    setIsAuthenticated(Boolean(token));
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      handleAuthCallback(code);
    }
  }, []);

  const handleAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      const token = await metaApi.exchangeCode(code);
      setIsAuthenticated(true);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Load initial data
      await loadAdAccounts();
    } catch (err) {
      setError(`Authentication failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const startAuth = () => {
    const state = Math.random().toString(36).substring(7);
    const authUrl = metaApi.getAuthUrl(state);
    window.location.href = authUrl;
  };

  const loadAdAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await metaApi.getAdAccounts();
      setAdAccounts(accounts);

      // Auto-select first account
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].account_id);
        await loadCampaigns(accounts[0].account_id);
      }
    } catch (err) {
      setError(`Failed to load ad accounts: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async (accountId: string) => {
    try {
      setLoading(true);
      const campaignData = await metaApi.getCampaigns(accountId);
      setCampaigns(campaignData);

      // Load insights
      await loadInsights(accountId);
    } catch (err) {
      setError(`Failed to load campaigns: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async (accountId: string) => {
    try {
      setLoading(true);
      const insightData = await metaApi.getAccountInsights(accountId, {
        date_preset: 'last_30d',
      });
      setInsights(insightData);
    } catch (err) {
      setError(`Failed to load insights: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    loadCampaigns(accountId);
  };

  const refreshData = () => {
    metaApi.client.clearCache();
    if (selectedAccount) {
      loadCampaigns(selectedAccount);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Meta Business Integration</h2>
        <button
          onClick={startAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Connect Meta Business Account
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Meta Business Dashboard</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Ad Account</label>
        <select
          value={selectedAccount}
          onChange={(e) => handleAccountChange(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
        >
          {adAccounts.map((account) => (
            <option key={account.account_id} value={account.account_id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Campaigns Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Campaigns</h3>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="flex justify-between">
                  <span className="truncate">{campaign.name}</span>
                  <span
                    className={`text-sm ${
                      campaign.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Insights Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Last 30 Days</h3>
          {insights.length > 0 && (
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>Spend:</dt>
                <dd className="font-semibold">${insights[0].spend}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Impressions:</dt>
                <dd className="font-semibold">
                  {Number(insights[0].impressions).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Clicks:</dt>
                <dd className="font-semibold">{Number(insights[0].clicks).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>CTR:</dt>
                <dd className="font-semibold">{insights[0].ctr}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>CPC:</dt>
                <dd className="font-semibold">${insights[0].cpc}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Rate Limit Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">API Status</h3>
          {(() => {
            const status = metaApi.client.getRateLimitStatus();
            return (
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt>Requests Remaining:</dt>
                  <dd className="font-semibold">{status.requestsRemaining}/200</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Reset Time:</dt>
                  <dd className="text-sm">{status.resetTime.toLocaleTimeString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Status:</dt>
                  <dd className={status.inBackoff ? 'text-red-600' : 'text-green-600'}>
                    {status.inBackoff ? 'Rate Limited' : 'Normal'}
                  </dd>
                </div>
              </dl>
            );
          })()}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={refreshData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
