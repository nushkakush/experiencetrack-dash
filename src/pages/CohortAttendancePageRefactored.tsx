import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { isAfter, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardShell from '@/components/DashboardShell';
import { CohortHolidayManagementDialog } from '@/components/holidays/CohortHolidayManagementDialog';
import {
  AttendanceHeader,
  HolidayNotice,
  SessionTabs,
  AttendanceTable,
  AttendanceReasonDialog,
} from '@/components/attendance';
import { SessionManagementHeader } from '@/pages/cohort-attendance/components/SessionManagementHeader';
import { CalendarView } from '@/pages/cohort-attendance/components/CalendarView';
import {
  useAttendanceData,
  useHolidayDetection,
  useAttendanceActions,
} from '@/hooks/attendance';
import type { AttendanceStatus, AbsenceType } from '@/types/attendance';

const CohortAttendancePage = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [holidaysDialogOpen, setHolidaysDialogOpen] = useState(false);

  const [currentView, setCurrentView] = useState<
    'manage' | 'calendar' | 'leaderboard'
  >('manage');

  // Custom hooks for data and logic
  const attendanceData = useAttendanceData(cohortId, {
    selectedDate,
    selectedSession,
  });

  const { currentHoliday, isHoliday } = useHolidayDetection(
    cohortId,
    selectedDate
  );

  const attendanceActions = useAttendanceActions({
    cohortId: cohortId!,
    selectedEpic: attendanceData.selectedEpic,
    selectedSession,
    selectedDate,
    onAttendanceMarked: attendanceData.refetchAttendance,
    onSessionsRefetch: attendanceData.refetchSessions,
  });

  // Event handlers
  const handleDateChange = (date: Date) => {
    if (!isAfter(date, new Date())) {
      setSelectedDate(date);
    }
  };

  const handleSessionChange = (session: number) => {
    setSelectedSession(session);
  };

  const handleEpicChange = (epicId: string) => {
    attendanceData.setSelectedEpic(epicId);
  };

  const handleMarkAttendance = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    // Find the student to pass to the actions hook
    const student = attendanceData.students.find(s => s.id === studentId);
    if (student) {
      attendanceActions.setSelectedStudent(student);
    }
    attendanceActions.markAttendance(studentId, status);
  };

  // Computed values
  const currentSession = attendanceData.sessions.find(
    s => s.sessionNumber === selectedSession
  );
  const isSessionCancelled = currentSession?.isCancelled || false;
  const isFutureDate = isAfter(selectedDate, new Date());

  // Loading state
  if (attendanceData.loading) {
    return (
      <DashboardShell>
        <div className='space-y-6'>
          <Skeleton className='h-8 w-[200px]' />
          <Skeleton className='h-12 w-full' />
          <Card>
            <CardContent className='pt-6'>
              <div className='space-y-4'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-64 w-full' />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (attendanceData.error) {
    return (
      <DashboardShell>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Error loading attendance data
            </h2>
            <p className='text-gray-600 dark:text-gray-400'>
              {attendanceData.error}
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <AttendanceHeader
          cohort={attendanceData.cohort}
          currentEpic={attendanceData.currentEpic}
          epics={attendanceData.epics}
          selectedDate={selectedDate}
          selectedEpic={attendanceData.selectedEpic}
          isSessionCancelled={isSessionCancelled}
          processing={attendanceActions.processing}
          onDateChange={handleDateChange}
          onEpicChange={handleEpicChange}
          onCancelSession={attendanceActions.cancelSession}
          onReactivateSession={attendanceActions.reactivateSession}
          onMarkHolidays={() => setHolidaysDialogOpen(true)}
          onAttendanceImported={() => {
            attendanceData.refetchAttendance();
            attendanceData.refetchSessions();
          }}
          onAttendanceDataChanged={() => {
            // Refresh attendance data when leave applications are approved/rejected
            attendanceData.refetchAttendance();
            attendanceData.refetchSessions();
          }}
        />

        {/* Session Management Header */}
        <SessionManagementHeader
          currentView={currentView}
          selectedDate={selectedDate}
          isSessionCancelled={isSessionCancelled}
          isFutureDate={isFutureDate}
          processing={attendanceActions.processing}
          currentEpicName={attendanceData.currentEpic?.name}
          cohortId={cohortId}
          epicId={attendanceData.selectedEpic}
          sessionsPerDay={attendanceData.cohort?.sessions_per_day}
          onDateChange={handleDateChange}
          onPreviousDay={() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            if (!isAfter(prevDate, new Date())) {
              setSelectedDate(prevDate);
            }
          }}
          onNextDay={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            if (!isAfter(nextDate, new Date())) {
              setSelectedDate(nextDate);
            }
          }}
          onCancelSession={attendanceActions.cancelSession}
          onReactivateSession={attendanceActions.reactivateSession}
          onViewChange={setCurrentView}
          onAttendanceImported={() => {
            attendanceData.refetchAttendance();
            attendanceData.refetchSessions();
          }}
        />

        {/* Session Management Card Content */}
        <Card>
          <CardContent>
            {isHoliday && currentHoliday ? (
              <HolidayNotice
                holiday={currentHoliday}
                cohort={attendanceData.cohort}
                selectedDate={selectedDate}
              />
            ) : currentView === 'manage' ? (
              <div className='space-y-6'>
                <SessionTabs
                  sessions={attendanceData.sessions}
                  selectedSession={selectedSession}
                  onSessionChange={handleSessionChange}
                  cohortId={attendanceData.cohort.id}
                  epicId={attendanceData.currentEpic?.id || ''}
                  sessionDate={format(selectedDate, 'yyyy-MM-dd')}
                />

                <AttendanceTable
                  students={attendanceData.students}
                  attendanceRecords={attendanceData.attendanceRecords}
                  isSessionCancelled={isSessionCancelled}
                  isFutureDate={isFutureDate}
                  processing={attendanceActions.processing}
                  onMarkAttendance={handleMarkAttendance}
                  onResetAttendance={async (studentId: string) => {
                    try {
                      const sessionDate = format(selectedDate, 'yyyy-MM-dd');

                      const { error } = await supabase
                        .from('attendance_records')
                        .delete()
                        .eq('cohort_id', cohortId)
                        .eq('epic_id', attendanceData.selectedEpic)
                        .eq('session_number', selectedSession)
                        .eq('session_date', sessionDate)
                        .eq('student_id', studentId);

                      if (error) throw error;

                      toast.success('Attendance reset successfully');

                      // Refresh all data immediately
                      await Promise.all([
                        attendanceData.refetchAttendance(),
                        attendanceData.refetchSessions(),
                      ]);
                    } catch (error) {
                      console.error('Error resetting attendance:', error);
                      toast.error('Failed to reset attendance');
                    }
                  }}
                />
              </div>
            ) : currentView === 'calendar' ? (
              <CalendarView
                cohortId={cohortId}
                epicId={attendanceData.currentEpic?.id || ''}
                selectedDate={selectedDate}
                isHoliday={isHoliday}
                currentHoliday={currentHoliday}
                onDateSelect={handleDateChange}
                onMarkHoliday={() => setHolidaysDialogOpen(true)}
              />
            ) : (
              <div className='space-y-6'>
                {/* Leaderboard view content would go here */}
                <div className='text-center py-8'>
                  <p className='text-muted-foreground'>
                    Leaderboard view coming soon...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AttendanceReasonDialog
          open={attendanceActions.showReasonDialog}
          student={attendanceActions.selectedStudent}
          status={attendanceActions.selectedStatus}
          reason={attendanceActions.reason}
          absenceType={attendanceActions.absenceType}
          processing={attendanceActions.processing}
          onOpenChange={attendanceActions.setShowReasonDialog}
          onReasonChange={attendanceActions.setReason}
          onAbsenceTypeChange={attendanceActions.setAbsenceType}
          onConfirm={attendanceActions.confirmReasonAndMark}
        />

        {attendanceData.cohort && (
          <CohortHolidayManagementDialog
            open={holidaysDialogOpen}
            onOpenChange={setHolidaysDialogOpen}
            cohortId={attendanceData.cohort.id}
            cohortName={attendanceData.cohort.name}
          />
        )}
      </div>
    </DashboardShell>
  );
};

export default CohortAttendancePage;
