// Request/Response Types
export interface AttendanceCalculationRequest {
  action:
    | 'getSessionStats'
    | 'getEpicStats'
    | 'getCalendarData'
    | 'getLeaderboard'
    | 'getStudentStats'
    | 'getStudentStreaks'
    | 'getPublicLeaderboard';
  params: any;
}

export interface AttendanceCalculationResponse {
  success: boolean;
  data: any;
  metadata: {
    calculationTime: string;
    dataSource: string;
    filters?: any;
    action?: string;
    error?: boolean;
  };
  error?: string;
}

// Parameter Types
export interface SessionStatsParams {
  cohortId: string;
  epicId: string;
  sessionDate: string;
  sessionNumber: number;
}

export interface EpicStatsParams {
  cohortId: string;
  epicId: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CalendarDataParams {
  cohortId: string;
  epicId: string;
  month: string; // YYYY-MM format
}

export interface LeaderboardParams {
  cohortId: string;
  epicId: string;
  limit?: number;
  offset?: number;
}

export interface StudentStatsParams {
  cohortId: string;
  studentId: string;
  epicId: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentStreaksParams {
  cohortId: string;
  epicId: string;
  studentId?: string; // Optional: if not provided, returns all students
}

export interface PublicLeaderboardParams {
  cohortId: string;
  epicId: string;
  limit?: number;
  offset?: number;
  includePrivate?: boolean;
}

// Data Types
export interface SessionStats {
  sessionNumber: number;
  sessionDate: string;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  exemptedCount: number;
  attendedCount: number;
  attendancePercentage: number;
  isCancelled: boolean;
  breakdown: {
    present: number;
    late: number;
    absent: number;
    exempted: number;
    attended: number;
    total: number;
  };
}

export interface EpicStats {
  totalSessions: number;
  averageAttendance: number;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  exemptedCount: number;
  attendedCount: number;
  studentsWithPerfectAttendance: number;
  studentsWithPoorAttendance: number;
  sessionsCancelled: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface CalendarDayData {
  date: string;
  sessions: SessionStats[];
  totalSessions: number;
  overallAttendance: number;
  isHoliday: boolean;
  holidays: Holiday[];
}

export interface CalendarData {
  month: string;
  days: CalendarDayData[];
  monthlyStats: {
    daysWithAttendance: number;
    totalSessions: number;
    averageAttendance: number;
  };
}

export interface LeaderboardEntry {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  attendancePercentage: number;
  currentStreak: number;
  totalSessions: number;
  presentSessions: number;
  rank: number;
  badge?: string; // 🥇 🥈 🥉
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalStudents: number;
  epicInfo: {
    id: string;
    name: string;
  };
  calculatedAt: string;
}

export interface StudentStats {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  attendancePercentage: number;
  currentStreak: number;
  totalSessions: number;
  presentSessions: number;
  lateSessions: number;
  absentSessions: number;
  exemptedSessions: number;
  rank: number;
  rankOutOf: number;
  epicInfo: {
    id: string;
    name: string;
  };
}

export interface StudentStreak {
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
  currentStreak: number;
  longestStreak: number;
  lastAttendanceDate: string;
  streakHistory: {
    date: string;
    status: 'present' | 'late' | 'absent' | 'exempted';
  }[];
}

export interface StudentStreaksData {
  streaks: StudentStreak[];
  topStreak: {
    value: number;
    studentNames: string[];
  };
  averageStreak: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'global' | 'cohort_specific';
  description?: string;
}

// Database Types (matching your existing schema)
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
  created_at: string;
  updated_at: string;
}

export interface CohortStudent {
  id: string;
  cohort_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'inactive' | 'dropped_out';
  created_at: string;
  updated_at: string;
}

export interface CohortEpic {
  id: string;
  cohort_id: string;
  epic_id?: string;
  name: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveApplication {
  id: string;
  student_id: string;
  cohort_id: string;
  epic_id?: string;
  session_date: string;
  end_date?: string;
  is_date_range: boolean;
  session_number: number;
  reason: string;
  leave_status: 'pending' | 'approved' | 'rejected';
  leave_applied_at: string;
  leave_approved_by?: string;
  leave_approved_at?: string;
  leave_rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveApplicationRequest {
  student_id: string;
  cohort_id: string;
  epic_id?: string;
  session_date: string;
  end_date?: string;
  is_date_range: boolean;
  session_number?: number;
  reason: string;
}

export interface UpdateLeaveApplicationRequest {
  leave_status: 'approved' | 'rejected';
  leave_rejection_reason?: string;
}

export interface LeaveApplicationStats {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
}
