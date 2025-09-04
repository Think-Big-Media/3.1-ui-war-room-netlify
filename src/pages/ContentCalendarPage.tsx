'use client';

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import CalendarControls from '../components/content-calendar/CalendarControls';
import CalendarStats from '../components/content-calendar/CalendarStats';
import WeekView from '../components/content-calendar/WeekView';
import DayView from '../components/content-calendar/DayView';
import MonthView from '../components/content-calendar/MonthView';
import { type CalendarView } from '../types/calendar';
import { timeSlots, sampleContent } from '../data/calendarData';
import { generateWeekData } from '../components/content-calendar/utils';
import { createLogger } from '../utils/logger';

const logger = createLogger('ContentCalendarPage');

const ContentCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [currentWeek, setCurrentWeek] = useState(0);

  const weekData = generateWeekData(currentWeek, sampleContent);

  const handleNavigateToEngine = () => {
    navigate('/content-engine');
  };

  const handleEditContent = (content: any) => {
    logger.info('Edit content:', content);
    // Handle content editing
  };

  // Calculate stats
  const stats = {
    totalPosts: 12,
    scheduled: 7,
    published: 5,
    engagement: 89,
  };

  return (
    <PageLayout pageTitle="Content Calendar" placeholder="Ask about scheduled content...">
      {/* Calendar Controls */}
      <CalendarControls
        currentView={currentView}
        currentWeek={currentWeek}
        onViewChange={setCurrentView}
        onWeekChange={setCurrentWeek}
        onNavigateToEngine={handleNavigateToEngine}
      />

      {/* Calendar Stats */}
      <CalendarStats
        totalPosts={stats.totalPosts}
        scheduled={stats.scheduled}
        published={stats.published}
        engagement={stats.engagement}
      />

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <Card padding="md" variant="glass">
          {currentView === 'week' && <WeekView weekData={weekData} timeSlots={timeSlots} />}
          {currentView === 'day' && (
            <DayView weekData={weekData} timeSlots={timeSlots} onEditContent={handleEditContent} />
          )}
          {currentView === 'month' && <MonthView />}
        </Card>
      </motion.div>
    </PageLayout>
  );
};

export default ContentCalendarPage;
