import React, { useState, useEffect } from 'react';
import { ProgramCalendarGrid } from './ProgramCalendarGrid';
import { useCalendar } from '../hooks/useCalendar';
import { SessionTypeLegend } from '../../sessions/components/SessionTypeLegend';
import { Button } from '../../../components/ui/button';
import { Calendar, CalendarDays } from 'lucide-react';
import type { Session } from '../../sessions/types';
import { Settings } from 'lucide-react';
import { CohortSessionTimeSettingsDialog } from '../../sessions/components/CohortSessionTimeSettingsDialog';
import { WeeklyCalendarDownload } from '../../../components/calendar/WeeklyCalendarDownload';
import { MentorsService } from '../../../services/mentors.service';
import { cohortsService } from '../../../services/cohorts.service';
import type { UserProfile } from '../../../types/auth';
import type { Cohort } from '../../../types/cohort';
import type { SessionMentorAssignmentWithMentor } from '../../../types/sessionMentorAssignment';
import type { ExperienceType } from '../../../types/experience';

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
  onSessionClick?: (session: Session) => void;
  onExperienceDrop?: (
    type: ExperienceType,
    date: Date,
    sessionNumber: number
  ) => void;
  plannedSessions: Session[];
  sessionMentorAssignments?: Record<
    string,
    SessionMentorAssignmentWithMentor[]
  >;
  loadingSessions: boolean;
  programCode?: string;
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
  onSessionClick,
  onExperienceDrop,
  plannedSessions,
  sessionMentorAssignments = {},
  loadingSessions,
  programCode = 'CP02',
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [cohort, setCohort] = useState<Cohort | null>(null);

  const {
    currentMonth,
    calendarDays,
    weekDayLabels,
    navigateToPreviousMonth,
    navigateToNextMonth,
    navigateToPreviousWeek,
    navigateToNextWeek,
  } = useCalendar(selectedDate, viewMode, cohortId);

  // Load mentors for the cohort
  useEffect(() => {
    const loadMentors = async () => {
      try {
        const result = await MentorsService.getCohortMentors(cohortId);
        if (result.success && result.data && result.data.length > 0) {
          setMentors(result.data);
        } else {
          // Fallback to all mentors if no cohort-specific mentors found
          const fallbackResult = await MentorsService.getAllMentors();
          if (
            fallbackResult.success &&
            fallbackResult.data &&
            fallbackResult.data.length > 0
          ) {
            setMentors(fallbackResult.data.slice(0, 4));
          } else {
            // If no mentors found, use placeholder data
            setMentors([
              {
                id: '1',
                user_id: '1',
                first_name: 'LALITH',
                last_name: 'DHANUSH',
                email: 'lalith@example.com',
                role: 'mentor_manager',
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: '2',
                user_id: '2',
                first_name: 'SANJAY',
                last_name: 'SINGHA',
                email: 'sanjay@example.com',
                role: 'mentor_manager',
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: '3',
                user_id: '3',
                first_name: 'KANISHKAR',
                last_name: 'VELLINGIRI',
                email: 'kanishkar@example.com',
                role: 'mentor_manager',
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: '4',
                user_id: '4',
                first_name: 'KARAN',
                last_name: 'KATKE',
                email: 'karan@example.com',
                role: 'mentor_manager',
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading mentors:', error);
        // Use placeholder data on error
        setMentors([
          {
            id: '1',
            user_id: '1',
            first_name: 'LALITH',
            last_name: 'DHANUSH',
            email: 'lalith@example.com',
            role: 'mentor_manager',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            user_id: '2',
            first_name: 'SANJAY',
            last_name: 'SINGHA',
            email: 'sanjay@example.com',
            role: 'mentor_manager',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            user_id: '3',
            first_name: 'KANISHKAR',
            last_name: 'VELLINGIRI',
            email: 'kanishkar@example.com',
            role: 'mentor_manager',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '4',
            user_id: '4',
            first_name: 'KARAN',
            last_name: 'KATKE',
            email: 'karan@example.com',
            role: 'mentor_manager',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }

      // Load cohort data
      try {
        const cohortResult = await cohortsService.getById(cohortId);
        if (cohortResult.success && cohortResult.data) {
          setCohort(cohortResult.data);
        }
      } catch (error) {
        console.error('Error loading cohort data:', error);
      }
    };

    loadMentors();
  }, [cohortId]);

  return (
    <div className='h-full flex flex-col'>
      {/* Calendar Navigation and View Toggle - Sticky Header */}
      <div className='sticky -top-6 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 pb-4 mb-4'>
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

          {/* View Toggle and Download */}
          <div className='flex items-center gap-2'>
            {viewMode === 'week' && (
              <WeeklyCalendarDownload
                currentWeek={currentMonth}
                sessions={plannedSessions}
                calendarDays={calendarDays}
                cohortId={cohortId}
                cohortName={cohort?.name}
                programCode={programCode}
                mentors={mentors}
                sessionMentorAssignments={sessionMentorAssignments}
              />
            )}
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
        
        {/* Week Day Headers - Inside the same sticky container */}
        <div className='mt-4'>
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
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        <ProgramCalendarGrid
          key={`calendar-${viewMode}-${currentMonth.toISOString()}`}
          days={calendarDays}
          weekDayLabels={weekDayLabels}
          sessionsPerDay={sessionsPerDay}
          plannedSessions={plannedSessions}
          sessionMentorAssignments={sessionMentorAssignments}
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
          onSessionClick={onSessionClick}
          onExperienceDrop={onExperienceDrop}
          cohortId={cohortId}
          epicId={epicId}
        />

        {/* Session Type Legend */}
        <SessionTypeLegend />

        {/* CBL Boundary Legend */}
        <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
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

      <CohortSessionTimeSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        cohortId={cohortId}
        sessionsPerDay={sessionsPerDay}
      />
    </div>
  );
};
