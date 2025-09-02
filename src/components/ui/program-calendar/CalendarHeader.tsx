import React from 'react';
import { Button } from '../button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMonthChange?: (date: Date) => void;
  children?: React.ReactNode;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onMonthChange,
  children,
}) => {
  const formatMonth = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className='flex items-center justify-between'>
      <div>{children}</div>

      <div className='flex items-center gap-4'>
        {/* Navigation */}
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={onPreviousMonth}>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <div className='text-lg font-semibold'>
            {formatMonth(currentMonth)}
          </div>
          <Button variant='outline' size='sm' onClick={onNextMonth}>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};
