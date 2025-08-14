import React, { useEffect } from 'react';
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
  LeaderboardView
} from '@/pages/cohort-attendance/components';
import type { AttendanceStatus } from '@/types/attendance';

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

  const { currentHoliday, isHoliday } = useHolidayDetection(cohortId, pageState.selectedDate);

  const epicAttendanceData = useEpicAttendanceData(cohortId, attendanceData.selectedEpic);

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
  }, [attendanceData.selectedEpic, pageState.selectedDate, pageState.selectedSession]);

  // Event handlers
  const handleEpicChange = (epicId: string) => {
    attendanceData.setSelectedEpic(epicId);
  };

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    // Find the student to pass to the actions hook
    const student = attendanceData.students.find(s => s.id === studentId);
    if (student) {
      attendanceActions.setSelectedStudent(student);
    }
    attendanceActions.markAttendance(studentId, status);
  };

  // Computed values
  const currentSession = attendanceData.sessions.find(s => s.sessionNumber === pageState.selectedSession);
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
      <div className="space-y-6">
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
        />

        {/* Attendance Statistics */}
        <AttendanceStatistics
          students={attendanceData.students}
          attendanceRecords={attendanceData.attendanceRecords}
          epicAttendanceRecords={epicAttendanceData.epicAttendanceRecords}
          currentEpic={attendanceData.currentEpic}
          selectedDate={pageState.selectedDate}
          isSessionCancelled={isSessionCancelled}
          mode="epic"
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
        <div className="space-y-6">
          {pageState.currentView === 'manage' ? (
            <ManageView
              isHoliday={isHoliday}
              currentHoliday={currentHoliday}
              cohort={attendanceData.cohort}
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
            />
          ) : (
            <LeaderboardView
              leaderboardLayout={pageState.leaderboardLayout}
              cohortId={cohortId!}
              epicId={attendanceData.selectedEpic}
              cohortName={attendanceData.cohort?.name}
              epicName={attendanceData.currentEpic?.name}
              students={attendanceData.students}
              epicAttendanceRecords={epicAttendanceData.epicAttendanceRecords}
              currentEpic={attendanceData.currentEpic}
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
