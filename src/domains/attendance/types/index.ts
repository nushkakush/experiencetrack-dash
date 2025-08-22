/**
 * Attendance Domain Types
 * Centralized type definitions for the attendance domain
 */

export interface AttendanceRecord {
  id: string;
  cohort_id: string;
  epic_id: string;
  student_id: string;
  session_number: number;
  session_date: string;
  status: 'present' | 'absent' | 'late';
  absence_type?: 'informed' | 'uninformed' | 'exempted';
  reason?: string;
  marked_by: string;
  marked_at: string;
  created_at: string;
  updated_at: string;
}

export interface SessionInfo {
  sessionNumber: number;
  sessionDate: string;
  epicId: string;
  isCancelled: boolean;
  attendanceCount?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

export interface AttendanceSummary {
  student_id: string;
  student_name: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
  epic_id: string;
}

export interface EpicInfo {
  id: string;
  name: string;
  description?: string;
  cohort_id: string;
  start_date: string;
  end_date?: string;
  total_sessions?: number;
}

export interface AttendanceStats {
  totalSessions: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  studentsWithPerfectAttendance: number;
  studentsWithPoorAttendance: number;
  sessionsCancelled: number;
}

export interface AttendanceFilters {
  cohortId?: string;
  epicId?: string;
  studentId?: string;
  sessionDate?: string;
  sessionNumber?: number;
  status?: AttendanceRecord['status'];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// UI-specific types
export interface AttendanceTableRow {
  student: {
    id: string;
    name: string;
    email: string;
  };
  attendance: AttendanceRecord | null;
  attendancePercentage: number;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface SessionTableData {
  session: SessionInfo;
  attendanceRecords: AttendanceRecord[];
  attendanceRate: number;
  studentsPresent: number;
  studentsAbsent: number;
  studentsLate: number;
  totalStudents: number;
}

export interface AttendanceLeaderboardEntry extends AttendanceSummary {
  rank: number;
  badge?: string;
}

// Form types
export interface AttendanceMarkingForm {
  studentId: string;
  status: AttendanceRecord['status'];
  absenceType?: AttendanceRecord['absence_type'];
  reason?: string;
}

export interface BulkAttendanceForm {
  attendanceData: Array<{
    studentId: string;
    status: AttendanceRecord['status'];
    absenceType?: AttendanceRecord['absence_type'];
    reason?: string;
  }>;
}

export interface SessionCreationForm {
  epicId: string;
  sessionDate: string;
  sessionNumber: number;
  notes?: string;
}
