import type React from 'react';
import { generateMonthData } from './utils';

interface MonthViewProps {
  currentMonth?: string;
  totalPosts?: number;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentMonth = 'December 2024',
  totalPosts = 96,
}) => {
  const monthData = generateMonthData();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month View Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-condensed text-white">{currentMonth}</h3>
        <div className="text-white/70 text-sm">
          <span className="font-medium text-white">{totalPosts}</span> posts this month
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {/* Weekday Headers */}
        {weekDays.map((day) => (
          <div key={day} className="text-center text-white/70 text-sm font-medium py-2">
            {day}
          </div>
        ))}

        {/* Date Cells */}
        {monthData.map((date, index) => (
          <div
            key={index}
            className={`aspect-square rounded-lg border ${
              date === 0
                ? 'bg-transparent border-transparent'
                : date === new Date().getDate()
                  ? 'bg-orange-500/20 border-orange-400/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
            } transition-colors p-2`}
          >
            {date > 0 && (
              <>
                <div className="text-white text-sm font-medium mb-1">{date}</div>
                <div className="space-y-1">
                  {/* Sample content indicators */}
                  {[3, 7, 12, 15, 18, 22, 25].includes(date) && (
                    <>
                      <div className="h-1 bg-purple-500 rounded-full" />
                      <div className="h-1 bg-blue-500 rounded-full" />
                    </>
                  )}
                  {[5, 10, 14, 20, 24, 28].includes(date) && (
                    <div className="h-1 bg-green-500 rounded-full" />
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
