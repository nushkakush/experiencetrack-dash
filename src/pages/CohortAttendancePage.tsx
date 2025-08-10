import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { isAfter } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BarChart3, Settings, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardShell from '@/components/DashboardShell';
import { CohortHolidayManagementDialog } from '@/components/holidays/CohortHolidayManagementDialog';
import {
  AttendanceHeader,
  HolidayNotice,
  SessionTabs,
  AttendanceTable,
  AttendanceReasonDialog,
  AttendanceStatistics,
  AttendanceLeaderboard,
  CopyLeaderboardButton,
} from '@/components/attendance';
import {
  useAttendanceData,
  useHolidayDetection,
  useAttendanceActions,
  useEpicAttendanceData,
} from '@/hooks/attendance';
import type { AttendanceStatus, AbsenceType } from '@/types/attendance';

const CohortAttendancePage = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [holidaysDialogOpen, setHolidaysDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'manage' | 'leaderboard'>('manage');
  const [leaderboardLayout, setLeaderboardLayout] = useState<'table' | 'grid'>('grid');

  // Custom hooks for data and logic
  const attendanceData = useAttendanceData(cohortId, {
    selectedDate,
    selectedSession,
  });

  const { currentHoliday, isHoliday } = useHolidayDetection(cohortId, selectedDate);

  const epicAttendanceData = useEpicAttendanceData(cohortId, attendanceData.selectedEpic);

  // Combined refetch function for both session and epic data
  const handleAttendanceMarked = async () => {
    await attendanceData.refetchAttendance();
    await epicAttendanceData.refetchEpicAttendance();
  };

  const attendanceActions = useAttendanceActions({
    cohortId: cohortId!,
    selectedEpic: attendanceData.selectedEpic,
    selectedSession,
    selectedDate,
    onAttendanceMarked: handleAttendanceMarked,
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

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    // Find the student to pass to the actions hook
    const student = attendanceData.students.find(s => s.id === studentId);
    if (student) {
      attendanceActions.setSelectedStudent(student);
    }
    attendanceActions.markAttendance(studentId, status);
  };

  // Computed values
  const currentSession = attendanceData.sessions.find(s => s.sessionNumber === selectedSession);
  const isSessionCancelled = currentSession?.isCancelled || false;
  const isFutureDate = isAfter(selectedDate, new Date());

  // Loading state
  if (attendanceData.loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (attendanceData.error) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">Error loading attendance data</h2>
            <p className="text-gray-600">{attendanceData.error}</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <AttendanceHeader
          cohort={attendanceData.cohort}
          epics={attendanceData.epics}
          selectedEpic={attendanceData.selectedEpic}
          onEpicChange={handleEpicChange}
          onMarkHolidays={() => setHolidaysDialogOpen(true)}
        />

        {/* Attendance Statistics */}
        <AttendanceStatistics
          students={attendanceData.students}
          attendanceRecords={attendanceData.attendanceRecords}
          epicAttendanceRecords={epicAttendanceData.epicAttendanceRecords}
          currentEpic={attendanceData.currentEpic}
          selectedDate={selectedDate}
          isSessionCancelled={isSessionCancelled}
        />

        {/* Session Management Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {currentView === 'manage' ? 'Session Management' : 'Attendance Leaderboard'}
            </h2>
            <p className="text-muted-foreground">
              {attendanceData.currentEpic?.name} - {currentView === 'manage' ? format(selectedDate, 'MMM d, yyyy') : 'Epic Performance'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Date Navigation - Only show in manage view */}
            {currentView === 'manage' && (
              <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && handleDateChange(date)}
                    disabled={(date) => isAfter(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(addDays(selectedDate, 1))}
                disabled={isAfter(addDays(selectedDate, 1), new Date())}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              </div>
            )}

            {/* Session Control Button - Only show in manage view */}
            {currentView === 'manage' && (
              <Button
                variant={isSessionCancelled ? "default" : "destructive"}
                size="sm"
                disabled={isFutureDate || attendanceActions.processing}
                onClick={isSessionCancelled ? attendanceActions.reactivateSession : attendanceActions.cancelSession}
              >
                {isSessionCancelled ? "Reactivate Session" : "Cancel Session"}
              </Button>
            )}

            {/* View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={currentView === 'manage' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('manage')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage
              </Button>
              <Button
                variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('leaderboard')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Leaderboard
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {currentView === 'manage' ? (
            // Manage View - Show session management content
            isHoliday && currentHoliday ? (
              <HolidayNotice
                holiday={currentHoliday}
                cohort={attendanceData.cohort}
                selectedDate={selectedDate}
              />
            ) : (
              <>
                <SessionTabs
                  sessions={attendanceData.sessions}
                  selectedSession={selectedSession}
                  onSessionChange={handleSessionChange}
                />

                <AttendanceTable
                  students={attendanceData.students}
                  attendanceRecords={attendanceData.attendanceRecords}
                  isSessionCancelled={isSessionCancelled}
                  isFutureDate={isFutureDate}
                  processing={attendanceActions.processing}
                  onMarkAttendance={handleMarkAttendance}
                />
              </>
            )
          ) : (
            // Leaderboard View - Show attendance leaderboard
            <div className="space-y-4">
              {/* Copy Link Section */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <h3 className="font-medium text-blue-900">Share Leaderboard</h3>
                  <p className="text-sm text-blue-700">Generate a public link to share this leaderboard with real-time updates</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Layout Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-white rounded border">
                    <Button
                      variant={leaderboardLayout === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLeaderboardLayout('grid')}
                      className="h-7 px-2"
                    >
                      <Grid3X3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={leaderboardLayout === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLeaderboardLayout('table')}
                      className="h-7 px-2"
                    >
                      <List className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <CopyLeaderboardButton
                    cohortId={cohortId!}
                    epicId={attendanceData.selectedEpic}
                    cohortName={attendanceData.cohort?.name}
                    epicName={attendanceData.currentEpic?.name}
                  />
                </div>
              </div>

              {/* Leaderboard */}
              <AttendanceLeaderboard
                students={attendanceData.students}
                attendanceRecords={epicAttendanceData.epicAttendanceRecords}
                currentEpic={attendanceData.currentEpic}
                layout={leaderboardLayout}
              />
            </div>
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
