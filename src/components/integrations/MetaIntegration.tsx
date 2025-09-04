import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Link,
  Shield,
  BarChart3,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  DollarSign,
  Eye,
  FileText,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';

interface MetaCampaignData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpm: number;
}

// Mock data for demonstration - looks realistic for screenshots
const mockCampaignData: MetaCampaignData[] = [
  {
    id: '1',
    name: 'Q4 Voter Outreach Campaign',
    status: 'active',
    impressions: 245680,
    clicks: 12284,
    spend: 4850.75,
    ctr: 5.0,
    cpm: 19.75,
  },
  {
    id: '2',
    name: 'Early Voting Awareness Drive',
    status: 'active',
    impressions: 189342,
    clicks: 7574,
    spend: 3420.5,
    ctr: 4.0,
    cpm: 18.07,
  },
  {
    id: '3',
    name: 'Youth Engagement Initiative',
    status: 'paused',
    impressions: 98765,
    clicks: 3456,
    spend: 1875.25,
    ctr: 3.5,
    cpm: 18.99,
  },
];

const MetaIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [, setShowCampaigns] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      // Keep card compact - don't show campaigns inline
      setShowCampaigns(false);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setShowCampaigns(false);
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
            {/* Meta/Facebook Logo */}
            <div className="w-12 h-12 bg-[#1877F2] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">f</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Meta Business Suite</h3>
              <p className="text-sm text-white/70">{isConnected ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-3">
            {isConnected ? (
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

        {/* Connect/Disconnect Button */}
        {!isConnected ? (
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
                <span>Connect to Facebook</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Business Account</div>
                  <div className="text-sm font-medium text-gray-900">Think Big Business</div>
                  <div className="text-xs text-gray-500">ID: act_987654321</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last synced: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => navigate('/campaign-control?platform=meta&tab=analytics')}
                className="btn-primary-action flex-1 text-center"
              >
                View Campaigns
              </button>
              <button onClick={handleDisconnect} className="btn-primary-alert">
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Permissions Section */}
        <div className="mt-4 p-3 bg-purple-50/50 rounded-lg border border-purple-200/50">
          <h4 className="text-xs font-semibold text-purple-900 mb-2">Required Permissions:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1">
              <BarChart3 className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-700">Ads Management</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-700">Business Management</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-700">Pages Show List</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-700">Page Engagement</span>
            </div>
            <div className="flex items-center space-x-1">
              <ShoppingBag className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-700">Catalog Management</span>
            </div>
            <div className="flex items-center space-x-1">
              <UserCheck className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-700">Leads Retrieval</span>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-xs text-gray-600">
              By connecting, you authorize War Room to access your Meta Ads data. We use
              industry-standard encryption to protect your information.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Data - Hidden for compact view */}
      {false && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#1877F2]" />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <Eye className="w-3 h-3" />
                        <span>Impressions</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {formatNumber(campaign.impressions)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <Users className="w-3 h-3" />
                        <span>Clicks</span>
                      </div>
                      <p className="text-gray-900 font-medium">{formatNumber(campaign.clicks)}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Spend</span>
                      </div>
                      <p className="text-gray-900 font-medium">{formatCurrency(campaign.spend)}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>CTR</span>
                      </div>
                      <p className="text-gray-900 font-medium">{campaign.ctr}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Impressions</p>
                  <p className="text-xl font-bold text-gray-900">533,787</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Spend</p>
                  <p className="text-xl font-bold text-gray-900">$10,146.50</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Avg. CTR</p>
                  <p className="text-xl font-bold text-gray-900">4.2%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaIntegration;
