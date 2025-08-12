// Attendance Store Types - Comprehensive type definitions for attendance state management

import { AttendanceStatus, AbsenceType } from '@/types/attendance';

// Attendance Record Types
export interface AttendanceRecord {
  id: string;
  student_id: string;
  cohort_id: string;
  epic_id: string;
  session_date: string;
  session_number: number;
  status: AttendanceStatus;
  absence_type?: AbsenceType;
  reason?: string;
  marked_by: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

// Attendance Statistics Types
export interface AttendanceStats {
  totalSessions: number;
  present: number;
  absent: number;
  attendanceRate: number;
  currentStreak: number;
  lateCount?: number;
  excusedAbsences?: number;
  unexcusedAbsences?: number;
}

// Attendance Filters Types
export interface AttendanceFilters {
  status: AttendanceStatus | 'all';
  absenceType: AbsenceType | 'all';
  dateRange: { 
    start: Date | null; 
    end: Date | null; 
  };
}

// Attendance Store State Interface
export interface AttendanceState {
  // Selected date and session
  selectedDate: Date;
  selectedSession: number;
  setSelectedDate: (date: Date) => void;
  setSelectedSession: (session: number) => void;
  
  // Attendance data
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  
  // Statistics
  attendanceStats: AttendanceStats | null;
  setAttendanceStats: (stats: AttendanceStats) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error states
  error: string | null;
  setError: (error: string | null) => void;
  
  // Marking attendance
  markingAttendance: Set<string>;
  setMarkingAttendance: (studentId: string, isMarking: boolean) => void;
  
  // Filters
  filters: AttendanceFilters;
  setFilter: (filter: keyof AttendanceFilters, value: AttendanceStatus | AbsenceType | 'all' | { start: Date | null; end: Date | null }) => void;
  
  // Reset store
  reset: () => void;
}

// Attendance Store Actions Interface
export interface AttendanceStoreActions {
  setSelectedDate: (date: Date) => void;
  setSelectedSession: (session: number) => void;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  setAttendanceStats: (stats: AttendanceStats) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMarkingAttendance: (studentId: string, isMarking: boolean) => void;
  setFilter: (filter: keyof AttendanceFilters, value: AttendanceStatus | AbsenceType | 'all' | { start: Date | null; end: Date | null }) => void;
  reset: () => void;
}

// Attendance Store Selectors Interface
export interface AttendanceStoreSelectors {
  selectedDate: Date;
  selectedSession: number;
  attendanceRecords: AttendanceRecord[];
  attendanceStats: AttendanceStats | null;
  isLoading: boolean;
  error: string | null;
  markingAttendance: Set<string>;
  filters: AttendanceFilters;
}

// Utility Types
export type AttendanceRecordUpdate = Partial<AttendanceRecord>;
export type AttendanceStatsUpdate = Partial<AttendanceStats>;
export type AttendanceFiltersUpdate = Partial<AttendanceFilters>;

// Filter Value Types
export type FilterValue = AttendanceStatus | AbsenceType | 'all' | { start: Date | null; end: Date | null };
