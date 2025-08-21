import React from 'react';
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
        onResetAttendance={onResetAttendance}
      />
    </>
  );
};
