import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Settings,
  Upload,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { isAfter } from 'date-fns';
import BulkAttendanceUploadDialog from '@/components/common/bulk-upload/BulkAttendanceUploadDialog';
import { BulkAttendanceConfig } from '@/components/common/bulk-upload/types/attendance';

interface SessionManagementHeaderProps {
  currentView: 'manage' | 'leaderboard';
  selectedDate: Date;
  isSessionCancelled: boolean;
  isFutureDate: boolean;
  processing: boolean;
  currentEpicName?: string;
  cohortId?: string;
  epicId?: string;
  sessionsPerDay?: number;
  onDateChange: (date: Date) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onCancelSession: () => void;
  onReactivateSession: () => void;
  onViewChange: (view: 'manage' | 'leaderboard') => void;
  onAttendanceImported?: () => void;
}

export const SessionManagementHeader: React.FC<
  SessionManagementHeaderProps
> = ({
  currentView,
  selectedDate,
  isSessionCancelled,
  isFutureDate,
  processing,
  currentEpicName,
  cohortId,
  epicId,
  sessionsPerDay,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onCancelSession,
  onReactivateSession,
  onViewChange,
  onAttendanceImported,
}) => {
  return (
    <div className='flex items-center justify-between'>
      <div>
        <h2 className='text-2xl font-semibold'>
          {currentView === 'manage'
            ? 'Session Management'
            : 'Attendance Leaderboard'}
        </h2>
        <p className='text-muted-foreground'>
          {currentEpicName} -{' '}
          {currentView === 'manage'
            ? format(selectedDate, 'MMM d, yyyy')
            : 'Epic Performance'}
        </p>
      </div>
      <div className='flex items-center gap-4'>
        {/* Date Navigation - Only show in manage view */}
        {currentView === 'manage' && (
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={onPreviousDay}>
              <ChevronLeft className='h-4 w-4' />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-[200px] justify-start text-left font-normal'
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {format(selectedDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={date => date && onDateChange(date)}
                  disabled={date => isAfter(date, new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant='outline'
              size='sm'
              onClick={onNextDay}
              disabled={isAfter(selectedDate, new Date())}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        )}

        {/* Session Control Button - Only show in manage view */}
        {currentView === 'manage' && (
          <>
            <Button
              variant={isSessionCancelled ? 'default' : 'destructive'}
              size='sm'
              disabled={isFutureDate || processing}
              onClick={
                isSessionCancelled ? onReactivateSession : onCancelSession
              }
            >
              {isSessionCancelled ? 'Reactivate Session' : 'Cancel Session'}
            </Button>

            {/* Epic-level bulk import should be in AttendanceHeader, not here */}
          </>
        )}

        {/* View Switcher */}
        <div className='flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg'>
          <Button
            variant={currentView === 'manage' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onViewChange('manage')}
            className='flex items-center gap-2'
          >
            <Settings className='h-4 w-4' />
            Manage
          </Button>
          <Button
            variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onViewChange('leaderboard')}
            className='flex items-center gap-2'
          >
            <BarChart3 className='h-4 w-4' />
            Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
};
