import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { CohortHolidayManagementDialog } from '@/components/holidays/CohortHolidayManagementDialog';
import {
  AttendanceHeader,
  AttendanceStatistics,
  AttendanceReasonDialog,
} from '@/components/attendance';
import {
  useAttendanceData,
  useHolidayDetection,
  useAttendanceActions,
  useEpicAttendanceData,
} from '@/hooks/attendance';
import { useAttendancePageState } from '@/pages/cohort-attendance/hooks/useAttendancePageState';
import {
  LoadingState,
  ErrorState,
  SessionManagementHeader,
  ManageView,
  CalendarView,
  LeaderboardView,
} from '@/pages/cohort-attendance/components';
import type { AttendanceStatus } from '@/types/attendance';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const CohortAttendancePage = () => {
  const { cohortId } = useParams<{ cohortId: string }>();

  const pageState = useAttendancePageState({
    onAttendanceMarked: async () => {}, // Will be updated after hooks are initialized
  });

  // Custom hooks for data and logic
  const attendanceData = useAttendanceData(cohortId, {
    selectedDate: pageState.selectedDate,
    selectedSession: pageState.selectedSession,
  });

  const { currentHoliday, isHoliday } = useHolidayDetection(
    cohortId,
    pageState.selectedDate
  );

  const epicAttendanceData = useEpicAttendanceData(
    cohortId,
    attendanceData.selectedEpic
  );

  // Combined refetch function for both session and epic data
  const handleAttendanceMarked = async () => {
    await attendanceData.refetchAttendance();
    await epicAttendanceData.refetchEpicAttendance();
  };

  const attendanceActions = useAttendanceActions({
    cohortId: cohortId!,
    selectedEpic: attendanceData.selectedEpic,
    selectedSession: pageState.selectedSession,
    selectedDate: pageState.selectedDate,
    onAttendanceMarked: handleAttendanceMarked,
    onSessionsRefetch: attendanceData.refetchSessions,
  });

  // Update the pageState callback after hooks are initialized
  useEffect(() => {
    // Update the callback in the pageState
    const originalCallback = pageState.handleMarkAttendance;
    // We'll use the handleAttendanceMarked function directly in the component
  }, [
    attendanceData.selectedEpic,
    pageState.selectedDate,
    pageState.selectedSession,
    pageState.handleMarkAttendance,
  ]);

  // Event handlers
  const handleEpicChange = async (epicId: string) => {
    console.log('🔄 CohortAttendancePage: Epic changed:', {
      from: attendanceData.selectedEpic,
      to: epicId,
      currentEpic: attendanceData.currentEpic?.id,
    });

    attendanceData.setSelectedEpic(epicId);

    // Refresh data when epic changes
    console.log(
      '🔄 CohortAttendancePage: Refreshing data after epic change...'
    );
    try {
      await Promise.all([
        attendanceData.refetchSessions(),
        attendanceData.refetchAttendance(),
        epicAttendanceData.refetchEpicAttendance(),
      ]);
      console.log(
        '✅ CohortAttendancePage: Data refreshed successfully after epic change'
      );
    } catch (error) {
      console.error(
        '❌ CohortAttendancePage: Error refreshing data after epic change:',
        error
      );
    }
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

  const handleResetAttendance = async (studentId: string) => {
    try {
      const sessionDate = format(pageState.selectedDate, 'yyyy-MM-dd');

      // Delete the attendance record for this student, session, and date
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('cohort_id', cohortId)
        .eq('epic_id', attendanceData.selectedEpic)
        .eq('session_number', pageState.selectedSession)
        .eq('session_date', sessionDate)
        .eq('student_id', studentId);

      if (error) throw error;

      // Refresh all data immediately
      await Promise.all([
        attendanceData.refetchAttendance(),
        attendanceData.refetchSessions(),
        epicAttendanceData.refetchEpicAttendance(),
      ]);
    } catch (error) {
      console.error('Error resetting attendance:', error);
      throw error; // Re-throw so the component can handle it
    }
  };

  // Computed values
  const currentSession = attendanceData.sessions.find(
    s => s.sessionNumber === pageState.selectedSession
  );
  const isSessionCancelled = currentSession?.isCancelled || false;

  // Loading state
  if (attendanceData.loading) {
    return <LoadingState />;
  }

  // Error state
  if (attendanceData.error) {
    return <ErrorState error={attendanceData.error} />;
  }

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <AttendanceHeader
          cohort={attendanceData.cohort}
          epics={attendanceData.epics}
          selectedEpic={attendanceData.selectedEpic}
          onEpicChange={handleEpicChange}
          onMarkHolidays={() => pageState.setHolidaysDialogOpen(true)}
          onEpicActiveChanged={async () => {
            // Refresh epics data to reflect the new active epic
            await attendanceData.refetchEpics();
            await attendanceData.refetchSessions();
            await epicAttendanceData.refetchEpicAttendance();
          }}
          onAttendanceImported={async () => {
            // Refresh attendance data after bulk import
            await attendanceData.refetchAttendance();
            await attendanceData.refetchSessions();
            await epicAttendanceData.refetchEpicAttendance();
          }}
          onAttendanceDataChanged={async () => {
            // Refresh attendance data when leave applications are approved/rejected
            await attendanceData.refetchAttendance();
            await attendanceData.refetchSessions();
            await epicAttendanceData.refetchEpicAttendance();
          }}
        />

        {/* Attendance Statistics */}
        <AttendanceStatistics
          cohortId={cohortId!}
          epicId={attendanceData.currentEpic?.id || ''}
          selectedDate={pageState.selectedDate}
          mode='epic'
        />

        {/* Session Management Header */}
        <SessionManagementHeader
          currentView={pageState.currentView}
          selectedDate={pageState.selectedDate}
          isSessionCancelled={isSessionCancelled}
          isFutureDate={pageState.isFutureDate}
          processing={attendanceActions.processing}
          currentEpicName={attendanceData.currentEpic?.name}
          onDateChange={pageState.handleDateChange}
          onPreviousDay={pageState.handlePreviousDay}
          onNextDay={pageState.handleNextDay}
          onCancelSession={attendanceActions.cancelSession}
          onReactivateSession={attendanceActions.reactivateSession}
          onViewChange={pageState.setCurrentView}
        />

        {/* Content Area */}
        <div className='space-y-6'>
          {pageState.currentView === 'manage' ? (
            <ManageView
              isHoliday={isHoliday}
              currentHoliday={currentHoliday}
              cohort={attendanceData.cohort}
              currentEpic={attendanceData.currentEpic}
              selectedDate={pageState.selectedDate}
              sessions={attendanceData.sessions}
              selectedSession={pageState.selectedSession}
              students={attendanceData.students}
              attendanceRecords={attendanceData.attendanceRecords}
              isSessionCancelled={isSessionCancelled}
              isFutureDate={pageState.isFutureDate}
              processing={attendanceActions.processing}
              onSessionChange={pageState.handleSessionChange}
              onMarkAttendance={handleMarkAttendance}
              onResetAttendance={handleResetAttendance}
            />
          ) : pageState.currentView === 'calendar' ? (
            (() => {
              console.log(
                '📤 CohortAttendancePage: Passing data to CalendarView:',
                {
                  selectedDate: pageState.selectedDate,
                  attendanceRecordsLength:
                    attendanceData.attendanceRecords.length,
                  currentEpic: attendanceData.currentEpic,
                  attendanceRecordsSample:
                    attendanceData.attendanceRecords.slice(0, 3),
                }
              );
              return (
                <CalendarView
                  cohortId={cohortId!}
                  epicId={attendanceData.currentEpic?.id || ''}
                  selectedDate={pageState.selectedDate}
                  isHoliday={isHoliday}
                  currentHoliday={currentHoliday}
                  onDateSelect={pageState.handleDateChange}
                  onMarkHoliday={() => pageState.setHolidaysDialogOpen(true)}
                />
              );
            })()
          ) : (
            <LeaderboardView
              leaderboardLayout={pageState.leaderboardLayout}
              cohortId={cohortId!}
              epicId={attendanceData.currentEpic?.id || ''}
              cohortName={attendanceData.cohort?.name}
              epicName={attendanceData.currentEpic?.name}
              maxLeave={attendanceData.cohort?.max_leave || 6}
              onLayoutChange={pageState.setLeaderboardLayout}
            />
          )}
        </div>

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
            open={pageState.holidaysDialogOpen}
            onOpenChange={pageState.setHolidaysDialogOpen}
            cohortId={attendanceData.cohort.id}
            cohortName={attendanceData.cohort.name}
          />
        )}
      </div>
    </DashboardShell>
  );
};

export default CohortAttendancePage;
