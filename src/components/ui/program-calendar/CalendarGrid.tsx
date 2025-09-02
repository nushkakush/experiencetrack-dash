import React from 'react';
import { format } from 'date-fns';
import type { CalendarDay } from '../../../domains/calendar/types';

interface CalendarGridProps {
  days: (CalendarDay | null)[];
  weekDayLabels: string[];
  onDateSelect: (date: Date) => void;
  children?: React.ReactNode;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  weekDayLabels,
  onDateSelect,
  children,
}) => {
  return (
    <div className='space-y-4'>
      {/* Week Days Header */}
      <div className='grid grid-cols-7 gap-2'>
        {weekDayLabels.map(day => (
          <div
            key={day}
            className='text-center text-sm font-medium text-muted-foreground py-2'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className='grid grid-cols-7 gap-2'>
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className='h-32' />;
          }

          return (
            <div
              key={day.date.toISOString()}
              className='relative p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 min-h-32'
              onClick={() => onDateSelect(day.date)}
            >
              {/* Date Header */}
              <div className='flex items-center justify-between mb-2'>
                <div
                  className={
                    day.isSelected ? 'text-primary' : 'text-foreground'
                  }
                >
                  {format(day.date, 'd')}
                </div>
              </div>

              {/* Content Area */}
              <div className='space-y-3 mt-3'>{children}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
