import React, { useMemo } from 'react';
import {
  HolidayNotice,
  SessionTabs,
  AttendanceTable,
} from '@/components/attendance';
import { Logger } from '@/lib/logging/Logger';
import { toast } from 'sonner';
import type {
  Cohort,
  CohortEpic,
  CohortStudent,
  AttendanceRecord,
} from '@/types/attendance';

interface ManageViewProps {
  isHoliday: boolean;
  currentHoliday: CohortEpic | null;
  cohort: Cohort;
  selectedDate: Date;
  sessions: {
    sessionNumber: number;
    sessionDate: string;
    isCancelled: boolean;
  }[];
  selectedSession: number;
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
  isSessionCancelled: boolean;
  isFutureDate: boolean;
  processing: boolean;
  onSessionChange: (session: number) => void;
  onMarkAttendance: (
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ) => void;
  onResetAttendance?: (studentId: string) => Promise<void>;
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
  onMarkAttendance,
  onResetAttendance,
}) => {
  // Sort students alphabetically by first name, then last name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aFirstName = (a.first_name || '').toLowerCase();
      const bFirstName = (b.first_name || '').toLowerCase();
      const aLastName = (a.last_name || '').toLowerCase();
      const bLastName = (b.last_name || '').toLowerCase();

      // First compare by first name
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName);
      }

      // If first names are the same, compare by last name
      return aLastName.localeCompare(bLastName);
    });
  }, [students]);

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
        students={sortedStudents}
        attendanceRecords={attendanceRecords}
      />

      <AttendanceTable
        students={sortedStudents}
        attendanceRecords={attendanceRecords}
        isSessionCancelled={isSessionCancelled}
        isFutureDate={isFutureDate}
        processing={processing}
        onMarkAttendance={onMarkAttendance}
        onResetAttendance={onResetAttendance}
      />
    </>
  );
};
