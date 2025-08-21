import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AttendanceRecord =
  Database['public']['Tables']['attendance_records']['Row'];
type CancelledSession =
  Database['public']['Tables']['cancelled_sessions']['Row'];
type CohortEpic = Database['public']['Tables']['cohort_epics']['Row'];
type CohortStudent = Database['public']['Tables']['cohort_students']['Row'];
type AttendanceSummary =
  Database['public']['Views']['attendance_summary']['Row'];

export interface SessionInfo {
  sessionNumber: number;
  sessionDate: string;
  isCancelled: boolean;
}

export interface AttendanceData {
  sessionInfo: SessionInfo;
  records: AttendanceRecord[];
  students: CohortStudent[];
}

export interface EpicAttendanceData {
  epic: CohortEpic;
  sessions: SessionInfo[];
  summary: AttendanceSummary[];
}

export class AttendanceService {
  // Mark student attendance
  static async markAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    studentId: string,
    status: 'present' | 'absent' | 'late',
    absenceType?: 'informed' | 'uninformed' | 'exempted',
    reason?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('mark_student_attendance', {
      p_cohort_id: cohortId,
      p_epic_id: epicId,
      p_session_number: sessionNumber,
      p_session_date: sessionDate,
      p_student_id: studentId,
      p_status: status,
      p_absence_type: absenceType,
      p_reason: reason,
    });

    if (error) throw error;
    return data;
  }

  // Check if a session is cancelled
  static async isSessionCancelled(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_session_cancelled', {
      p_cohort_id: cohortId,
      p_epic_id: epicId,
      p_session_number: sessionNumber,
      p_session_date: sessionDate,
    });

    if (error) throw error;
    return data;
  }

  // Cancel or reactivate a session
  static async toggleSessionCancellation(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    isCancelled: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc('toggle_session_cancellation', {
      p_cohort_id: cohortId,
      p_epic_id: epicId,
      p_session_number: sessionNumber,
      p_session_date: sessionDate,
      p_is_cancelled: isCancelled,
    });

    if (error) throw error;
  }

  // Get attendance records for a specific session
  static async getSessionAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('session_number', sessionNumber)
      .eq('session_date', sessionDate);

    if (error) throw error;
    return data || [];
  }

  // Get all sessions for a date (generated based on cohort.sessions_per_day)
  static async getSessionsForDate(
    cohortId: string,
    epicId: string,
    sessionDate: string
  ): Promise<SessionInfo[]> {
    // Get cohort to know sessions_per_day
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('sessions_per_day')
      .eq('id', cohortId)
      .single();

    if (cohortError) throw cohortError;

    // Generate session info for all sessions of the day
    const sessions: SessionInfo[] = [];
    for (let i = 1; i <= cohort.sessions_per_day; i++) {
      const isCancelled = await this.isSessionCancelled(
        cohortId,
        epicId,
        i,
        sessionDate
      );
      sessions.push({
        sessionNumber: i,
        sessionDate,
        isCancelled,
      });
    }

    return sessions;
  }

  // Get attendance data for a specific session
  static async getSessionAttendanceData(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<AttendanceData> {
    // Get session info
    const isCancelled = await this.isSessionCancelled(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate
    );
    const sessionInfo: SessionInfo = {
      sessionNumber,
      sessionDate,
      isCancelled,
    };

    // Get students for the cohort
    const { data: students, error: studentsError } = await supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .neq('dropped_out_status', 'dropped_out');

    if (studentsError) throw studentsError;

    // Get attendance records
    const records = await this.getSessionAttendance(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate
    );

    return {
      sessionInfo,
      records,
      students: students || [],
    };
  }

  // Get epic attendance data
  static async getEpicAttendance(
    cohortId: string,
    epicId: string,
    startDate?: string,
    endDate?: string
  ): Promise<EpicAttendanceData> {
    // Get epic details
    const { data: epic, error: epicError } = await supabase
      .from('cohort_epics')
      .select('*')
      .eq('id', epicId)
      .single();

    if (epicError) throw epicError;

    // Get attendance summary
    let summaryQuery = supabase
      .from('attendance_summary')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .order('session_date', { ascending: false });

    if (startDate) {
      summaryQuery = summaryQuery.gte('session_date', startDate);
    }
    if (endDate) {
      summaryQuery = summaryQuery.lte('session_date', endDate);
    }

    const { data: summary, error: summaryError } = await summaryQuery;
    if (summaryError) throw summaryError;

    // Generate sessions from summary
    const sessions: SessionInfo[] = (summary || []).map(s => ({
      sessionNumber: s.session_number || 1,
      sessionDate: s.session_date || '',
      isCancelled: s.is_cancelled || false,
    }));

    return {
      epic,
      sessions,
      summary: summary || [],
    };
  }

  // Get cohort epics with active status
  static async getCohortEpics(cohortId: string): Promise<CohortEpic[]> {
    const { data, error } = await supabase
      .from('cohort_epics')
      .select(
        `
        *,
        epic:epics(*)
      `
      )
      .eq('cohort_id', cohortId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Set epic as active
  static async setEpicActive(epicId: string): Promise<void> {
    // First, set all epics in the cohort as inactive
    const { data: epic } = await supabase
      .from('cohort_epics')
      .select('cohort_id')
      .eq('id', epicId)
      .single();

    if (epic) {
      await supabase
        .from('cohort_epics')
        .update({ is_active: false })
        .eq('cohort_id', epic.cohort_id);
    }

    // Then set the selected epic as active
    const { error } = await supabase
      .from('cohort_epics')
      .update({ is_active: true })
      .eq('id', epicId);

    if (error) throw error;
  }

  // Get attendance summary for a date range
  static async getAttendanceSummary(
    cohortId: string,
    epicId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceSummary[]> {
    const { data, error } = await supabase
      .from('attendance_summary')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
