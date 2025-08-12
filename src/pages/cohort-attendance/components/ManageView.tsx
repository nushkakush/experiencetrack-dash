import React from 'react';
import { HolidayNotice, SessionTabs, AttendanceTable } from '@/components/attendance';
import { Logger } from '@/lib/logging/Logger';

interface ManageViewProps {
  isHoliday: boolean;
  currentHoliday: any;
  cohort: any;
  selectedDate: Date;
  sessions: any[];
  selectedSession: number;
  students: any[];
  attendanceRecords: any[];
  isSessionCancelled: boolean;
  isFutureDate: boolean;
  processing: boolean;
  onSessionChange: (session: number) => void;
  onMarkAttendance: (studentId: string, status: any) => void;
}

export const ManageView: React.FC<ManageViewProps> = ({
  isHoliday,
  currentHoliday,
  cohort,
  selectedDate,
  sessions,
  selectedSession,
  students,
  attendanceRecords,
  isSessionCancelled,
  isFutureDate,
  processing,
  onSessionChange,
  onMarkAttendance
}) => {
  if (isHoliday && currentHoliday) {
    return (
      <HolidayNotice
        holiday={currentHoliday}
        cohort={cohort}
        selectedDate={selectedDate}
      />
    );
  }

  return (
    <>
      <SessionTabs
        sessions={sessions}
        selectedSession={selectedSession}
        onSessionChange={onSessionChange}
        students={students}
        attendanceRecords={attendanceRecords}
      />

      <AttendanceTable
        students={students}
        attendanceRecords={attendanceRecords}
        isSessionCancelled={isSessionCancelled}
        isFutureDate={isFutureDate}
        processing={processing}
        onMarkAttendance={onMarkAttendance}
      />
    </>
  );
};
