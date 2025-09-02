'use client';

import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/shared/PageLayout';
import ContentClusterHeader from '../components/content-engine/ContentClusterHeader';
import ContentFormatGrid from '../components/content-engine/ContentFormatGrid';
import GHLPublisher from '../components/content-engine/GHLPublisher';
import ScheduledPosts from '../components/content-engine/ScheduledPosts';
import { contentFormats } from '../data/contentFormats';
import { type ContentEnginePageProps } from '../types/content';
import { createLogger } from '../utils/logger';

const logger = createLogger('ContentEnginePage');

const ContentEnginePage: React.FC<ContentEnginePageProps> = ({
  selectedCluster = 'AI Productivity Hacks',
  weekOffset = 0,
  onFormatToggle,
  onPublishContent,
}) => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(weekOffset);
  const [formats, setFormats] = useState(contentFormats);

  const handleFormatToggle = (formatId: string, enabled: boolean) => {
    setFormats((prev) =>
      prev.map((format) => (format.id === formatId ? { ...format, enabled } : format))
    );
    onFormatToggle?.(formatId, enabled);
  };

  const handlePublishContent = (contentId: string, platform: string) => {
    logger.info(`Publishing content ${contentId} to ${platform}`);
    onPublishContent?.(contentId, platform);
  };

  const handleNavigateToCalendar = () => {
    navigate('/content-calendar');
  };

  return (
    <PageLayout
      pageTitle="Content Engine"
      placeholder="Ask Content Engine to transform viral opportunities..."
    >
      {/* Slate gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 -z-10" />

      {/* Content Cluster Overview */}
      <ContentClusterHeader
        selectedCluster={selectedCluster}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
        onNavigateToCalendar={handleNavigateToCalendar}
      />

      {/* Content Format Grid */}
      <ContentFormatGrid
        formats={formats}
        onFormatToggle={handleFormatToggle}
        onPublishContent={handlePublishContent}
      />

      {/* GHL Publisher and Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <GHLPublisher onPublishSuccess={() => logger.info('Content published successfully')} />
        <ScheduledPosts />
      </div>
    </PageLayout>
  );
};

export default ContentEnginePage;
