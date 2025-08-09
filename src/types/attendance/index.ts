import type { Database } from '@/integrations/supabase/types';

// Database types
export type CohortStudent = Database['public']['Tables']['cohort_students']['Row'];
export type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
export type CohortEpic = Database['public']['Tables']['cohort_epics']['Row'];
export type Cohort = Database['public']['Tables']['cohorts']['Row'];

// Attendance specific types
export interface SessionInfo {
  sessionNumber: number;
  sessionDate: string;
  isCancelled: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';
export type AbsenceType = 'informed' | 'uninformed' | 'exempted';

export interface AttendanceAction {
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
  absenceType?: AbsenceType;
}

export interface AttendanceData {
  cohort: Cohort | null;
  students: CohortStudent[];
  epics: CohortEpic[];
  sessions: SessionInfo[];
  attendanceRecords: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}

export interface AttendanceContext {
  cohortId: string;
  selectedDate: Date;
  selectedSession: number;
  selectedEpic: string;
  currentEpic: CohortEpic | null;
}

export interface AttendanceHandlers {
  onDateChange: (date: Date) => void;
  onSessionChange: (session: number) => void;
  onEpicChange: (epicId: string) => void;
  onMarkAttendance: (action: AttendanceAction) => Promise<void>;
  onCancelSession: () => Promise<void>;
  onReactivateSession: () => Promise<void>;
}
