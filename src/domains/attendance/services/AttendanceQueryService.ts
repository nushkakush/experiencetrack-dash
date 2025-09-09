import {
  getApiClient,
  ApiResponse,
} from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceFilters,
  EpicInfo,
} from './types/AttendanceTypes';

export class AttendanceQueryService {
  private apiClient = getApiClient();
  private logger = Logger.getInstance();

  /**
   * Get attendance records with filtering
   */
  async getAttendanceRecords(
    filters: AttendanceFilters = {}
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    try {
      let query = this.apiClient.select(
        'attendance_records',
        `
        *,
        student:students(*),
        epic:cohort_epics(*)
      `
      );

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
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      const result = await query.order('session_date', { ascending: false });

      return {
        data: result.data as AttendanceRecord[],
        error: result.error?.message || null,
        success: !result.error,
      };
    } catch (error) {
      this.logger.error('Failed to fetch attendance records', {
        error,
        filters,
      });
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
   * Get cohort epics
   */
  async getCohortEpics(cohortId: string): Promise<ApiResponse<EpicInfo[]>> {
    return this.apiClient.query(
      () =>
        this.apiClient
          .select('cohort_epics', '*')
          .eq('cohort_id', cohortId)
          .order('start_date', { ascending: true }),
      { cache: true }
    );
  }
}
