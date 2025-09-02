'use client';

import type React from 'react';
import { useState } from 'react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import CampaignTabs from '../campaign-control/CampaignTabs';
import ProjectControls from '../campaign-control/ProjectControls';
import KanbanBoard from '../campaign-control/KanbanBoard';
import AssetControls from '../campaign-control/AssetControls';
import AssetGrid from '../campaign-control/AssetGrid';
import ActivityFeed from '../campaign-control/ActivityFeed';
import {
  type CampaignTab,
  type Project,
  type ProjectFilters,
  type AssetFilters,
} from '../../types/campaign';
import { mockProjects, mockAssets, mockActivities } from '../../data/campaignData';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CampaignControl');

const CampaignControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CampaignTab>('projects');
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
    <PageLayout pageTitle="War Room" placeholder="Ask War Room about campaign operations...">
      {/* Purple gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 -z-10" />

      <PageHeader
        title="War Room"
        subtitle="Strategic project management, asset organization, and team coordination"
      />

      {/* Tab Navigation */}
      <CampaignTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Strategic Projects Board */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
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
        <div className="space-y-6">
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
    </PageLayout>
  );
};

export default CampaignControl;
