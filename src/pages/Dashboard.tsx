import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeParseJSON } from '../utils/localStorage';
import { CampaignSetupData, defaultCampaignData } from '../types/campaign';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import { WidgetErrorBoundary } from '../components/shared/ErrorBoundary';
import { SWOTRadarDashboard } from '../components/generated/SWOTRadarDashboard';
import CommandStatusBar from '../components/dashboard/CommandStatusBar';
import MentionlyticsPoliticalMap from '../components/political/MentionlyticsPoliticalMap';
import { DualPieCharts } from '../components/dashboard/DualPieCharts';
import { PlatformDominanceGrid } from '../components/dashboard/PlatformDominanceGrid';
import { PhraseCloud } from '../components/dashboard/PhraseCloud';
import { CompetitorAnalysis } from '../components/dashboard/CompetitorAnalysis';
import { LiveIntelligence } from '../components/dashboard/LiveIntelligence';
import { CampaignSetupModal } from '../components/mentionlytics/CampaignSetupModal';
import {
  useSentimentAnalysis,
  useMentionlyticsDashboard,
  useCrisisAlerts,
} from '../hooks/useMentionlytics';
import { useCampaignSummary } from '../hooks/useCampaignData';
import { Zap, Radio, PenTool, TrendingUp, Smartphone, AlertTriangle, Settings } from 'lucide-react';
import '../main-dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignSetupData | null>(null);

  // Mentionlytics Data Hooks
  const { data: sentimentData, dataMode } = useSentimentAnalysis();
  const { alerts: crisisAlerts } = useCrisisAlerts();
  const dashboard = useMentionlyticsDashboard();

  // Campaign Data Hooks
  const { meta: metaCampaigns, google: googleCampaigns, loading: campaignLoading } = useCampaignSummary();

  console.log('🏠 [DASHBOARD PAGE] Rendering at', window.location.pathname);
  console.log('🔄 [DASHBOARD] Component render at', performance.now());

  // Load campaign data from localStorage safely
  useEffect(() => {
    const campaignData = safeParseJSON<CampaignSetupData>('warRoomCampaignSetup', {
      fallback: defaultCampaignData,
    });
    if (campaignData && campaignData.campaignName) {
      setCampaignData(campaignData);
    }
  }, []);

  const handleOpenSetup = () => {
    setShowSetupModal(true);
  };

  const handleSetupComplete = (data: CampaignSetupData) => {
    setCampaignData(data);
    setShowSetupModal(false);
  };

  const handleQuickActionClick = (action: string) => {
    switch (action) {
      case 'quick-campaign':
        navigate('/campaign-control');
        break;
      case 'live-monitor':
        navigate('/real-time-monitoring');
        break;
      case 'make-content':
        navigate('/campaign-control');
        break;
      case 'trend-ops':
        navigate('/intelligence-hub');
        break;
      case 'social-media':
        navigate('/real-time-monitoring');
        break;
      case 'alert-center':
        navigate('/alert-center');
        break;
      default:
        break;
    }
  };

  const handlePhraseClick = (phrase: string) => {
    navigate(`/intelligence-hub?search=${encodeURIComponent(phrase)}`);
  };

  const handleMetricBoxClick = (metric: string) => {
    switch (metric) {
      case 'alerts':
        navigate('/alert-center');
        break;
      case 'ad-spend':
        navigate('/campaign-control');
        break;
      case 'mentions':
        navigate('/real-time-monitoring');
        break;
      case 'sentiment':
        navigate('/intelligence-hub?filter=sentiment');
        break;
      case 'share':
        navigate('/intelligence-hub?filter=shareOfVoice');
        break;
      case 'risk':
        navigate('/alert-center');
        break;
      case 'influencers':
        navigate('/intelligence-hub?filter=influencers');
        break;
      default:
        break;
    }
  };

  const handleIntelligenceFeedClick = (type: string, topic?: string) => {
    switch (type) {
      case 'strength':
        navigate(
          '/intelligence-hub?category=strength&topic=' +
            encodeURIComponent(topic || 'social-media-engagement')
        );
        break;
      case 'opportunity':
        navigate(
          '/intelligence-hub?category=opportunity&topic=' +
            encodeURIComponent(topic || 'trending-hashtags')
        );
        break;
      case 'weakness':
        navigate(
          '/intelligence-hub?category=weakness&topic=' +
            encodeURIComponent(topic || 'engagement-issues')
        );
        break;
      case 'threat':
        navigate(
          '/intelligence-hub?category=threat&topic=' +
            encodeURIComponent(topic || 'sentiment-alerts')
        );
        break;
      default:
        navigate('/intelligence-hub');
        break;
    }
  };

  return (
    <PageLayout pageTitle="Command Center" placeholder="Ask about your campaign intelligence...">
      <div
        className="30-aug-dashboard war-room-dashboard font-barlow"
        style={{ marginTop: '-8px' }}
      >
        {/* Command Status Bar - Hidden on mobile */}
        <div className="hidden md:block px-4 mb-3">
          <CommandStatusBar />
        </div>
        {/* Top Header - 4 Compact Metric Cards */}
        <div className="grid grid-cols-4 gap-4 mb-3 px-4">
          {/* Sentiment Analysis Card */}
          <Card
            variant="glass"
            padding="sm"
            className="hoverable transition-all duration-300 cursor-pointer"
            onClick={() => handleMetricBoxClick('sentiment')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-condensed font-semibold text-white text-sm uppercase tracking-wider">SENTIMENT</h3>
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  dataMode === 'MOCK' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              ></div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mb-1 font-condensed" style={{fontWeight: 500}}>
              {sentimentData
                ? `+${Math.round((sentimentData.positive / sentimentData.total) * 100)}%`
                : '+33%'}
            </div>
            <div className="text-xs text-white/60">
              <span className="font-jetbrains">{sentimentData?.positive || 342}</span> positive • <span className="font-jetbrains">{sentimentData?.negative || 503}</span> negative
            </div>
          </Card>

          {/* Mention Volume Card */}
          <Card
            variant="glass"
            padding="sm"
            className="hoverable transition-all duration-300 cursor-pointer"
            onClick={() => handleMetricBoxClick('mentions')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-condensed font-semibold text-white text-sm uppercase tracking-wider">MENTION VOLUME</h3>
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  dataMode === 'MOCK' ? 'bg-amber-400' : 'bg-sky-400'
                }`}
              ></div>
            </div>
            <div className="text-2xl font-bold text-sky-400 mb-1 font-condensed" style={{fontWeight: 500}}>
              {sentimentData ? sentimentData.total.toLocaleString() : '1,039'}
            </div>
            <div className="text-xs text-white/60 font-jetbrains">24h volume • +12% vs yesterday</div>
          </Card>

          {/* Share of Voice Card */}
          <Card
            variant="glass"
            padding="sm"
            className="hoverable transition-all duration-300 cursor-pointer"
            onClick={() => handleMetricBoxClick('share')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-condensed font-semibold text-white text-sm uppercase tracking-wider">SHARE OF VOICE</h3>
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  dataMode === 'MOCK' ? 'bg-amber-400' : 'bg-violet-400'
                }`}
              ></div>
            </div>
            <div className="text-2xl font-bold text-violet-400 mb-1 font-condensed" style={{fontWeight: 500}}>
              {dashboard.shareOfVoice?.[0]?.percentage?.toFixed(1) || '76.9'}%
            </div>
            <div className="text-xs text-white/60 font-jetbrains">Leading competitor • Reach: 2.4M</div>
          </Card>

          {/* Crisis Risk Card */}
          <Card
            variant="glass"
            padding="sm"
            className="hoverable transition-all duration-300 cursor-pointer"
            onClick={() => handleMetricBoxClick('risk')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-condensed font-semibold text-white text-sm uppercase tracking-wider">CRISIS RISK</h3>
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  crisisAlerts?.hasActiveCrisis
                    ? 'bg-rose-400'
                    : dataMode === 'MOCK'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                }`}
              ></div>
            </div>
            <div
              className={`text-2xl font-bold mb-1 font-condensed ${
                crisisAlerts?.hasActiveCrisis ? 'text-rose-400' : 'text-emerald-400'
              }`}
              style={{fontWeight: 500}}
            >
              {crisisAlerts?.hasActiveCrisis ? 'HIGH' : 'LOW'}
            </div>
            <div className="text-xs text-white/60 font-jetbrains">
              {crisisAlerts?.alerts?.length || 1} active threats
            </div>
          </Card>
        </div>

        {/* Main Dashboard Grid - Remove wrapper, use full PageLayout width */}
        <div className="dashboard px-4">
          {/* Left Column */}
          <div className="left-column">
            {/* Political Map */}
            <Card variant="glass" padding="md" className="political-map hoverable">
              <MentionlyticsPoliticalMap />
            </Card>

            {/* Live Intelligence - Moved to top, made taller */}
            <WidgetErrorBoundary widgetName="Live Intelligence">
              <LiveIntelligence />
            </WidgetErrorBoundary>

            {/* SWOT Radar - Moved down - Keep Core Component Untouched */}
            <Card variant="glass" padding="md" className="fresh-swot-radar hoverable">
              <WidgetErrorBoundary widgetName="SWOT Radar Dashboard">
                <SWOTRadarDashboard />
              </WidgetErrorBoundary>
            </Card>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Dual Pie Charts - Compact Height */}
            <DualPieCharts />

            {/* Phrase Cloud - Under Crisis Risk & Share of Voice */}
            <WidgetErrorBoundary widgetName="Phrase Cloud">
              <PhraseCloud />
            </WidgetErrorBoundary>

            {/* Competitor Analysis */}
            <WidgetErrorBoundary widgetName="Competitor Analysis">
              <CompetitorAnalysis />
            </WidgetErrorBoundary>

            {/* Campaign Performance Summary */}
            <WidgetErrorBoundary widgetName="Campaign Summary">
              <Card 
                variant="glass" 
                padding="md" 
                className="campaign-summary-widget hoverable cursor-pointer" 
                onClick={() => navigate('/campaign-control')}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-white/60 uppercase font-semibold tracking-wider font-jetbrains">
                    CAMPAIGN PERFORMANCE
                  </h3>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        dataMode === 'MOCK' ? 'bg-amber-400' : 'bg-green-400'
                      }`}
                    ></div>
                    <div className="text-xs text-white/60 font-jetbrains uppercase tracking-wider">24H SUMMARY</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Meta Column */}
                  <div className="meta-summary">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-[#1877F2] rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">f</span>
                      </div>
                      <span className="text-sm font-barlow font-semibold text-white">Meta Ads</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-white/60 mb-1">Total Spend</div>
                        <div className="font-jetbrains font-bold text-white">
                          {campaignLoading ? '...' : `$${metaCampaigns.data?.totalSpend.toLocaleString() || '0'}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">Impressions</div>
                        <div className="font-jetbrains font-bold text-sky-400">
                          {campaignLoading ? '...' : (metaCampaigns.data?.totalImpressions.toLocaleString() || '0')}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">Conversions</div>
                        <div className="font-jetbrains font-bold text-emerald-400">
                          {campaignLoading ? '...' : (metaCampaigns.data?.totalConversions.toLocaleString() || '0')}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">Avg ROAS</div>
                        <div className="font-jetbrains font-bold text-violet-400">
                          {campaignLoading ? '...' : `${metaCampaigns.data?.averageRoas || '0'}x`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Google Column */}
                  <div className="google-summary">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                      <span className="text-sm font-barlow font-semibold text-white">Google Ads</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-white/60 mb-1">Total Cost</div>
                        <div className="font-jetbrains font-bold text-white">
                          {campaignLoading ? '...' : `$${googleCampaigns.data?.totalCost.toLocaleString() || '0'}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">Impressions</div>
                        <div className="font-jetbrains font-bold text-sky-400">
                          {campaignLoading ? '...' : (googleCampaigns.data?.totalImpressions.toLocaleString() || '0')}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">Conversions</div>
                        <div className="font-jetbrains font-bold text-emerald-400">
                          {campaignLoading ? '...' : (googleCampaigns.data?.totalConversions.toLocaleString() || '0')}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">Avg ROAS</div>
                        <div className="font-jetbrains font-bold text-violet-400">
                          {campaignLoading ? '...' : `${googleCampaigns.data?.averageRoas || '0'}x`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="text-xs text-white/60 uppercase tracking-wider font-jetbrains">CLICK TO VIEW FULL CAMPAIGN DETAILS</div>
                </div>
              </Card>
            </WidgetErrorBoundary>

            {/* Quick Actions Grid */}
            <Card variant="glass" padding="none" className="quick-actions hoverable">
              <div className="bg-white/10 px-3 py-2 border-b border-white/30">
                <div className="text-xs text-white/60 uppercase font-semibold tracking-wider font-jetbrains">
                  Quick Actions
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  height: 'calc(100% - 40px)',
                }}
              >
                <div
                  onClick={() => handleQuickActionClick('quick-campaign')}
                  className="bg-white/5 border-r border-b border-white/20 flex flex-col items-center justify-center text-[10px] text-white/90 cursor-pointer hover:bg-white/15 hover:border-orange-500/50 transition-all duration-200 gap-1.5 py-3 uppercase font-semibold font-barlow tracking-wider"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Quick Campaign
                </div>
                <div
                  onClick={() => handleQuickActionClick('live-monitor')}
                  className="bg-white/5 border-r border-b border-white/20 flex flex-col items-center justify-center text-[10px] text-white/90 cursor-pointer hover:bg-white/15 hover:border-orange-500/50 transition-all duration-200 gap-1.5 py-3 uppercase font-semibold font-barlow tracking-wider"
                >
                  <Radio className="w-4 h-4 text-green-400" />
                  Live Monitor
                </div>
                <div
                  onClick={handleOpenSetup}
                  className="bg-black/10 border-b border-white/20 flex flex-col items-center justify-center text-[10px] text-white/90 cursor-pointer hover:bg-white/10 hover:border-orange-500/50 transition-all duration-200 gap-1.5 py-3 uppercase font-semibold font-barlow tracking-wider"
                >
                  <Settings className="w-4 h-4 text-blue-400" />
                  Campaign Setup
                </div>
                <div
                  onClick={() => handleQuickActionClick('trend-ops')}
                  className="bg-black/10 border-r border-white/20 flex flex-col items-center justify-center text-[10px] text-white/90 cursor-pointer hover:bg-white/10 hover:border-orange-500/50 transition-all duration-200 gap-1.5 py-3 uppercase font-semibold font-barlow tracking-wider"
                >
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Trend Ops
                </div>
                <div
                  onClick={() => handleQuickActionClick('social-media')}
                  className="bg-black/10 border-r border-white/20 flex flex-col items-center justify-center text-[10px] text-white/90 cursor-pointer hover:bg-white/10 hover:border-orange-500/50 transition-all duration-200 gap-1.5 py-3 uppercase font-semibold font-barlow tracking-wider"
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Social Media
                </div>
                <div
                  onClick={() => handleQuickActionClick('alert-center')}
                  className="bg-white/5 flex flex-col items-center justify-center text-[10px] text-white/90 cursor-pointer hover:bg-white/15 hover:border-orange-500/50 transition-all duration-200 gap-1.5 py-3 uppercase font-semibold font-barlow tracking-wider"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Alert Center
                </div>
              </div>
            </Card>

          </div>
        </div>

        {/* Campaign Setup Modal */}
        <CampaignSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onComplete={handleSetupComplete}
        />
      </div>
    </PageLayout>
  );
}
