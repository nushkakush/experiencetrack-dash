/**
 * Attendance Domain Service
 * Modernized attendance service following enterprise architecture patterns
 * Now orchestrates focused services for different attendance concerns
 */

import { ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import {
  AttendanceRecord,
  AttendanceSummary,
  AttendanceFilters,
  AttendanceStats,
  SessionInfo,
  EpicInfo,
  BulkAttendanceData,
} from './types/AttendanceTypes';
import { AttendanceMarkingService } from './AttendanceMarkingService';
import { AttendanceQueryService } from './AttendanceQueryService';
import { SessionManagementService } from './SessionManagementService';
import { AttendanceStatsService } from './AttendanceStatsService';
import { AttendanceSubscriptionService } from './AttendanceSubscriptionService';

export class AttendanceService {
  private logger = Logger.getInstance();

  // Focused services for different concerns
  private markingService: AttendanceMarkingService;
  private queryService: AttendanceQueryService;
  private sessionService: SessionManagementService;
  private statsService: AttendanceStatsService;
  private subscriptionService: AttendanceSubscriptionService;

  constructor() {
    this.markingService = new AttendanceMarkingService();
    this.queryService = new AttendanceQueryService();
    this.sessionService = new SessionManagementService();
    this.statsService = new AttendanceStatsService(this.queryService);
    this.subscriptionService = new AttendanceSubscriptionService();
  }

  // Attendance Marking Operations
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
    return this.markingService.markAttendance(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate,
      studentId,
      status,
      absenceType,
      reason
    );
  }

  async bulkMarkAttendance(
    attendanceData: BulkAttendanceData[]
  ): Promise<ApiResponse<string[]>> {
    return this.markingService.bulkMarkAttendance(attendanceData);
  }

  // Attendance Query Operations
  async getAttendanceRecords(
    filters: AttendanceFilters = {}
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    return this.queryService.getAttendanceRecords(filters);
  }

  async getSessionAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<ApiResponse<AttendanceRecord[]>> {
    return this.queryService.getSessionAttendance(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate
    );
  }

  async getAttendanceSummary(
    cohortId: string,
    epicId?: string,
    studentId?: string
  ): Promise<ApiResponse<AttendanceSummary[]>> {
    // Use edge function for attendance summary
    try {
      const { AttendanceCalculationsService } = await import(
        '@/services/attendanceCalculations.service'
      );

      if (studentId) {
        // Get individual student stats
        const studentStats =
          await AttendanceCalculationsService.getStudentStats({
            cohortId,
            studentId,
            epicId: epicId!,
          });

        // Convert to AttendanceSummary format
        const summary: AttendanceSummary = {
          student_id: studentStats.student.id,
          first_name: studentStats.student.first_name,
          last_name: studentStats.student.last_name,
          email: studentStats.student.email,
          attendance_percentage: studentStats.attendancePercentage,
          total_sessions: studentStats.totalSessions,
          present_sessions: studentStats.presentSessions,
          late_sessions: studentStats.lateSessions,
          absent_sessions: studentStats.absentSessions,
          exempted_sessions: studentStats.exemptedSessions,
          current_streak: studentStats.currentStreak,
          rank: studentStats.rank,
          rank_out_of: studentStats.rankOutOf,
        };

        return {
          data: [summary],
          error: null,
          success: true,
        };
      } else {
        // Get leaderboard data for all students
        const leaderboard = await AttendanceCalculationsService.getLeaderboard({
          cohortId,
          epicId: epicId!,
          limit: 100,
        });

        // Convert to AttendanceSummary format
        const summary: AttendanceSummary[] = leaderboard.entries.map(entry => ({
          student_id: entry.student.id,
          first_name: entry.student.first_name,
          last_name: entry.student.last_name,
          email: entry.student.email,
          attendance_percentage: entry.attendancePercentage,
          total_sessions: entry.totalSessions,
          present_sessions: entry.presentSessions,
          late_sessions: 0, // Not provided in leaderboard
          absent_sessions: 0, // Not provided in leaderboard
          exempted_sessions: 0, // Not provided in leaderboard
          current_streak: entry.currentStreak,
          rank: entry.rank,
          rank_out_of: leaderboard.totalStudents,
        }));

        return {
          data: summary,
          error: null,
          success: true,
        };
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  async getCohortEpics(cohortId: string): Promise<ApiResponse<EpicInfo[]>> {
    return this.queryService.getCohortEpics(cohortId);
  }

  // Session Management Operations
  async getSessionsForDate(
    cohortId: string,
    epicId: string,
    sessionDate: string
  ): Promise<ApiResponse<SessionInfo[]>> {
    return this.sessionService.getSessionsForDate(
      cohortId,
      epicId,
      sessionDate
    );
  }

  async toggleSessionCancellation(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    isCancelled: boolean
  ): Promise<ApiResponse<void>> {
    return this.sessionService.toggleSessionCancellation(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate,
      isCancelled
    );
  }

  async isSessionCancelled(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<ApiResponse<boolean>> {
    return this.sessionService.isSessionCancelled(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate
    );
  }

  // Statistics Operations
  async getAttendanceStats(
    cohortId: string,
    epicId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<AttendanceStats>> {
    return this.statsService.getAttendanceStats(
      cohortId,
      epicId,
      dateFrom,
      dateTo
    );
  }

  // Subscription Operations
  subscribeToAttendanceChanges(
    cohortId: string,
    callback: (payload: unknown) => void
  ) {
    return this.subscriptionService.subscribeToAttendanceChanges(
      cohortId,
      callback
    );
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
