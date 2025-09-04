import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
  BarChart3,
  RefreshCw,
  Brain,
  Zap,
  Settings2,
  PieChart,
  LineChart,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
} from 'lucide-react';
import AdPreviewModal from './AdPreviewModal';

interface AdCreative {
  headline: string;
  description: string;
  imageUrl?: string;
  callToAction: string;
  displayUrl?: string;
  finalUrl: string;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: 'Google Ads' | 'Meta';
  status: 'Active' | 'Paused' | 'Ended';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  creative?: AdCreative;
}

const AdCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'Google Ads' | 'Meta'>('all');
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [selectedAdPreview, setSelectedAdPreview] = useState<AdCampaign | null>(null);
  const [authStatus, setAuthStatus] = useState({
    googleAds: false,
    meta: false,
  });

  // Mock data for now - will connect to real APIs
  const mockCampaigns: AdCampaign[] = [
    {
      id: '1',
      name: 'Voter Registration Drive',
      platform: 'Google Ads',
      status: 'Active',
      budget: 5000,
      spent: 2341,
      impressions: 45230,
      clicks: 1820,
      conversions: 156,
      ctr: 4.02,
      cpc: 1.29,
      creative: {
        headline: 'Register to Vote Today - Quick & Easy Process',
        description:
          'Make your voice heard in the upcoming election. Register online in just 5 minutes. Secure, official voter registration for your state.',
        displayUrl: 'vote.campaign2024.com/register',
        finalUrl: 'https://vote.campaign2024.com/register',
        callToAction: 'Register Now',
      },
    },
    {
      id: '2',
      name: 'Community Outreach',
      platform: 'Meta',
      status: 'Active',
      budget: 3000,
      spent: 1876,
      impressions: 89320,
      clicks: 3421,
      conversions: 287,
      ctr: 3.83,
      cpc: 0.55,
      creative: {
        headline: 'Join Our Community Movement',
        description:
          'Be part of the change in your neighborhood. Connect with local volunteers, attend events, and make a real difference. Together, we can build a better tomorrow.',
        imageUrl: 'https://via.placeholder.com/1200x630/4F46E5/ffffff?text=Community+Movement',
        finalUrl: 'https://campaign2024.com/community',
        callToAction: 'Learn More',
      },
    },
    {
      id: '3',
      name: 'Policy Awareness Campaign',
      platform: 'Meta',
      status: 'Paused',
      budget: 2500,
      spent: 2100,
      impressions: 67000,
      clicks: 2100,
      conversions: 98,
      ctr: 3.13,
      cpc: 1.0,
      creative: {
        headline: 'Understanding Our Policy Platform',
        description:
          'Get informed about the policies that matter to you. Healthcare, education, economy - see where we stand on the issues.',
        imageUrl: 'https://via.placeholder.com/1200x630/10B981/ffffff?text=Policy+Platform',
        finalUrl: 'https://campaign2024.com/policies',
        callToAction: 'View Policies',
      },
    },
  ];

  useEffect(() => {
    // Check auth status
    checkAuthStatus();
    // Load campaigns
    loadCampaigns();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check Google Ads auth - handle 404 gracefully
      let googleAuth = false;
      try {
        const googleResponse = await fetch('/api/v1/auth/google-ads/status');
        if (googleResponse.status !== 404) {
          const googleData = await googleResponse.json();
          googleAuth = googleData.authenticated || false;
        }
      } catch (error) {
        console.log('Google Ads auth endpoint not available - using demo mode');
      }

      // Check Meta auth - handle 404 gracefully
      let metaAuth = false;
      try {
        const metaResponse = await fetch('/api/v1/auth/meta/status');
        if (metaResponse.status !== 404) {
          const metaData = await metaResponse.json();
          metaAuth = metaData.authenticated || false;
        }
      } catch (error) {
        console.log('Meta auth endpoint not available - using demo mode');
      }

      setAuthStatus({
        googleAds: googleAuth,
        meta: metaAuth,
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Set default demo state
      setAuthStatus({
        googleAds: false,
        meta: false,
      });
    }
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // For now, use mock data
      // TODO: Replace with real API calls
      setTimeout(() => {
        setCampaigns(mockCampaigns);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    navigate('/settings?tab=integrations&platform=google-ads');
  };

  const handleConnectMeta = () => {
    navigate('/settings?tab=integrations&platform=meta');
  };

  const toggleCampaignExpansion = (campaignId: string) => {
    setExpandedCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const filteredCampaigns =
    selectedPlatform === 'all'
      ? campaigns
      : campaigns.filter((c) => c.platform === selectedPlatform);

  const totalSpent = filteredCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);

  return (
    <div className="space-y-6">
      {/* Platform Connection Status */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Platform Connections</h3>
          <button
            onClick={loadCampaigns}
            className="text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 mt-3">
          <button
            onClick={handleConnectGoogle}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              authStatus.googleAds
                ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {authStatus.googleAds ? '✓ Google Ads Connected' : 'Connect Google Ads'}
          </button>
          <button
            onClick={handleConnectMeta}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              authStatus.meta
                ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {authStatus.meta ? '✓ Meta Connected' : 'Connect Meta'}
          </button>
        </div>
      </div>

      {/* Platform Filter - Moved to top */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedPlatform === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          All Platforms
        </button>
        <button
          onClick={() => setSelectedPlatform('Google Ads')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedPlatform === 'Google Ads'
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          Google Ads
        </button>
        <button
          onClick={() => setSelectedPlatform('Meta')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            selectedPlatform === 'Meta'
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          Meta
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Spent</p>
              <p className="text-2xl font-bold text-white">${totalSpent.toLocaleString()}</p>
              <p className="text-xs text-white/50">of ${totalBudget.toLocaleString()} budget</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Impressions</p>
              <p className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Clicks</p>
              <p className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</p>
            </div>
            <Target className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Conversions</p>
              <p className="text-2xl font-bold text-white">{totalConversions}</p>
            </div>
            <Users className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Avg CTR</p>
              <p className="text-2xl font-bold text-white">
                {filteredCampaigns.length > 0
                  ? (
                      filteredCampaigns.reduce((sum, c) => sum + c.ctr, 0) /
                      filteredCampaigns.length
                    ).toFixed(2)
                  : '0.00'}
                %
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Campaigns Table - Moved up */}
      <div className="bg-white/10 backdrop-blur rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/70 font-medium w-8"></th>
              <th className="text-left p-4 text-white/70 font-medium">Campaign</th>
              <th className="text-left p-4 text-white/70 font-medium">Platform</th>
              <th className="text-left p-4 text-white/70 font-medium">Status</th>
              <th className="text-right p-4 text-white/70 font-medium">Budget</th>
              <th className="text-right p-4 text-white/70 font-medium">Spent</th>
              <th className="text-right p-4 text-white/70 font-medium">Impressions</th>
              <th className="text-right p-4 text-white/70 font-medium">Clicks</th>
              <th className="text-right p-4 text-white/70 font-medium">CTR</th>
              <th className="text-right p-4 text-white/70 font-medium">CPC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center p-8 text-white/50">
                  Loading campaigns...
                </td>
              </tr>
            ) : filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center p-8 text-white/50">
                  No campaigns found. Connect your ad accounts to get started.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => (
                <React.Fragment key={campaign.id}>
                  <tr
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => toggleCampaignExpansion(campaign.id)}
                  >
                    <td className="p-4">
                      {expandedCampaigns.has(campaign.id) ? (
                        <ChevronUp className="w-4 h-4 text-white/70" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/70" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{campaign.name}</span>
                        {campaign.creative && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAdPreview(campaign);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Ad Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-white/70">{campaign.platform}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          campaign.status === 'Active'
                            ? 'bg-green-500/20 text-green-400'
                            : campaign.status === 'Paused'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-white/70">
                      ${campaign.budget.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-white">
                      ${campaign.spent.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-white/70">
                      {campaign.impressions.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-white/70">
                      {campaign.clicks.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-white/70">{campaign.ctr.toFixed(2)}%</td>
                    <td className="p-4 text-right text-white/70">${campaign.cpc.toFixed(2)}</td>
                  </tr>
                  {expandedCampaigns.has(campaign.id) && campaign.creative && (
                    <tr className="bg-white/5">
                      <td colSpan={10} className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Ad Preview */}
                          <div>
                            <h4 className="text-white font-semibold mb-4 flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Ad Preview
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAdPreview(campaign);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View Full Size
                              </button>
                            </h4>
                            {campaign.platform === 'Google Ads' ? (
                              /* Google Ads Preview */
                              <div className="bg-white rounded-lg p-4 max-w-xl">
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <span className="bg-yellow-400 text-black text-xs px-1 py-0.5 rounded font-semibold">
                                      Ad
                                    </span>
                                    <div className="flex-1">
                                      <h3 className="text-blue-600 text-lg hover:underline cursor-pointer">
                                        {campaign.creative.headline}
                                      </h3>
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className="text-green-700">
                                          {campaign.creative.displayUrl}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm leading-relaxed">
                                    {campaign.creative.description}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              /* Meta/Facebook Ad Preview */
                              <div className="bg-white rounded-lg overflow-hidden max-w-xl shadow-lg">
                                <div className="p-3 border-b flex items-center gap-2">
                                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">C</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Campaign 2024</p>
                                    <p className="text-xs text-gray-500">Sponsored</p>
                                  </div>
                                </div>
                                {campaign.creative.imageUrl && (
                                  <img
                                    src={campaign.creative.imageUrl}
                                    alt={campaign.creative.headline}
                                    className="w-full h-64 object-cover"
                                  />
                                )}
                                <div className="p-4">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    {campaign.creative.headline}
                                  </h4>
                                  <p className="text-gray-600 text-sm mb-4">
                                    {campaign.creative.description}
                                  </p>
                                  <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md font-semibold hover:bg-blue-700 transition-colors">
                                    {campaign.creative.callToAction}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Performance Details */}
                          <div>
                            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Performance Details
                            </h4>
                            <div className="bg-white/10 rounded-lg p-4 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-white/70">Conversion Rate</span>
                                <span className="text-white font-semibold">
                                  {((campaign.conversions / campaign.clicks) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Cost per Conversion</span>
                                <span className="text-white font-semibold">
                                  ${(campaign.spent / campaign.conversions).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Budget Utilization</span>
                                <span className="text-white font-semibold">
                                  {((campaign.spent / campaign.budget) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="pt-3 border-t border-white/10">
                                <a
                                  href={campaign.creative?.finalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Landing Page
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Campaign Optimization */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Campaign Optimization
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Auto-Bidding</p>
            <p className="text-white">Enabled for 3 campaigns</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Budget Optimization</p>
            <p className="text-white">Active across platforms</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">A/B Testing</p>
            <p className="text-white">2 active tests</p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Insights
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-1" />
            <div>
              <p className="text-white text-sm">
                Voter Registration Drive campaign CTR is 15% above average
              </p>
              <p className="text-white/50 text-xs mt-1">Consider increasing budget by 20%</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-1" />
            <div>
              <p className="text-white text-sm">Meta campaigns performing better on weekends</p>
              <p className="text-white/50 text-xs mt-1">Adjust scheduling for maximum impact</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automation Rules
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Pause Low Performers</p>
            <p className="text-white text-sm">CTR &lt; 2% after 1000 impressions</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Scale Winners</p>
            <p className="text-white text-sm">Increase budget when CPA &lt; $5</p>
          </div>
        </div>
      </div>

      {/* Targeting & Audiences */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Targeting & Audiences
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Custom Audiences</p>
            <p className="text-white">12 active segments</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Lookalike Audiences</p>
            <p className="text-white">5 high-performers</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Geographic Targeting</p>
            <p className="text-white">3 key districts</p>
          </div>
        </div>
      </div>

      {/* Budget Allocation */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Budget Allocation
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-white/70 text-sm mb-2">By Platform</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white">Google Ads</span>
                <span className="text-white">55%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Meta</span>
                <span className="text-white">45%</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-sm mb-2">By Objective</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white">Awareness</span>
                <span className="text-white">40%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Conversion</span>
                <span className="text-white">60%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Performance Analysis
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">ROI</p>
            <p className="text-white text-xl font-bold">3.2x</p>
            <p className="text-green-400 text-xs">↑ 12% this week</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Cost per Acquisition</p>
            <p className="text-white text-xl font-bold">$4.85</p>
            <p className="text-green-400 text-xs">↓ 8% this week</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Quality Score</p>
            <p className="text-white text-xl font-bold">8.5/10</p>
            <p className="text-yellow-400 text-xs">Stable</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/70 text-sm mb-1">Engagement Rate</p>
            <p className="text-white text-xl font-bold">4.2%</p>
            <p className="text-green-400 text-xs">↑ 5% this week</p>
          </div>
        </div>
      </div>

      {/* Ad Preview Modal */}
      <AdPreviewModal
        isOpen={!!selectedAdPreview}
        campaign={selectedAdPreview}
        onClose={() => setSelectedAdPreview(null)}
      />
    </div>
  );
};

export default AdCampaigns;
