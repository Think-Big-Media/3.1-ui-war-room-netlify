import type React from 'react';
import { useState } from 'react';
import { useCampaignSummary } from '../../hooks/useCampaignData';
import { useNotifications } from '../shared/NotificationSystem';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Brain,
  Sparkles,
  ChevronRight,
  Facebook,
  Activity,
  ShoppingBag,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Download,
  Calendar,
  Settings,
  Pause,
  Play,
  Edit3,
  ChevronDown,
  RefreshCw,
  Columns,
  Check,
} from 'lucide-react';

interface PlatformAnalyticsProps {
  platform: 'meta' | 'google' | 'both';
}

type DensityMode = 'compact' | 'normal' | 'comfortable';

const PlatformAnalytics: React.FC<PlatformAnalyticsProps> = ({ platform: initialPlatform }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google'>('all');
  
  // Real campaign data hooks
  const { meta: metaCampaignsData, google: googleCampaignsData, loading: campaignLoading, syncAll } = useCampaignSummary();
  const { showSuccess, showError } = useNotifications();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [aiAutoOptimize, setAiAutoOptimize] = useState(false);
  const [densityMode, setDensityMode] = useState<DensityMode>('normal');
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    campaign: true,
    platform: true,
    status: true,
    budget: true,
    performance: true,
    aiInsight: true,
    actions: true,
  });

  // Transform real Meta campaign data to match UI structure
  const metaCampaigns = metaCampaignsData.data?.campaigns?.map((campaign) => ({
    id: campaign.id || 'unknown',
    name: campaign.name || 'Unnamed Campaign',
    platform: 'Meta Business Suite',
    platformType: 'meta' as const,
    status: campaign.status || 'unknown',
    budget: 'N/A', // Budget not available in current API structure
    spent: `$${(campaign.spend || 0).toLocaleString()}`,
    impressions: (campaign.impressions || 0).toLocaleString(),
    clicks: Math.round((campaign.impressions || 0) * (campaign.ctr || 0) / 100).toLocaleString(),
    conversions: (campaign.conversions || 0).toString(),
    ctr: `${(campaign.ctr || 0)}%`,
    cpm: `$${(campaign.cpm || 0).toFixed(2)}`,
    roas: `${(campaign.roas || 0)}x`,
    aiInsight: `Campaign ROAS of ${campaign.roas || 0}x ${(campaign.roas || 0) > 3 ? 'exceeds' : (campaign.roas || 0) > 2 ? 'meets' : 'below'} industry average. ${campaign.status === 'active' ? 'Active and optimizing.' : 'Paused - consider resuming.'}`,
    trend: (campaign.roas || 0) > 3 ? 'up' as const : (campaign.roas || 0) > 2 ? 'stable' as const : 'down' as const,
  })) || [];

  // Transform real Google campaign data to match UI structure
  const googleCampaigns = googleCampaignsData.data?.campaigns?.map((campaign) => ({
    id: campaign.id || 'unknown',
    name: campaign.name || 'Unnamed Campaign',
    platform: 'Google Ads',
    platformType: 'google' as const,
    status: campaign.status || 'unknown',
    budget: 'N/A', // Budget not available in current API structure
    spent: `$${(campaign.cost || 0).toLocaleString()}`,
    impressions: (campaign.impressions || 0).toLocaleString(),
    clicks: Math.round((campaign.impressions || 0) * (campaign.ctr || 0) / 100).toLocaleString(),
    conversions: (campaign.conversions || 0).toString(),
    ctr: `${(campaign.ctr || 0)}%`,
    cpc: `$${(campaign.cpc || 0).toFixed(2)}`,
    roas: `${(campaign.roas || 0)}x`,
    aiInsight: `Campaign with ${campaign.ctr || 0}% CTR and $${(campaign.cpc || 0).toFixed(2)} CPC. ${(campaign.roas || 0) > 3 ? 'Excellent ROAS - consider scaling.' : (campaign.roas || 0) > 2 ? 'Good performance - monitor closely.' : 'Below target - needs optimization.'}`,
    trend: (campaign.roas || 0) > 3 ? 'up' as const : (campaign.roas || 0) > 2 ? 'stable' as const : 'down' as const,
  })) || [];

  const allCampaigns = [...metaCampaigns, ...googleCampaigns];

  const filteredCampaigns =
    platformFilter === 'all'
      ? allCampaigns
      : platformFilter === 'meta'
        ? metaCampaigns
        : googleCampaigns;

  const toggleCampaignSelection = (campaignId: string) => {
    const newSelection = new Set(selectedCampaigns);
    if (newSelection.has(campaignId)) {
      newSelection.delete(campaignId);
    } else {
      newSelection.add(campaignId);
    }
    setSelectedCampaigns(newSelection);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Applying ${action} to ${selectedCampaigns.size} campaigns`);
    setBulkActionOpen(false);
  };

  // Calculate metrics based on selected platform
  const calculateMetrics = () => {
    const campaignsToCalculate = filteredCampaigns;

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalConversions = 0;
    let totalClicks = 0;

    campaignsToCalculate.forEach((campaign) => {
      totalSpend += parseFloat(campaign.spent.replace(/[$,]/g, ''));
      totalImpressions += parseInt(campaign.impressions.replace(/,/g, ''));
      totalConversions += parseInt(campaign.conversions?.replace(/,/g, '') || '0');
      totalClicks += parseInt(campaign.clicks?.replace(/,/g, '') || '0');
    });

    const avgRoas =
      campaignsToCalculate.length > 0
        ? campaignsToCalculate.reduce(
            (acc, c) =>
              acc + parseFloat(c.roas?.replace('x', '') || c.ctr?.replace('%', '') || '0'),
            0
          ) / campaignsToCalculate.length
        : 0;

    return {
      totalSpend: `$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      totalImpressions:
        totalImpressions > 1000
          ? `${(totalImpressions / 1000).toFixed(1)}K`
          : totalImpressions.toString(),
      totalConversions: totalConversions.toLocaleString(),
      avgRoas: `${avgRoas.toFixed(1)}x`,
    };
  };

  const metrics = calculateMetrics();

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  // Get density-based styles
  const getDensityStyles = () => {
    switch (densityMode) {
      case 'compact':
        return {
          padding: 'px-2 py-1',
          fontSize: 'text-xs',
          headerPadding: 'px-2 py-2',
        };
      case 'comfortable':
        return {
          padding: 'px-4 py-3',
          fontSize: 'text-sm',
          headerPadding: 'px-4 py-3',
        };
      default:
        return {
          padding: 'px-3 py-2',
          fontSize: 'text-sm',
          headerPadding: 'px-3 py-2.5',
        };
    }
  };

  const densityStyles = getDensityStyles();

  return (
    <div className="space-y-4">
      {/* AI-Powered Insights Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-condensed flex items-center gap-2 uppercase">
              <Brain className="h-6 w-6" />
              <div
                style={{
                  fontWeight: '500',
                }}
              >
                AI-POWERED CAMPAIGN INTELLIGENCE
              </div>
            </h2>
            <p className="mt-2 text-blue-100">
              WarRoom's AI analyzes your campaigns in real-time to optimize performance and maximize
              ROI
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">AI Active</span>
          </div>
        </div>

        {/* Key AI Recommendations */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-yellow-300" />
              Urgent Optimization
            </div>
            <p className="mt-1 text-sm">Pause underperforming ad sets saving $1,200/month</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-300" />
              Growth Opportunity
            </div>
            <p className="mt-1 text-sm">Scale top campaigns for 3.5x ROAS potential</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-blue-300" />
              Audience Insight
            </div>
            <p className="mt-1 text-sm">New high-value segment identified: +23% engagement</p>
          </div>
        </div>
      </div>

      {/* Main Campaign Dashboard - Unified Panel */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
        {/* Platform Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              platformFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Campaigns
          </button>
          <button
            onClick={() => setPlatformFilter('meta')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              platformFilter === 'meta'
                ? 'bg-[#1877F2] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Facebook className="h-4 w-4" />
            Meta
          </button>
          <button
            onClick={() => setPlatformFilter('google')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              platformFilter === 'google'
                ? 'bg-[#4285F4] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            Google
          </button>
        </div>

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {platformFilter === 'all'
                    ? 'Total'
                    : platformFilter === 'meta'
                      ? 'Meta'
                      : 'Google'}{' '}
                  Spend
                </p>
                <div
                  style={{
                    font: '400 25px/33px "Barlow Condensed", sans-serif ',
                  }}
                >
                  {metrics.totalSpend}
                </div>
                <div
                  style={{
                    color: 'rgb(22, 163, 74)',
                    marginTop: '4px',
                    font: '400 12px/16.5px JetBrains Mono, monospace ',
                  }}
                >
                  ↑ 12% vs last period
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {platformFilter === 'all'
                    ? 'Total'
                    : platformFilter === 'meta'
                      ? 'Meta'
                      : 'Google'}{' '}
                  Impressions
                </p>
                <div
                  style={{
                    font: '400 25px/33px "Barlow Condensed", sans-serif ',
                  }}
                >
                  {metrics.totalImpressions}
                </div>
                <div
                  style={{
                    color: 'rgb(22, 163, 74)',
                    marginTop: '4px',
                    font: '400 12px/16.5px JetBrains Mono, monospace ',
                  }}
                >
                  ↑ 28% reach increase
                </div>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {platformFilter === 'all'
                    ? 'Total'
                    : platformFilter === 'meta'
                      ? 'Meta'
                      : 'Google'}{' '}
                  Conversions
                </p>
                <div
                  style={{
                    font: '400 25px/33px "Barlow Condensed", sans-serif ',
                  }}
                >
                  {metrics.totalConversions}
                </div>
                <div
                  style={{
                    color: 'rgb(22, 163, 74)',
                    marginTop: '4px',
                    font: '400 12px/16.5px JetBrains Mono, monospace ',
                  }}
                >
                  ↑ 45% conversion rate
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {platformFilter === 'all'
                    ? 'Avg.'
                    : platformFilter === 'meta'
                      ? 'Meta'
                      : 'Google'}{' '}
                  ROAS
                </p>
                <div
                  style={{
                    font: '400 25px/33px "Barlow Condensed", sans-serif ',
                  }}
                >
                  {metrics.avgRoas}
                </div>
                <div
                  style={{
                    color: 'rgb(22, 163, 74)',
                    marginTop: '4px',
                    font: '400 12px/16.5px JetBrains Mono, monospace ',
                  }}
                >
                  ↑ 0.4x improvement
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Campaign Management Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              className="btn-secondary-action flex items-center gap-2 px-4 py-2 opacity-50 cursor-not-allowed" 
              disabled
              title="View-only mode - campaign creation disabled"
            >
              <Plus className="h-4 w-4" />
              Create New Campaign
            </button>

            <div className="relative">
              <button
                disabled
                className="btn-secondary-neutral flex items-center gap-2 px-4 py-2 opacity-50 cursor-not-allowed"
                title="View-only mode - bulk actions disabled"
              >
                <Settings className="h-4 w-4" />
                Bulk Actions (0)
                <ChevronDown className="h-4 w-4" />
              </button>

              {bulkActionOpen && selectedCampaigns.size > 0 && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 z-10">
                  <button
                    onClick={() => handleBulkAction('pause')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-mono uppercase"
                  >
                    PAUSE SELECTED
                  </button>
                  <button
                    onClick={() => handleBulkAction('resume')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    Resume Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('adjust-budget')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    Adjust Budgets
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={syncAll}
              disabled={campaignLoading}
              className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                campaignLoading 
                  ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${campaignLoading ? 'animate-spin' : ''}`} />
              {campaignLoading ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Column Settings */}
            <div className="relative">
              <button
                onClick={() => setColumnSettingsOpen(!columnSettingsOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Columns className="h-4 w-4" />
                Columns
              </button>

              {columnSettingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 z-10 p-3">
                  <div className="font-medium text-sm text-gray-900 mb-2">Show/Hide Columns</div>
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 py-1 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize">
                        {key === 'aiInsight' ? 'AI Insights' : key}
                      </span>
                    </label>
                  ))}
                  <div className="border-t mt-2 pt-2">
                    <div className="font-medium text-sm text-gray-900 mb-2">Density</div>
                    <div className="space-y-1">
                      {(['compact', 'normal', 'comfortable'] as DensityMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setDensityMode(mode)}
                          className={`w-full text-left px-2 py-1 text-sm rounded ${
                            densityMode === mode
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="capitalize">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setAiAutoOptimize(!aiAutoOptimize)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                aiAutoOptimize
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Brain className="h-4 w-4" />
              AI Auto-Optimize
              <span
                className={`h-2 w-2 rounded-full ${aiAutoOptimize ? 'bg-[var(--accent-live-monitoring)]' : 'bg-gray-400'}`}
              />
            </button>
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="bg-gray-50/30 rounded-xl border border-gray-200/30 overflow-hidden mb-6">
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Live Campaign Performance</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Real-time data synchronized from Meta Business Suite and Google Ads
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">VIEW-ONLY MODE</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Last updated: {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className={`${densityStyles.headerPadding} text-left sticky left-0 bg-gray-50 z-10`}
                  >
                    <input
                      type="checkbox"
                      disabled
                      checked={false}
                      className="rounded border-gray-300 opacity-50 cursor-not-allowed"
                      title="View-only mode - bulk selection disabled"
                    />
                  </th>
                  {visibleColumns.campaign && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]`}
                    >
                      Campaign
                    </th>
                  )}
                  {visibleColumns.platform && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]`}
                    >
                      Platform
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]`}
                    >
                      Status
                    </th>
                  )}
                  {visibleColumns.budget && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]`}
                    >
                      Budget/Spent
                    </th>
                  )}
                  {visibleColumns.performance && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]`}
                    >
                      Performance
                    </th>
                  )}
                  {visibleColumns.aiInsight && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[250px]`}
                    >
                      AI Insight
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th
                      className={`${densityStyles.headerPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 min-w-[180px]`}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 active:scale-[0.999] transition-transform duration-100"
                  >
                    <td className={`${densityStyles.padding} sticky left-0 bg-white/95`}>
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        className="rounded border-gray-300 opacity-50 cursor-not-allowed"
                        title="View-only mode - campaign selection disabled"
                      />
                    </td>
                    {visibleColumns.campaign && (
                      <td className={`${densityStyles.padding} whitespace-nowrap`}>
                        <div>
                          <div className={`${densityStyles.fontSize} font-medium text-gray-900`}>
                            {campaign.name}
                          </div>
                          <div className="text-xs text-gray-500">ID: {campaign.id}</div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.platform && (
                      <td className={`${densityStyles.padding} whitespace-nowrap`}>
                        <div className="flex items-center gap-2">
                          {campaign.platformType === 'meta' ? (
                            <>
                              <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                              <span className={`${densityStyles.fontSize} text-gray-900`}>
                                {campaign.platform.split(' ')[0]}
                              </span>
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
                              <span className={`${densityStyles.fontSize} text-gray-900`}>
                                {campaign.platform.split(' ')[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className={`${densityStyles.padding} whitespace-nowrap`}>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <span
                            className={`mr-1 h-1.5 w-1.5 rounded-full ${
                              campaign.status === 'active'
                                ? 'bg-[var(--accent-live-monitoring)]'
                                : 'bg-gray-400'
                            }`}
                          />
                          {campaign.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.budget && (
                      <td className={`${densityStyles.padding} whitespace-nowrap`}>
                        <div className={`${densityStyles.fontSize} text-gray-900`}>
                          {campaign.spent}
                        </div>
                        <div className="text-xs text-gray-500">of {campaign.budget}</div>
                      </td>
                    )}
                    {visibleColumns.performance && (
                      <td className={`${densityStyles.padding} whitespace-nowrap`}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className={`${densityStyles.fontSize} text-gray-900`}>
                              {campaign.impressions.split(',')[0]}K
                            </div>
                            <div className="text-xs text-gray-500">
                              {campaign.clicks ? `${campaign.clicks.split(',')[0]}K clicks` : ''}
                            </div>
                          </div>
                          {campaign.trend === 'up' && (
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                          )}
                          {campaign.trend === 'stable' && (
                            <Activity className="h-3.5 w-3.5 text-yellow-500" />
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.aiInsight && (
                      <td className={`${densityStyles.padding}`}>
                        <div className="flex items-start gap-2">
                          <Brain className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 line-clamp-2 max-w-[250px]">
                            {campaign.aiInsight}
                          </p>
                        </div>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td
                        className={`${densityStyles.padding} whitespace-nowrap sticky right-0 bg-white/95`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-gray-400 cursor-not-allowed rounded transition-colors"
                            title="View-only mode - editing disabled"
                            disabled
                          >
                            {campaign.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="p-1.5 text-gray-400 cursor-not-allowed rounded transition-colors"
                            title="View-only mode - editing disabled"
                            disabled
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                            disabled
                            title="View-only mode - optimization disabled"
                          >
                            AI Optimize
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Add footer with count and padding */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredCampaigns.length}{' '}
              {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'}
            </p>
          </div>
        </div>

        {/* AI Optimization Recommendations */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Optimization Recommendations
            </h3>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Apply All Recommendations
              </button>
              <button className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Optimization
              </button>
              <button className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-200/50">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Increase Budget: Q4 Voter Outreach
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This campaign is exceeding KPIs by 23%. Increasing budget by $2,000 could yield an
                  additional 450 conversions based on current performance metrics.
                </p>
                <button className="mt-2 text-xs font-medium text-green-600 hover:text-green-700">
                  Apply Recommendation →
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-yellow-200/50">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Audience Refinement: YouTube Campaign
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Mobile viewers show 40% higher completion rates. Consider creating mobile-first
                  15-second versions of your video ads for better engagement.
                </p>
                <button className="mt-2 text-xs font-medium text-yellow-600 hover:text-yellow-700">
                  Review Suggestion →
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-red-200/50">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Pause Underperforming: Generic Display Ads
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  3 ad sets are performing below 1.5x ROAS threshold. Pausing these could save
                  $1,200/month to reallocate to high-performing campaigns.
                </p>
                <button className="mt-2 text-xs font-medium text-red-600 hover:text-red-700">
                  Review Ad Sets →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How WarRoom Uses Your Data */}
        <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200/30">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How WarRoom Leverages Your Campaign Data
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Real-Time Optimization</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Continuously monitors campaign performance metrics
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  AI analyzes patterns to identify optimization opportunities
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Automatically suggests budget reallocations for maximum ROI
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  One-click implementation of AI recommendations
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Unified Campaign Management
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Single dashboard for all Meta and Google campaigns
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Cross-platform performance comparison and insights
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Automated reporting and stakeholder updates
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Direct campaign editing without leaving WarRoom
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
