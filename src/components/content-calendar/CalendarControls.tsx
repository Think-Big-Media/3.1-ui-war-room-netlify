import type React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Card from '../shared/Card';
import { type CalendarView } from '../../types/calendar';
import { formatWeekRange } from './utils';

interface CalendarControlsProps {
  currentView: CalendarView;
  currentWeek: number;
  onViewChange: (view: CalendarView) => void;
  onWeekChange: (week: number) => void;
  onNavigateToEngine: () => void;
}

const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentView,
  currentWeek,
  onViewChange,
  onWeekChange,
  onNavigateToEngine,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-6"
    >
      <Card padding="sm" variant="glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Selector */}
            <div className="bg-white/10 rounded-lg p-1 flex">
              {(['day', 'week', 'month'] as CalendarView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`px-3 py-1.5 rounded-md uppercase font-mono text-sm transition-all duration-200 ${
                    currentView === view
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onWeekChange(currentWeek - 1)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white/80 font-medium min-w-[180px] text-center">
                {currentView === 'day' && 'Today'}
                {currentView === 'week' && formatWeekRange(currentWeek)}
                {currentView === 'month' && 'December 2024'}
              </span>
              <button
                onClick={() => onWeekChange(currentWeek + 1)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToEngine}
              className="btn-secondary-action px-3 py-1.5 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Create Content</span>
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default CalendarControls;
