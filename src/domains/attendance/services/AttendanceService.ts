/**
 * Attendance Domain Service
 * Modernized attendance service following enterprise architecture patterns
 */

import { getApiClient, ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';

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

export class AttendanceService {
  private apiClient = getApiClient();
  private logger = Logger.getInstance();

  /**
   * Mark student attendance for a session
   */
  async markAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    studentId: string,
    status: AttendanceRecord['status'],
    absenceType?: AttendanceRecord['absence_type'],
    reason?: string
  ): Promise<ApiResponse<string>> {
    try {
      const result = await this.apiClient.raw.rpc('mark_student_attendance', {
        p_cohort_id: cohortId,
        p_epic_id: epicId,
        p_session_number: sessionNumber,
        p_session_date: sessionDate,
        p_student_id: studentId,
        p_status: status,
        p_absence_type: absenceType,
        p_reason: reason,
      });

      if (result.error) {
        this.logger.error('Failed to mark attendance', {
          error: result.error,
          cohortId,
          epicId,
          sessionNumber,
          studentId,
          status,
        });
        return {
          data: null,
          error: result.error.message,
          success: false,
        };
      }

      return {
        data: result.data,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Error marking attendance', { error });
      return {
        data: null,
        error: 'Failed to mark attendance',
        success: false,
      };
    }
  }

  /**
   * Get attendance records with filtering
   */
  async getAttendanceRecords(filters: AttendanceFilters = {}): Promise<ApiResponse<AttendanceRecord[]>> {
    try {
      let query = this.apiClient.select('attendance_records', `
        *,
        student:students(*),
        epic:cohort_epics(*)
      `);

      // Apply filters
      if (filters.cohortId) {
        query = query.eq('cohort_id', filters.cohortId);
      }

      if (filters.epicId) {
        query = query.eq('epic_id', filters.epicId);
      }

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      if (filters.sessionDate) {
        query = query.eq('session_date', filters.sessionDate);
      }

      if (filters.sessionNumber) {
        query = query.eq('session_number', filters.sessionNumber);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('session_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('session_date', filters.dateTo);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const result = await query.order('session_date', { ascending: false });

      return {
        data: result.data as AttendanceRecord[],
        error: result.error?.message || null,
        success: !result.error,
      };
    } catch (error) {
      this.logger.error('Failed to fetch attendance records', { error, filters });
      return {
        data: null,
        error: 'Failed to fetch attendance records',
        success: false,
      };
    }
  }

  /**
   * Get session attendance (all students for a specific session)
   */
  async getSessionAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    return this.getAttendanceRecords({
      cohortId,
      epicId,
      sessionNumber,
      sessionDate,
    });
  }

  /**
   * Get attendance summary for a student or cohort
   */
  async getAttendanceSummary(
    cohortId: string,
    epicId?: string,
    studentId?: string
  ): Promise<ApiResponse<AttendanceSummary[]>> {
    try {
      const result = await this.apiClient.raw.rpc('get_attendance_summary', {
        p_cohort_id: cohortId,
        p_epic_id: epicId,
        p_student_id: studentId,
      });

      if (result.error) {
        return {
          data: null,
          error: result.error.message,
          success: false,
        };
      }

      return {
        data: result.data as AttendanceSummary[],
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to fetch attendance summary', { error });
      return {
        data: null,
        error: 'Failed to fetch attendance summary',
        success: false,
      };
    }
  }

  /**
   * Get sessions for a specific date and epic
   */
  async getSessionsForDate(
    cohortId: string,
    epicId: string,
    sessionDate: string
  ): Promise<ApiResponse<SessionInfo[]>> {
    try {
      const result = await this.apiClient.raw.rpc('get_sessions_for_date', {
        p_cohort_id: cohortId,
        p_epic_id: epicId,
        p_session_date: sessionDate,
      });

      if (result.error) {
        return {
          data: null,
          error: result.error.message,
          success: false,
        };
      }

      return {
        data: result.data as SessionInfo[],
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to fetch sessions for date', { error });
      return {
        data: null,
        error: 'Failed to fetch sessions',
        success: false,
      };
    }
  }

  /**
   * Toggle session cancellation
   */
  async toggleSessionCancellation(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    isCancelled: boolean
  ): Promise<ApiResponse<void>> {
    try {
      const result = await this.apiClient.raw.rpc('toggle_session_cancellation', {
        p_cohort_id: cohortId,
        p_epic_id: epicId,
        p_session_number: sessionNumber,
        p_session_date: sessionDate,
        p_is_cancelled: isCancelled,
      });

      if (result.error) {
        return {
          data: null,
          error: result.error.message,
          success: false,
        };
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to toggle session cancellation', { error });
      return {
        data: null,
        error: 'Failed to update session',
        success: false,
      };
    }
  }

  /**
   * Check if a session is cancelled
   */
  async isSessionCancelled(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.apiClient.raw.rpc('is_session_cancelled', {
        p_cohort_id: cohortId,
        p_epic_id: epicId,
        p_session_number: sessionNumber,
        p_session_date: sessionDate,
      });

      if (result.error) {
        return {
          data: null,
          error: result.error.message,
          success: false,
        };
      }

      return {
        data: result.data as boolean,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to check session cancellation', { error });
      return {
        data: null,
        error: 'Failed to check session status',
        success: false,
      };
    }
  }

  /**
   * Get cohort epics
   */
  async getCohortEpics(cohortId: string): Promise<ApiResponse<EpicInfo[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('cohort_epics', '*')
        .eq('cohort_id', cohortId)
        .order('start_date', { ascending: true }),
      { cache: true }
    );
  }

  /**
   * Get attendance statistics for a cohort
   */
  async getAttendanceStats(
    cohortId: string,
    epicId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<AttendanceStats>> {
    try {
      const filters: AttendanceFilters = {
        cohortId,
        ...(epicId && { epicId }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        limit: 10000, // Get all records for stats
      };

      const attendanceResult = await this.getAttendanceRecords(filters);
      if (!attendanceResult.success) {
        return attendanceResult as any;
      }

      const records = attendanceResult.data || [];
      
      // Calculate statistics
      const stats: AttendanceStats = {
        totalSessions: this.calculateTotalSessions(records),
        averageAttendance: this.calculateAverageAttendance(records),
        presentCount: records.filter(r => r.status === 'present').length,
        absentCount: records.filter(r => r.status === 'absent').length,
        lateCount: records.filter(r => r.status === 'late').length,
        studentsWithPerfectAttendance: this.calculatePerfectAttendance(records),
        studentsWithPoorAttendance: this.calculatePoorAttendance(records),
        sessionsCancelled: 0, // Would need separate query for cancelled sessions
      };

      return {
        data: stats,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to calculate attendance stats', { error });
      return {
        data: null,
        error: 'Failed to calculate statistics',
        success: false,
      };
    }
  }

  /**
   * Bulk mark attendance for multiple students
   */
  async bulkMarkAttendance(
    attendanceData: Array<{
      cohortId: string;
      epicId: string;
      sessionNumber: number;
      sessionDate: string;
      studentId: string;
      status: AttendanceRecord['status'];
      absenceType?: AttendanceRecord['absence_type'];
      reason?: string;
    }>
  ): Promise<ApiResponse<string[]>> {
    try {
      const results = await Promise.all(
        attendanceData.map(data =>
          this.markAttendance(
            data.cohortId,
            data.epicId,
            data.sessionNumber,
            data.sessionDate,
            data.studentId,
            data.status,
            data.absenceType,
            data.reason
          )
        )
      );

      const successfulIds: string[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.success) {
          successfulIds.push(attendanceData[index].studentId);
        } else {
          errors.push(result.error || 'Unknown error');
        }
      });

      if (errors.length > 0) {
        return {
          data: successfulIds,
          error: `Some operations failed: ${errors.join(', ')}`,
          success: false,
        };
      }

      return {
        data: successfulIds,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to bulk mark attendance', { error });
      return {
        data: null,
        error: 'Failed to bulk mark attendance',
        success: false,
      };
    }
  }

  /**
   * Subscribe to attendance changes
   */
  subscribeToAttendanceChanges(cohortId: string, callback: (payload: any) => void) {
    const channel = this.apiClient.createChannel(`attendance-${cohortId}`);
    
    channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'attendance_records',
          filter: `cohort_id=eq.${cohortId}`
        }, 
        callback
      )
      .subscribe();

    return () => {
      this.apiClient.removeChannel(`attendance-${cohortId}`);
    };
  }

  // Helper methods for statistics calculation
  private calculateTotalSessions(records: AttendanceRecord[]): number {
    const uniqueSessions = new Set(
      records.map(r => `${r.epic_id}-${r.session_number}-${r.session_date}`)
    );
    return uniqueSessions.size;
  }

  private calculateAverageAttendance(records: AttendanceRecord[]): number {
    if (records.length === 0) return 0;
    const presentAndLate = records.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentAndLate / records.length) * 100);
  }

  private calculatePerfectAttendance(records: AttendanceRecord[]): number {
    // Group by student and calculate their attendance percentage
    const studentStats = this.groupByStudent(records);
    return Object.values(studentStats).filter(student => student.percentage === 100).length;
  }

  private calculatePoorAttendance(records: AttendanceRecord[]): number {
    const studentStats = this.groupByStudent(records);
    return Object.values(studentStats).filter(student => student.percentage < 75).length;
  }

  private groupByStudent(records: AttendanceRecord[]) {
    const studentMap: Record<string, { total: number; present: number; percentage: number }> = {};

    records.forEach(record => {
      if (!studentMap[record.student_id]) {
        studentMap[record.student_id] = { total: 0, present: 0, percentage: 0 };
      }

      studentMap[record.student_id].total++;
      if (record.status === 'present' || record.status === 'late') {
        studentMap[record.student_id].present++;
      }
    });

    // Calculate percentages
    Object.keys(studentMap).forEach(studentId => {
      const student = studentMap[studentId];
      student.percentage = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
    });

    return studentMap;
  }
}

// Singleton instance
let attendanceServiceInstance: AttendanceService | null = null;

export const getAttendanceService = (): AttendanceService => {
  if (!attendanceServiceInstance) {
    attendanceServiceInstance = new AttendanceService();
  }
  return attendanceServiceInstance;
};

export const attendanceService = getAttendanceService();
