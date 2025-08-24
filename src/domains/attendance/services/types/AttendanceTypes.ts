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

export interface AttendanceStats {
  totalSessions: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  studentsWithPerfectAttendance: number;
  studentsWithPoorAttendance: number; // < 75%
  sessionsCancelled: number;
}

export interface StudentStats {
  total: number;
  present: number;
  percentage: number;
}

export interface BulkAttendanceData {
  cohortId: string;
  epicId: string;
  sessionNumber: number;
  sessionDate: string;
  studentId: string;
  status: AttendanceRecord['status'];
  absenceType?: AttendanceRecord['absence_type'];
  reason?: string;
}
