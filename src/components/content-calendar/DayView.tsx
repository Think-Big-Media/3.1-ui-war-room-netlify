import type React from 'react';
import ContentCardComponent from './ContentCardComponent';
import { type DayColumn, type TimeSlot } from '../../types/calendar';

interface DayViewProps {
  weekData: DayColumn[];
  timeSlots: TimeSlot[];
  onEditContent?: (content: any) => void;
}

const DayView: React.FC<DayViewProps> = ({ weekData, timeSlots, onEditContent }) => {
  const todayData = weekData.find((day) => day.isToday);

  return (
    <div className="space-y-4">
      {/* Day View Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-condensed text-white">
          Today -{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
        <div className="text-white/70 text-sm">
          <span className="font-medium text-white">{todayData?.content.length || 0}</span> posts
          scheduled
        </div>
      </div>

      {/* Hourly Schedule */}
      <div className="grid grid-cols-1 gap-4">
        {timeSlots.map((slot) => {
          const todayContent = todayData?.content.find(
            (c) => parseInt(c.time.split(':')[0]) === slot.hour
          );

          return (
            <div
              key={slot.hour}
              className="flex items-center bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors p-4"
            >
              <div className="w-20 text-white/60 text-sm font-medium">{slot.label}</div>

              <div className="flex-1 ml-6">
                {todayContent ? (
                  <ContentCardComponent content={todayContent} isDetailed onEdit={onEditContent} />
                ) : (
                  <div className="text-white/40 text-sm italic">No content scheduled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
