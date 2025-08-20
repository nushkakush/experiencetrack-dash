export interface BulkAttendanceUpload {
  student_email: string;
  session_date: string; // YYYY-MM-DD format
  session_number: number;
  status: 'present' | 'absent' | 'late';
  reason?: string;
  absence_type?: 'informed' | 'uninformed' | 'exempted';
}

export interface BulkAttendanceConfig {
  cohortId: string;
  epicId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  sessionsPerDay: number;
}

export interface AttendanceTemplateData {
  studentEmails: string[];
  sessionsPerDay: number;
  startDate: string;
  endDate: string;
  epicName: string;
}
