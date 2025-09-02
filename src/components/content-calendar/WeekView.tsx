import type React from 'react';
import ContentCardComponent from './ContentCardComponent';
import { type DayColumn, type TimeSlot } from '../../types/calendar';

interface WeekViewProps {
  weekData: DayColumn[];
  timeSlots: TimeSlot[];
}

const WeekView: React.FC<WeekViewProps> = ({ weekData, timeSlots }) => {
  return (
    <div className="grid grid-cols-8 gap-4">
      {/* Time Column */}
      <div className="space-y-4">
        <div className="h-12 flex items-center justify-center">
          <span className="text-white/70 text-sm font-medium">Time</span>
        </div>
        {timeSlots.map((slot) => (
          <div key={slot.hour} className="h-16 flex items-center justify-center">
            <span className="text-white/60 text-xs">{slot.label}</span>
          </div>
        ))}
      </div>

      {/* Day Columns */}
      {weekData.map((day) => (
        <div key={day.date} className="space-y-4">
          {/* Day Header */}
          <div
            className={`h-12 flex flex-col items-center justify-center rounded-lg ${
              day.isToday ? 'bg-orange-500/20 border border-orange-400/40' : 'bg-white/5'
            }`}
          >
            <span className="text-white text-sm font-medium">{day.dayName}</span>
            <span className={`text-xs ${day.isToday ? 'text-orange-200' : 'text-white/60'}`}>
              {day.dayNumber}
            </span>
          </div>

          {/* Time Slots */}
          {timeSlots.map((slot) => {
            const contentForSlot = day.content.find(
              (c) => parseInt(c.time.split(':')[0]) === slot.hour
            );
            return (
              <div
                key={`${day.date}-${slot.hour}`}
                className="h-16 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors relative"
              >
                {contentForSlot && <ContentCardComponent content={contentForSlot} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeekView;
