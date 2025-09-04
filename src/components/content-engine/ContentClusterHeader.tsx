import type React from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Target, Zap } from 'lucide-react';
import Card from '../shared/Card';
import { formatWeekDisplay } from './utils';

interface ContentClusterHeaderProps {
  selectedCluster: string;
  currentWeek: number;
  onWeekChange: (week: number) => void;
  onNavigateToCalendar: () => void;
}

const ContentClusterHeader: React.FC<ContentClusterHeaderProps> = ({
  selectedCluster,
  currentWeek,
  onWeekChange,
  onNavigateToCalendar,
}) => {
  return (
    <div className="mb-8 fade-in">
      <Card padding="md" variant="glass">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3" />
            <h2 className="text-xl font-bold text-white">Content Cluster: {selectedCluster}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onWeekChange(currentWeek - 1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/80 font-medium">
              Week of {formatWeekDisplay(currentWeek)}
            </span>
            <button
              onClick={() => onWeekChange(currentWeek + 1)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateToCalendar}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>View Calendar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white/80 text-sm">Viral Score</span>
            </div>
            <div className="text-2xl font-bold text-white">92/100</div>
            <div className="text-xs text-green-400">+15% from last week</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-white/80 text-sm">Authority Score</span>
            </div>
            <div className="text-2xl font-bold text-white">88/100</div>
            <div className="text-xs text-white/60">High alignment</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white/80 text-sm">Customer Match</span>
            </div>
            <div className="text-2xl font-bold text-white">94%</div>
            <div className="text-xs text-white/60">Perfect fit</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-white/80 text-sm">Ready to Publish</span>
            </div>
            <div className="text-2xl font-bold text-white">7</div>
            <div className="text-xs text-white/60">Content pieces</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContentClusterHeader;
