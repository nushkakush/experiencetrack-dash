import React from 'react';
import { CalendarDayContent } from './CalendarDayContent';
import { cn } from '../../../lib/utils';
import type { CalendarDay } from '../types';
import type { Session } from '../../sessions/types';
import type { SessionMentorAssignmentWithMentor } from '../../../types/sessionMentorAssignment';

export interface ProgramCalendarGridProps {
  days: (CalendarDay | null)[];
  weekDayLabels: string[];
  sessionsPerDay: number;
  plannedSessions: Session[];
  sessionMentorAssignments?: Record<
    string,
    SessionMentorAssignmentWithMentor[]
  >;
  loadingSessions: boolean;
  selectedDate: Date | null;
  viewMode: 'month' | 'week';
  onDateSelect: (date: Date) => void;
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
  onSessionClick?: (session: Session) => void;
  cohortId?: string;
  epicId?: string;
}

export const ProgramCalendarGrid: React.FC<ProgramCalendarGridProps> = ({
  days,
  weekDayLabels,
  sessionsPerDay,
  plannedSessions,
  sessionMentorAssignments = {},
  loadingSessions,
  selectedDate,
  viewMode,
  onDateSelect,
  onPlanSession,
  onDropSession,
  onMoveSession,
  onDeleteSession,
  onUpdateSession,
  onEditChallenge,
  onSessionClick,
  cohortId,
  epicId,
}) => {
  // Render calendar grid with provided days and configuration
  return (
    <div className='space-y-4 h-full flex flex-col'>
      {/* Week Day Headers */}
      <div className='grid grid-cols-7 gap-1'>
        {weekDayLabels.map(day => (
          <div
            key={day}
            className='text-center text-sm font-medium text-muted-foreground py-2'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div
        className='grid grid-cols-7 gap-1 flex-1'
        style={
          viewMode === 'month'
            ? { gridTemplateRows: 'repeat(6, minmax(20rem, 1fr))' }
            : { gridTemplateRows: 'repeat(1, minmax(20rem, 1fr))' }
        }
      >
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              'border rounded-lg transition-colors duration-200 h-full min-h-64 relative',
              viewMode === 'week'
                ? 'bg-background'
                : day?.isCurrentMonth
                  ? 'bg-background'
                  : 'bg-muted/30',
              day?.isToday &&
                'bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-400/60 dark:ring-blue-300/40',
              day?.isSelected && 'ring-2 ring-blue-300',
              viewMode === 'month' && !day?.isCurrentMonth && 'opacity-50'
            )}
          >
            {day ? (
              <CalendarDayContent
                day={day}
                sessionsPerDay={sessionsPerDay}
                plannedSessions={plannedSessions}
                sessionMentorAssignments={sessionMentorAssignments}
                loadingSessions={loadingSessions}
                onDateSelect={onDateSelect}
                onPlanSession={onPlanSession}
                onDropSession={onDropSession}
                onMoveSession={onMoveSession}
                onDeleteSession={onDeleteSession}
                onUpdateSession={onUpdateSession}
                onEditChallenge={onEditChallenge}
                onSessionClick={onSessionClick}
                cohortId={cohortId}
                epicId={epicId}
              />
            ) : (
              <div className='p-2 min-h-64' />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
