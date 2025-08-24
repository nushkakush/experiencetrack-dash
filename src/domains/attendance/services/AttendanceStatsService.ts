import { ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import {
  AttendanceRecord,
  AttendanceStats,
  AttendanceFilters,
  StudentStats,
} from './types/AttendanceTypes';
import { AttendanceQueryService } from './AttendanceQueryService';

export class AttendanceStatsService {
  private logger = Logger.getInstance();
  private queryService: AttendanceQueryService;

  constructor(queryService: AttendanceQueryService) {
    this.queryService = queryService;
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

      const attendanceResult =
        await this.queryService.getAttendanceRecords(filters);
      if (!attendanceResult.success) {
        return attendanceResult as ApiResponse<AttendanceStats>;
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

  // Helper methods for statistics calculation
  private calculateTotalSessions(records: AttendanceRecord[]): number {
    const uniqueSessions = new Set(
      records.map(r => `${r.epic_id}-${r.session_number}-${r.session_date}`)
    );
    return uniqueSessions.size;
  }

  private calculateAverageAttendance(records: AttendanceRecord[]): number {
    if (records.length === 0) return 0;
    const presentAndLate = records.filter(
      r => r.status === 'present' || r.status === 'late'
    ).length;
    return Math.round((presentAndLate / records.length) * 100);
  }

  private calculatePerfectAttendance(records: AttendanceRecord[]): number {
    // Group by student and calculate their attendance percentage
    const studentStats = this.groupByStudent(records);
    return Object.values(studentStats).filter(
      student => student.percentage === 100
    ).length;
  }

  private calculatePoorAttendance(records: AttendanceRecord[]): number {
    const studentStats = this.groupByStudent(records);
    return Object.values(studentStats).filter(
      student => student.percentage < 75
    ).length;
  }

  private groupByStudent(
    records: AttendanceRecord[]
  ): Record<string, StudentStats> {
    const studentMap: Record<string, StudentStats> = {};

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
      student.percentage =
        student.total > 0
          ? Math.round((student.present / student.total) * 100)
          : 0;
    });

    return studentMap;
  }
}
