import type React from 'react';
import { Calendar, Clock } from 'lucide-react';
import Card from '../shared/Card';
import { useGHLSchedules } from '../../services/ghlService';

interface ScheduleItem {
  id: string;
  content: string;
  status: 'published' | 'scheduled' | 'failed';
  platform: string;
  scheduledDate: string;
}

const ScheduledPosts: React.FC = () => {
  const { data } = useGHLSchedules();

  if (!data || !data.schedules || data.schedules.length === 0) {
    return null;
  }

  const { schedules } = data;

  return (
    <div className="fade-in">
      <Card padding="md" variant="glass">
        <h3 className="text-lg font-semibold text-white/95 mb-4">Scheduled Posts</h3>
        <div className="space-y-3">
          {schedules.slice(0, 5).map((schedule: ScheduleItem, index: number) => (
            <div
              key={schedule.id || index}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 font-medium">{schedule.platform}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    schedule.status === 'scheduled'
                      ? 'bg-blue-500/20 text-blue-400'
                      : schedule.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {schedule.status}
                </span>
              </div>
              <p className="text-white/70 text-sm mb-2 line-clamp-2">{schedule.content}</p>
              <div className="flex items-center space-x-4 text-xs text-white/60">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(schedule.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(schedule.scheduledDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ScheduledPosts;
