import React, { useState } from 'react';
import { ProgramCalendarGrid } from './ProgramCalendarGrid';
import { useCalendar } from '../hooks/useCalendar';
import { SessionTypeLegend } from '../../sessions/components/SessionTypeLegend';
import { Button } from '../../../components/ui/button';
import { Calendar, CalendarDays } from 'lucide-react';
import type { Session } from '../../sessions/types';
import { Settings } from 'lucide-react';
import { CohortSessionTimeSettingsDialog } from '../../sessions/components/CohortSessionTimeSettingsDialog';

export interface ProgramCalendarViewProps {
  cohortId: string;
  epicId: string;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  sessionsPerDay: number;
  onPlanSession: (date: Date, sessionNumber: number) => void;
  onDropSession?: (
    date: Date,
    sessionNumber: number,
    sessionType: string,
    sessionTitle: string
  ) => void;
  onMoveSession?: (
    sessionId: string,
    newDate: Date,
    newSessionNumber: number
  ) => void;
  onDeleteSession?: (sessionId: string) => void;
  onUpdateSession?: (
    sessionId: string,
    updates: { title: string }
  ) => Promise<void>;
  onEditChallenge?: (challengeId: string, currentTitle: string) => void;
  plannedSessions: Session[];
  loadingSessions: boolean;
}

export const ProgramCalendarView: React.FC<ProgramCalendarViewProps> = ({
  cohortId,
  epicId,
  selectedDate,
  onDateSelect,
  sessionsPerDay,
  onPlanSession,
  onDropSession,
  onMoveSession,
  onDeleteSession,
  onUpdateSession,
  onEditChallenge,
  plannedSessions,
  loadingSessions,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    currentMonth,
    calendarDays,
    weekDayLabels,
    navigateToPreviousMonth,
    navigateToNextMonth,
    navigateToPreviousWeek,
    navigateToNextWeek,
  } = useCalendar(selectedDate, viewMode, cohortId);

  return (
    <div className='space-y-4 h-full flex flex-col'>
      {/* Calendar Navigation and View Toggle */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <button
            onClick={
              viewMode === 'month'
                ? navigateToPreviousMonth
                : navigateToPreviousWeek
            }
            className='p-2 hover:bg-muted rounded-md transition-colors'
          >
            ← Previous {viewMode === 'month' ? 'Month' : 'Week'}
          </button>
          <h2 className='text-lg font-semibold'>
            {viewMode === 'month'
              ? currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : `Week of ${currentMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </h2>
          <button
            onClick={
              viewMode === 'month' ? navigateToNextMonth : navigateToNextWeek
            }
            className='p-2 hover:bg-muted rounded-md transition-colors'
          >
            Next {viewMode === 'month' ? 'Month' : 'Week'} →
          </button>
        </div>

        {/* View Toggle */}
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setSettingsOpen(true)}
            className='h-8 px-3'
          >
            <Settings className='h-4 w-4 mr-1' />
            Session Times
          </Button>
          <div className='flex items-center gap-1 bg-muted rounded-lg p-1'>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('month')}
              className='h-8 px-3'
            >
              <Calendar className='h-4 w-4 mr-1' />
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('week')}
              className='h-8 px-3'
            >
              <CalendarDays className='h-4 w-4 mr-1' />
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <ProgramCalendarGrid
        key={`calendar-${viewMode}-${currentMonth.toISOString()}`}
        days={calendarDays}
        weekDayLabels={weekDayLabels}
        sessionsPerDay={sessionsPerDay}
        plannedSessions={plannedSessions}
        loadingSessions={loadingSessions}
        selectedDate={selectedDate}
        viewMode={viewMode}
        onDateSelect={onDateSelect}
        onPlanSession={onPlanSession}
        onDropSession={onDropSession}
        onMoveSession={onMoveSession}
        onDeleteSession={onDeleteSession}
        onUpdateSession={onUpdateSession}
        onEditChallenge={onEditChallenge}
        cohortId={cohortId}
        epicId={epicId}
      />

      {/* Session Type Legend */}
      <SessionTypeLegend />

      <CohortSessionTimeSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        cohortId={cohortId}
        sessionsPerDay={sessionsPerDay}
      />

      {/* CBL Boundary Legend */}
      <div className='mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
        <div className='flex items-center gap-2 mb-2'>
          <div className='w-4 h-4 bg-amber-200 border border-amber-300 rounded'></div>
          <span className='text-sm font-medium text-amber-800'>
            CBL Boundary Slots
          </span>
        </div>
        <p className='text-xs text-amber-700'>
          Amber-colored slots indicate dates that fall between CBL Challenge
          boundaries.
          <strong>
            Boundaries are determined by start and end dates, with slot-level
            precision on the end date.
          </strong>
          Middle dates show all slots as amber, but on the end date, only slots
          up to the last CBL session are amber. Middle sessions (like Innovate)
          do not affect boundaries.
        </p>
      </div>
    </div>
  );
};
