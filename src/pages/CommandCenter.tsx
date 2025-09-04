import type React from 'react';
// Animation imports removed to prevent flashing
import { Brain, TrendingUp, MessageSquare, Target, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuickActions from './QuickActions';
import Card from '../components/shared/Card';
import PageLayout from '../components/shared/PageLayout';
// PageHeader removed - no longer using headers on pages
import { createLogger } from '../utils/logger';
import { getSectionTheme } from '../utils/sectionTheming';

const logger = createLogger('CommandCenter');

interface DashboardCardProps {
  title: string;
  number: string | number;
  subtitle: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  delay?: number;
  onClick?: () => void;
  navigateTo?: string;
}

interface ContentCluster {
  title: string;
  status: string;
  timeline: string;
  statusColor: string;
}

interface ContentTemplate {
  name: string;
  type: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  number,
  subtitle,
  icon: Icon,
  delay = 0,
  onClick,
  navigateTo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const sectionTheme = getSectionTheme(location.pathname);

  const handleClick = () => {
    logger.debug(`Dashboard card clicked: ${title}`);
    if (onClick) {
      onClick();
    } else if (navigateTo) {
      logger.debug(`Navigating to: ${navigateTo}`);
      navigate(navigateTo);
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={`group cursor-pointer hoverable hover:bg-white/15 hover:scale-[1.02] transition-all duration-200`}
      padding="md"
      variant="glass"
    >
      <div className="flex items-start justify-between mb-3 lg:mb-4">
        <div
          className={`p-3 lg:p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 hoverable transition-all duration-300`}
        >
          <Icon
            className={`w-6 h-6 lg:w-8 lg:h-8 text-white/95 transition-colors duration-300`}
            style={
              {
                '--icon-hover-color': 'var(--page-accent)',
              } as React.CSSProperties
            }
          />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`text-xs font-medium`} style={{ color: 'var(--page-accent)' }}>
            Click to explore →
          </div>
        </div>
      </div>

      <div className="space-y-1 lg:space-y-2">
        <div
          className="text-2xl lg:text-3xl text-white/95"
          style={{ font: "400 31px/37px 'Barlow Condensed', sans-serif" }}
        >
          {number}
        </div>
        <h3 className="section-header mb-1 mt-2">{title}</h3>
        <p className="content-subtitle">{subtitle}</p>
      </div>
    </Card>
  );
};

const IntelligenceDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    logger.debug('Intelligence Dashboard clicked - navigating to /intelligence-hub');
    navigate('/intelligence-hub');
  };

  const handleMetricClick = (metricLabel: string) => {
    logger.debug(`Metric clicked: ${metricLabel} - navigating to /intelligence-hub`);
    navigate('/intelligence-hub');
  };

  const metrics = [
    {
      label: 'Alert Response Time',
      value: '2.3s',
      trend: '↓15%',
    },
    {
      label: 'Campaign ROI',
      value: '287%',
      trend: '↑42%',
    },
    {
      label: 'Threat Level Score',
      value: '23/100',
      trend: 'Low',
    },
    {
      label: 'Voter Engagement Rate',
      value: '68.4%',
      trend: '↑12%',
    },
  ];

  return (
    <Card
      onClick={handleDashboardClick}
      className="group cursor-pointer hoverable hover:bg-white/15 hover:scale-[1.02] transition-all duration-200"
      padding="md"
      variant="glass"
    >
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 lg:p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 hoverable transition-all duration-300">
            <Target className="w-6 h-6 lg:w-8 lg:h-8 text-white/95" />
          </div>
          <h3 className="section-header-large ml-3">Intelligence Dashboard</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleMetricClick(metric.label);
            }}
            className="bg-black/20 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-white/20 hoverable hover:bg-white/0 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <div
              className="text-xl lg:text-2xl text-white/95 mb-1"
              style={{ font: "400 25px/33px 'Barlow Condensed', sans-serif" }}
            >
              {metric.value}
            </div>
            <div className="text-xs lg:text-sm text-white/75 mb-2">{metric.label}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--page-accent)' }}>
              {metric.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 lg:mt-8 pt-6 border-t border-white/30">
        <div className="flex items-center justify-between text-sm">
          <span className="footer-text text-white/75">Last updated</span>
          <span className="footer-text text-white/90">30 seconds ago</span>
        </div>
      </div>
    </Card>
  );
};

const CampaignOperationsHub: React.FC = () => {
  const navigate = useNavigate();

  const handleProjectClick = (projectTitle: string) => {
    logger.debug(`Project clicked: ${projectTitle} - navigating to /campaign-control`);
    navigate('/campaign-control');
  };

  const handleTemplateClick = (templateName: string) => {
    logger.debug(`Template clicked: ${templateName} - navigating to /campaign-control`);
    navigate('/campaign-control');
  };

  const activeProjects: ContentCluster[] = [
    {
      title: 'Crisis Response Protocol',
      status: 'Live',
      timeline: 'Active',
      statusColor: 'status-live',
    },
    {
      title: 'Ad Campaign Optimization',
      status: 'Running',
      timeline: 'Today',
      statusColor: 'status-running',
    },
    {
      title: 'Voter Outreach Strategy',
      status: 'Planning',
      timeline: 'Next Week',
      statusColor: 'status-planning',
    },
  ];

  const contentTemplates: ContentTemplate[] = [
    {
      name: 'Alert Response',
      type: 'Crisis Management',
    },
    {
      name: 'Campaign Message',
      type: 'Political Ads',
    },
    {
      name: 'Field Report',
      type: 'Intelligence',
    },
    {
      name: 'Voter Engagement',
      type: 'Outreach',
    },
  ];

  return (
    <Card
      className="group hoverable hover:bg-white/15 hover:scale-[1.02] transition-all duration-200"
      padding="md"
      variant="glass"
    >
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 lg:p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 hoverable transition-all duration-300">
            <Target className="w-6 h-6 lg:w-8 lg:h-8 text-white/95" />
          </div>
          <h3 className="section-header-large ml-3">Campaign Operations</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Projects */}
        <div className="space-y-4">
          <h4 className="text-lg lg:text-xl font-medium text-white/40 mb-3 uppercase font-condensed ml-2">
            ACTIVE PROJECTS
          </h4>
          <div className="space-y-4">
            {activeProjects.map((cluster, index) => (
              <div
                key={index}
                onClick={() => handleProjectClick(cluster.title)}
                className="bg-black/20 backdrop-blur-sm rounded-xl p-6 lg:p-7 border border-white/20 hoverable hover:bg-white/0 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="content-title text-white/90">{cluster.title}</h5>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      cluster.status === 'Live'
                        ? 'bg-[var(--accent-live-monitoring)]'
                        : cluster.status === 'Running'
                          ? 'bg-[var(--accent-war-room)]'
                          : cluster.status === 'Planning'
                            ? 'bg-[var(--accent-intelligence)]'
                            : 'bg-white/30'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`status-indicator ${
                      cluster.status === 'Live'
                        ? 'status-active'
                        : cluster.status === 'Running'
                          ? 'status-running'
                          : cluster.status === 'Planning'
                            ? 'status-planning'
                            : ''
                    }`}
                  >
                    {cluster.status}
                  </span>
                  <span className="status-indicator">{cluster.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Templates */}
        <div
          className="space-y-2 lg:space-y-3"
          style={{
            paddingBottom: '11px',
            marginBottom: '-1px',
          }}
        >
          <h4 className="text-lg lg:text-xl font-medium text-white/40 mb-3 uppercase font-condensed ml-2">
            &nbsp;CONTENT TEMPLATES
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {contentTemplates.map((template, index) => (
              <div
                key={index}
                onClick={() => handleTemplateClick(template.name)}
                className="bg-black/20 backdrop-blur-sm rounded-xl p-5 lg:p-6 border border-white/20 hoverable hover:bg-white/0 hover:scale-[1.02] transition-all duration-200 text-center cursor-pointer"
              >
                <h5 className="content-title mb-1">{template.name}</h5>
                <p className="text-xs text-white/65">{template.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const CommandCenter: React.FC = () => {
  logger.info('CommandCenter: Component mounting...');
  logger.debug('CommandCenter: Should show purple gradient background');
  logger.debug(
    'CommandCenter: Three main cards + Campaign Operations Hub + Intelligence Dashboard + Quick Actions'
  );

  return (
    <div className="page-dashboard" data-route="command-center">
      <PageLayout pageTitle="Dashboard" placeholder="Ask War Room about your campaign status...">
        {/* Top Row - 4 KPI Tiles */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <DashboardCard
              title="Real-Time Alerts"
              number={7}
              subtitle="Active crisis detections"
              icon={Bell}
              delay={0.1}
              navigateTo="/alert-center"
            />
            <DashboardCard
              title="Ad Spend Today"
              number="$47.2K"
              subtitle="Meta + Google Ads (+12% vs yesterday)"
              icon={TrendingUp}
              delay={0.2}
              navigateTo="/campaign-control"
            />
            <DashboardCard
              title="Mention Volume"
              number="2,847"
              subtitle="Mentions across platforms"
              icon={MessageSquare}
              delay={0.3}
              navigateTo="/real-time-monitoring"
            />
            <DashboardCard
              title="Sentiment Score"
              number="74%"
              subtitle="Positive sentiment"
              icon={Brain}
              delay={0.4}
              navigateTo="/intelligence-hub"
            />
          </div>

          {/* Middle Row - 2 Wider Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <CampaignOperationsHub />
            <QuickActions />
          </div>

          {/* Bottom Row - Intelligence Dashboard */}
          <div className="mb-4">
            <IntelligenceDashboard />
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default CommandCenter;
