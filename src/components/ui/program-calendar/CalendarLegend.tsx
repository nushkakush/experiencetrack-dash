import React from 'react';
import type { CalendarLegendItem } from '../../../domains/calendar/types';

interface CalendarLegendProps {
  items: CalendarLegendItem[];
  title?: string;
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({
  items,
  title = 'Session Types:',
}) => {
  return (
    <div className='flex items-center gap-4'>
      <span className='text-sm font-medium text-muted-foreground'>{title}</span>
      <div className='flex items-center gap-3'>
        {items.map((item, index) => (
          <div key={index} className='flex items-center gap-1.5'>
            <div
              className='w-3 h-3 rounded-sm'
              style={{ background: item.color }}
            ></div>
            <span className='text-xs text-muted-foreground'>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
