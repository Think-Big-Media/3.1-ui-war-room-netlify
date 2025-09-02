'use client';

import type React from 'react';
import { useState } from 'react';
import PageLayout from '../components/shared/PageLayout';
import PageHeader from '../components/shared/PageHeader';
import CampaignTabs from '../components/campaign-control/CampaignTabs';
import ProjectControls from '../components/campaign-control/ProjectControls';
import KanbanBoard from '../components/campaign-control/KanbanBoard';
import AssetControls from '../components/campaign-control/AssetControls';
import AssetGrid from '../components/campaign-control/AssetGrid';
import ActivityFeed from '../components/campaign-control/ActivityFeed';
import PlatformAnalytics from '../components/campaign-control/PlatformAnalytics';
import {
  type CampaignTab,
  type Project,
  type ProjectFilters,
  type AssetFilters,
} from '../types/campaign';
import { mockProjects, mockAssets, mockActivities } from '../data/campaignData';
import { createLogger } from '../utils/logger';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const logger = createLogger('CampaignControl');

const CampaignControl: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<CampaignTab>('analytics'); // Default to Ad Campaigns
  const [analyticsPlatform, setAnalyticsPlatform] = useState<'meta' | 'google' | 'both'>('both');

  // Check if we're coming from Settings with a specific platform
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const platform = params.get('platform');
    const tab = params.get('tab');

    if (tab === 'analytics') {
      setActiveTab('analytics' as CampaignTab);
    }

    if (platform === 'meta' || platform === 'google') {
      setAnalyticsPlatform(platform);
      setActiveTab('analytics' as CampaignTab);
    }
  }, [location]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
  });
  const [assetFilters, setAssetFilters] = useState<AssetFilters>({
    search: '',
    category: 'all',
  });

  // Event handlers
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    logger.info('Selected project:', project.title);
  };

  const handleNewProject = () => {
    logger.info('Create new project');
    // Handle new project creation
  };

  const handleUploadAsset = () => {
    logger.info('Upload new asset');
    // Handle asset upload
  };

  // Filter functions
  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(projectFilters.search.toLowerCase()) ||
      project.description.toLowerCase().includes(projectFilters.search.toLowerCase());
    const matchesStatus =
      projectFilters.status === 'all' || project.status === projectFilters.status;
    return matchesSearch && matchesStatus;
  });

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(assetFilters.search.toLowerCase()) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(assetFilters.search.toLowerCase()));
    const matchesCategory =
      assetFilters.category === 'all' || asset.category === assetFilters.category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-warroom" data-route="war-room">
      <PageLayout pageTitle="War Room" placeholder="Ask War Room about campaign operations...">
        <div />

        {/* Tab Navigation */}
        <CampaignTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Strategic Projects Board */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <ProjectControls
              filters={projectFilters}
              onFiltersChange={setProjectFilters}
              onNewProject={handleNewProject}
            />
            <KanbanBoard projects={filteredProjects} onProjectSelect={handleProjectSelect} />
          </div>
        )}

        {/* Asset Library */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <AssetControls
              filters={assetFilters}
              onFiltersChange={setAssetFilters}
              onUploadAsset={handleUploadAsset}
            />
            <AssetGrid assets={filteredAssets} />
          </div>
        )}

        {/* Team Activity */}
        {activeTab === 'activity' && <ActivityFeed activities={mockActivities} />}

        {/* Analytics & AI Insights Tab */}
        {activeTab === 'analytics' && <PlatformAnalytics platform={analyticsPlatform} />}
      </PageLayout>
    </div>
  );
};

export default CampaignControl;
