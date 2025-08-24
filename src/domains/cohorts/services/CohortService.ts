/**
 * Cohort Domain Service
 * Handles all cohort-related business logic and data access
 */

import { getApiClient, ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent } from '@/types/cohort';

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  max_students?: number;
  created_at: string;
  updated_at: string;
}

export interface CohortFilters {
  status?: 'active' | 'completed' | 'cancelled';
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface CohortStats {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  droppedStudents: number;
  averageAttendance: number;
}

export class CohortService {
  private apiClient = getApiClient();
  private logger = Logger.getInstance();

  /**
   * Fetch all cohorts with optional filtering
   */
  async getCohorts(filters: CohortFilters = {}): Promise<ApiResponse<Cohort[]>> {
    try {
      let query = this.apiClient.select('cohorts');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const result = await query.order('created_at', { ascending: false });

      return {
        data: result.data as Cohort[],
        error: result.error?.message || null,
        success: !result.error,
      };
    } catch (error) {
      this.logger.error('Failed to fetch cohorts', { error, filters });
      return {
        data: null,
        error: 'Failed to fetch cohorts',
        success: false,
      };
    }
  }

  /**
   * Get a single cohort by ID
   */
  async getCohortById(cohortId: string): Promise<ApiResponse<Cohort>> {
    return this.apiClient.query(
      () => this.apiClient.select('cohorts').eq('id', cohortId).maybeSingle(),
      { cache: true }
    );
  }

  /**
   * Create a new cohort
   */
  async createCohort(cohortData: Omit<Cohort, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Cohort>> {
    return this.apiClient.insert('cohorts', {
      ...cohortData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Update an existing cohort
   */
  async updateCohort(cohortId: string, updates: Partial<Cohort>): Promise<ApiResponse<Cohort>> {
    return this.apiClient.update(
      'cohorts',
      {
        ...updates,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', cohortId)
    );
  }

  /**
   * Delete a cohort
   */
  async deleteCohort(cohortId: string): Promise<ApiResponse<Cohort>> {
    return this.apiClient.delete(
      'cohorts',
      (query) => query.eq('id', cohortId)
    );
  }

  /**
   * Get students in a cohort
   */
  async getCohortStudents(cohortId: string): Promise<ApiResponse<CohortStudent[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('cohort_students', `
          *,
          student:students(*)
        `)
        .eq('cohort_id', cohortId)
        .neq('dropped_out_status', 'dropped_out')
        .order('created_at', { ascending: false }),
      { cache: true }
    );
  }

  /**
   * Add student to cohort
   */
  async addStudentToCohort(cohortId: string, studentId: string): Promise<ApiResponse<any>> {
    return this.apiClient.insert('cohort_students', {
      cohort_id: cohortId,
      student_id: studentId,
      dropped_out_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Remove student from cohort
   */
  async removeStudentFromCohort(cohortId: string, studentId: string): Promise<ApiResponse<any>> {
    return this.apiClient.update(
      'cohort_students',
      {
        dropped_out_status: 'dropped_out',
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('cohort_id', cohortId).eq('student_id', studentId)
    );
  }

  /**
   * Get cohort statistics
   */
  async getCohortStats(cohortId: string): Promise<ApiResponse<CohortStats>> {
    try {
      // This would be better implemented as a database view or function
      const [studentsResult, attendanceResult] = await Promise.all([
        this.getCohortStudents(cohortId),
        this.getCohortAttendanceStats(cohortId),
      ]);

      if (!studentsResult.success) {
        return studentsResult as any;
      }

      const students = studentsResult.data || [];
      const stats: CohortStats = {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.dropped_out_status === 'active').length,
        completedStudents: 0, // Not applicable in new structure
        droppedStudents: students.filter(s => s.dropped_out_status === 'dropped_out').length,
        averageAttendance: attendanceResult.data?.averageAttendance || 0,
      };

      return {
        data: stats,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to fetch cohort stats', { error, cohortId });
      return {
        data: null,
        error: 'Failed to fetch cohort statistics',
        success: false,
      };
    }
  }

  /**
   * Get cohort attendance statistics
   */
  private async getCohortAttendanceStats(cohortId: string): Promise<ApiResponse<{ averageAttendance: number }>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('attendance', 'AVG(attendance_percentage)')
        .eq('cohort_id', cohortId)
        .maybeSingle(),
      { cache: true }
    );
  }

  /**
   * Search cohorts by name or description
   */
  async searchCohorts(searchTerm: string, limit = 10): Promise<ApiResponse<Cohort[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('cohorts')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('name'),
      { cache: true }
    );
  }

  /**
   * Get active cohorts
   */
  async getActiveCohorts(): Promise<ApiResponse<Cohort[]>> {
    return this.getCohorts({ status: 'active' });
  }

  /**
   * Archive a cohort (soft delete)
   */
  async archiveCohort(cohortId: string): Promise<ApiResponse<Cohort>> {
    return this.updateCohort(cohortId, { status: 'cancelled' });
  }

  /**
   * Subscribe to cohort changes
   */
  subscribeToCohortChanges(cohortId: string, callback: (payload: any) => void) {
    const channel = this.apiClient.createChannel(`cohort-${cohortId}`);
    
    channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cohorts',
          filter: `id=eq.${cohortId}`
        }, 
        callback
      )
      .subscribe();

    return () => {
      this.apiClient.removeChannel(`cohort-${cohortId}`);
    };
  }
}

// Singleton instance
let cohortServiceInstance: CohortService | null = null;

export const getCohortService = (): CohortService => {
  if (!cohortServiceInstance) {
    cohortServiceInstance = new CohortService();
  }
  return cohortServiceInstance;
};

export const cohortService = getCohortService();
