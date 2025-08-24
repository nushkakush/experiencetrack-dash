import { getApiClient } from '@/infrastructure/api/base-api-client';

export class AttendanceSubscriptionService {
  private apiClient = getApiClient();

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
}
