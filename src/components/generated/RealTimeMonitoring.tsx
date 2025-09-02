'use client';

import type React from 'react';
import { useState } from 'react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import MonitoringControls from '../monitoring/MonitoringControls';
import MentionsStream from '../monitoring/MentionsStream';
import TrendingTopics from '../monitoring/TrendingTopics';
import SentimentBreakdown from '../monitoring/SentimentBreakdown';
import PlatformPerformance from '../monitoring/PlatformPerformance';
import InfluencerTracker from '../monitoring/InfluencerTracker';
import MonitoringAlert from '../monitoring/MonitoringAlert';
import { type MonitoringFilters } from '../../types/monitoring';
import {
  mockMentions,
  mockTrendingTopics,
  mockInfluencers,
  mockSentimentData,
  mockPlatformPerformance,
} from '../../data/monitoringData';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RealTimeMonitoring');

const RealTimeMonitoring: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [filters, setFilters] = useState<MonitoringFilters>({
    source: 'all',
    sentiment: 'all',
    region: 'all',
  });

  // Event handlers
  const handleToggleLive = () => {
    setIsLive(!isLive);
    logger.info('Monitoring live status:', !isLive);
  };

  const handleAlertAction = () => {
    logger.info('Alert action triggered');
    // Handle alert response action
  };

  // Filter functions
  const filteredMentions = mockMentions.filter((mention) => {
    const matchesSource = filters.source === 'all' || mention.platform === filters.source;
    const matchesSentiment = filters.sentiment === 'all' || mention.sentiment === filters.sentiment;
    const matchesRegion = filters.region === 'all' || mention.region === filters.region;
    return matchesSource && matchesSentiment && matchesRegion;
  });

  return (
    <PageLayout pageTitle="Live Monitoring" placeholder="Ask War Room about monitoring data...">
      {/* Purple gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 -z-10" />

      <PageHeader
        title="Live Monitoring"
        subtitle="Live social media and news monitoring with instant campaign intelligence"
      />

      {/* Live Status & Controls */}
      <MonitoringControls isLive={isLive} onToggleLive={handleToggleLive} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Live Feed */}
        <div className="lg:col-span-2 space-y-6">
          <MentionsStream
            mentions={filteredMentions}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <TrendingTopics topics={mockTrendingTopics} />
        </div>

        {/* Right Column - Visual Dashboards */}
        <div className="space-y-6">
          <SentimentBreakdown sentimentData={mockSentimentData} />
          <PlatformPerformance platformData={mockPlatformPerformance} />
          <InfluencerTracker influencers={mockInfluencers} />
        </div>
      </div>

      {/* Dynamic Alert Banner */}
      <MonitoringAlert onAction={handleAlertAction} />
    </PageLayout>
  );
};

export default RealTimeMonitoring;
