import { getApiClient, ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import { AttendanceRecord, BulkAttendanceData } from './types/AttendanceTypes';

export class AttendanceMarkingService {
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
   * Bulk mark attendance for multiple students
   */
  async bulkMarkAttendance(
    attendanceData: BulkAttendanceData[]
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
}
