import { supabase } from '@/integrations/supabase/client';
// Temporarily comment out imports to debug
// import type {
//   SessionStatsParams,
//   EpicStatsParams,
//   CalendarDataParams,
//   LeaderboardParams,
//   StudentStatsParams,
//   StudentStreaksParams,
//   PublicLeaderboardParams,
//   SessionStats,
//   EpicStats,
//   CalendarData,
//   LeaderboardData,
//   StudentStats,
//   StudentStreaksData
// } from '@/types/attendance';

export interface AttendanceCalculationResponse<T = any> {
  success: boolean;
  data: T;
  metadata: {
    calculationTime: string;
    dataSource: string;
    filters?: any;
    action?: string;
    error?: boolean;
  };
  error?: string;
}

export class AttendanceCalculationsService {
  private static readonly EDGE_FUNCTION_URL =
    'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/attendance-calculations';

  /**
   * Call the attendance calculations edge function
   */
  private static async callEdgeFunction<T>(
    action: string,
    params: any
  ): Promise<AttendanceCalculationResponse<T>> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session: ' + sessionError.message);
      }

      if (!session) {
        console.error('No session found');
        throw new Error('User not authenticated. Please log in and try again.');
      }

      if (!session.access_token) {
        console.error('No access token in session');
        throw new Error('No access token available. Please log in again.');
      }

      const requestBody = { action, params };
      console.log('Edge function request:', {
        url: this.EDGE_FUNCTION_URL,
        action,
        params: JSON.stringify(params, null, 2),
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        accessTokenLength: session?.access_token?.length || 0,
      });

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log('Edge function success response:', result);
      return result;
    } catch (error) {
      console.error('Attendance calculation error:', error);
      throw error;
    }
  }

  // ==================== ADMIN DASHBOARD METHODS ====================

  /**
   * Get session statistics for a specific session
   */
  static async getSessionStats(params: any): Promise<any> {
    const response = await this.callEdgeFunction<any>(
      'getSessionStats',
      params
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get session stats');
    }

    return response.data;
  }

  /**
   * Get epic statistics for a cohort epic
   */
  static async getEpicStats(params: any): Promise<any> {
    const response = await this.callEdgeFunction<any>('getEpicStats', params);

    if (!response.success) {
      throw new Error(response.error || 'Failed to get epic stats');
    }

    return response.data;
  }

  /**
   * Get calendar data for a specific month
   */
  static async getCalendarData(
    params: CalendarDataParams
  ): Promise<CalendarData> {
    const response = await this.callEdgeFunction<CalendarData>(
      'getCalendarData',
      params
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get calendar data');
    }

    return response.data;
  }

  /**
   * Get leaderboard data for a cohort epic
   */
  static async getLeaderboard(
    params: LeaderboardParams
  ): Promise<LeaderboardData> {
    const response = await this.callEdgeFunction<LeaderboardData>(
      'getLeaderboard',
      params
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get leaderboard');
    }

    return response.data;
  }

  // ==================== STUDENT DASHBOARD METHODS ====================

  /**
   * Get student statistics for a specific student
   */
  static async getStudentStats(
    params: StudentStatsParams
  ): Promise<StudentStats> {
    const response = await this.callEdgeFunction<StudentStats>(
      'getStudentStats',
      params
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get student stats');
    }

    return response.data;
  }

  /**
   * Get student streaks (for specific student or all students)
   */
  static async getStudentStreaks(
    params: StudentStreaksParams
  ): Promise<StudentStreaksData> {
    const response = await this.callEdgeFunction<StudentStreaksData>(
      'getStudentStreaks',
      params
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get student streaks');
    }

    return response.data;
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Get public leaderboard (with privacy controls)
   */
  static async getPublicLeaderboard(
    params: PublicLeaderboardParams
  ): Promise<LeaderboardData> {
    const response = await this.callEdgeFunction<LeaderboardData>(
      'getPublicLeaderboard',
      params
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get public leaderboard');
    }

    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get top streak information (convenience method)
   */
  static async getTopStreak(
    cohortId: string,
    epicId: string
  ): Promise<{
    value: number;
    studentNames: string[];
  }> {
    const streaks = await this.getStudentStreaks({ cohortId, epicId });
    return streaks.topStreak;
  }

  /**
   * Get student rank (convenience method)
   */
  static async getStudentRank(
    cohortId: string,
    epicId: string,
    studentId: string
  ): Promise<{ rank: number; rankOutOf: number }> {
    const stats = await this.getStudentStats({ cohortId, epicId, studentId });
    return { rank: stats.rank, rankOutOf: stats.rankOutOf };
  }

  /**
   * Get attendance percentage for a session (convenience method)
   */
  static async getSessionAttendancePercentage(
    cohortId: string,
    epicId: string,
    sessionDate: string,
    sessionNumber: number
  ): Promise<number> {
    const stats = await this.getSessionStats({
      cohortId,
      epicId,
      sessionDate,
      sessionNumber,
    });
    return stats.attendancePercentage;
  }

  /**
   * Check if edge function is available
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getSessionStats', params: {} }),
      });

      return response.status !== 404; // 404 means function doesn't exist
    } catch (error) {
      console.warn(
        'Attendance calculations edge function not available:',
        error
      );
      return false;
    }
  }

  /**
   * Get metadata about the calculation (useful for debugging)
   */
  static async getCalculationMetadata(
    action: string,
    params: any
  ): Promise<AttendanceCalculationResponse['metadata']> {
    const response = await this.callEdgeFunction(action, params);
    return response.metadata;
  }
}

// Export convenience functions for easier usage
export const attendanceCalculations = {
  // Admin methods
  getSessionStats: AttendanceCalculationsService.getSessionStats.bind(
    AttendanceCalculationsService
  ),
  getEpicStats: AttendanceCalculationsService.getEpicStats.bind(
    AttendanceCalculationsService
  ),
  getCalendarData: AttendanceCalculationsService.getCalendarData.bind(
    AttendanceCalculationsService
  ),
  getLeaderboard: AttendanceCalculationsService.getLeaderboard.bind(
    AttendanceCalculationsService
  ),

  // Student methods
  getStudentStats: AttendanceCalculationsService.getStudentStats.bind(
    AttendanceCalculationsService
  ),
  getStudentStreaks: AttendanceCalculationsService.getStudentStreaks.bind(
    AttendanceCalculationsService
  ),

  // Public methods
  getPublicLeaderboard: AttendanceCalculationsService.getPublicLeaderboard.bind(
    AttendanceCalculationsService
  ),

  // Utility methods
  getTopStreak: AttendanceCalculationsService.getTopStreak.bind(
    AttendanceCalculationsService
  ),
  getStudentRank: AttendanceCalculationsService.getStudentRank.bind(
    AttendanceCalculationsService
  ),
  getSessionAttendancePercentage:
    AttendanceCalculationsService.getSessionAttendancePercentage.bind(
      AttendanceCalculationsService
    ),
  healthCheck: AttendanceCalculationsService.healthCheck.bind(
    AttendanceCalculationsService
  ),
  getCalculationMetadata:
    AttendanceCalculationsService.getCalculationMetadata.bind(
      AttendanceCalculationsService
    ),
};

export default AttendanceCalculationsService;
