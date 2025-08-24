import { getApiClient, ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import { SessionInfo } from './types/AttendanceTypes';

export class SessionManagementService {
  private apiClient = getApiClient();
  private logger = Logger.getInstance();

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
}
