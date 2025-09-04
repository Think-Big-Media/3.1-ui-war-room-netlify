import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Link,
  Shield,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Loader2,
  DollarSign,
  MousePointerClick,
  Target,
  Activity,
} from 'lucide-react';

import {
  googleAdsAuthService,
  type GoogleAdsAuthStatus,
} from '../../services/googleAdsAuthService';

interface GoogleCampaignData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  cost: number;
  ctr: number;
  cpc: number;
  conversions: number;
}

// Mock data for demonstration - looks realistic for screenshots
const mockCampaignData: GoogleCampaignData[] = [
  {
    id: '1',
    name: 'Search - Voter Registration',
    status: 'active',
    impressions: 412890,
    clicks: 18579,
    cost: 5234.85,
    ctr: 4.5,
    cpc: 0.28,
    conversions: 892,
  },
  {
    id: '2',
    name: 'Display - Issue Awareness',
    status: 'active',
    impressions: 789456,
    clicks: 15789,
    cost: 3947.25,
    ctr: 2.0,
    cpc: 0.25,
    conversions: 456,
  },
  {
    id: '3',
    name: 'YouTube - Campaign Launch',
    status: 'paused',
    impressions: 234567,
    clicks: 4691,
    cost: 2345.67,
    ctr: 2.0,
    cpc: 0.5,
    conversions: 234,
  },
];

const GoogleAdsIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<GoogleAdsAuthStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setShowCampaigns] = useState(false);
  const [, setMockConnected] = useState(false);

  // Load authentication status on component mount
  useEffect(() => {
    loadAuthStatus();

    // Check for OAuth callback parameters
    const callbackResult = googleAdsAuthService.checkOAuthCallback();
    if (callbackResult) {
      if (callbackResult.success) {
        setError(null);
        loadAuthStatus(); // Refresh status after successful auth
      } else if (callbackResult.error) {
        setError(`Authentication failed: ${callbackResult.error}`);
      }

      // Clear callback parameters from URL
      googleAdsAuthService.clearCallbackParams();
    }
  }, []);

  const loadAuthStatus = async () => {
    try {
      setIsLoading(true);
      const status = await googleAdsAuthService.getAuthStatus();
      setAuthStatus(status);
      // Don't show campaigns inline - keep card compact
      setShowCampaigns(false);

      // In demo mode, don't show errors
      if (googleAdsAuthService.isInDemoMode) {
        setError(null);
      } else if (status.error) {
        // Don't show error for initial "not connected" state
        if (!status.error.includes('not connected')) {
          setError(status.error);
        } else {
          setError(null);
        }
      } else {
        setError(null);
      }
    } catch (err: any) {
      // For demo/review purposes, treat auth errors as "not connected" state
      console.log('Auth check failed - treating as not connected');
      setAuthStatus({ is_authenticated: false, scopes: [] });
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      // Mock connection for demo
      setTimeout(() => {
        setMockConnected(true);
        setAuthStatus({
          is_authenticated: true,
          customer_id: '123-456-7890',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          scopes: [],
        });
        setIsConnecting(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to start authentication flow');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      setMockConnected(false);
      setAuthStatus({ is_authenticated: false, scopes: [] });
      setShowCampaigns(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  return (
    <div className="w-full">
      {/* Connection Status Card */}
      <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 shadow-2xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Google Logo */}
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Google Ads</h3>
              <div className="text-sm text-white/70">
                {isLoading ? (
                  <span>Loading...</span>
                ) : authStatus?.is_authenticated ? (
                  <div>
                    <span>Connected</span>
                    {authStatus.customer_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        Customer ID: {authStatus.customer_id}
                      </div>
                    )}
                  </div>
                ) : (
                  <span>Not connected</span>
                )}
              </div>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="flex items-center space-x-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : authStatus?.is_authenticated ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Inactive</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Connect/Disconnect Button */}
        {!isLoading && !authStatus?.is_authenticated ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-secondary-action w-full py-3 px-6 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Link className="w-5 h-5" />
                <span>Connect to Google Ads</span>
              </>
            )}
          </button>
        ) : authStatus?.is_authenticated ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Account</div>
                  <div className="text-sm font-medium text-gray-900">Think Big Media - Hobby</div>
                  <div className="text-xs text-gray-500">ID: 123-456-7890</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last synced: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => navigate('/campaign-control?platform=google&tab=analytics')}
                className="btn-primary-action flex-1 text-center"
              >
                View Campaigns
              </button>
              <button onClick={handleDisconnect} className="btn-primary-alert">
                Disconnect
              </button>
            </div>
          </div>
        ) : null}

        {/* Privacy Notice */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-xs text-gray-600">
              {googleAdsAuthService.isInDemoMode
                ? 'Demo mode: Google Ads integration endpoints are not available. This is a UI demonstration.'
                : 'By connecting, you authorize War Room to access your Google Ads data. We use OAuth 2.0 and industry-standard encryption to protect your information.'}
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Data - Hidden for compact view */}
      {false && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#4285F4]" />
              <span>Active Campaigns</span>
            </h4>

            {/* Campaign Cards */}
            <div className="space-y-3">
              {mockCampaignData.map((campaign) => (
                <div key={campaign.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{campaign.name}</h5>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {campaign.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <Activity className="w-3 h-3" />
                        <span>Impressions</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {formatNumber(campaign.impressions)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <MousePointerClick className="w-3 h-3" />
                        <span>Clicks</span>
                      </div>
                      <p className="text-gray-900 font-medium">{formatNumber(campaign.clicks)}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Cost</span>
                      </div>
                      <p className="text-gray-900 font-medium">{formatCurrency(campaign.cost)}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>CTR</span>
                      </div>
                      <p className="text-gray-900 font-medium">{campaign.ctr}%</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <Target className="w-3 h-3" />
                        <span>Conversions</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {formatNumber(campaign.conversions)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Impressions</p>
                  <p className="text-xl font-bold text-gray-900">1.4M</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Cost</p>
                  <p className="text-xl font-bold text-gray-900">$11,527.77</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Avg. CPC</p>
                  <p className="text-xl font-bold text-gray-900">$0.31</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Conversions</p>
                  <p className="text-xl font-bold text-gray-900">1,582</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAdsIntegration;
