import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';
import type {
  UserCohortAssignment,
  CohortAssignmentWithDetails,
  CreateCohortAssignmentInput,
  UpdateCohortAssignmentInput,
  BulkCohortAssignmentInput,
  BulkCohortRemovalInput,
  CohortAssignmentFilters,
  CohortAssignmentStats,
} from '@/types/cohortAssignment';
import type { Cohort } from '@/types/cohort';
import type { UserProfile } from '@/types/auth';

export class CohortAssignmentService {
  /**
   * Assign a cohort to a user
   */
  static async assignCohortToUser(
    input: CreateCohortAssignmentInput,
    assignedByUserId: string
  ): Promise<ApiResponse<UserCohortAssignment>> {
    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('user_cohort_assignments')
        .select('id')
        .eq('user_id', input.user_id)
        .eq('cohort_id', input.cohort_id)
        .single();

      if (existing) {
        // Assignment already exists, return success
        return { data: existing, error: null, success: true };
      }

      // Create new assignment
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .insert({
          user_id: input.user_id,
          cohort_id: input.cohort_id,
          assigned_by: assignedByUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error assigning cohort to user:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * Remove a cohort assignment from a user
   */
  static async removeCohortFromUser(
    userId: string,
    cohortId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_cohort_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error) {
      console.error('Error removing cohort from user:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * Get all assignments for a user
   */
  static async getUserAssignments(
    userId: string
  ): Promise<ApiResponse<CohortAssignmentWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .select(`
          *,
          user:profiles!user_cohort_assignments_user_id_fkey(*),
          cohort:cohorts!user_cohort_assignments_cohort_id_fkey(*),
          assigned_by_user:profiles!user_cohort_assignments_assigned_by_fkey(*)
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting user assignments:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all assignments for a cohort
   */
  static async getCohortAssignments(
    cohortId: string
  ): Promise<ApiResponse<CohortAssignmentWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .select(`
          *,
          user:profiles!user_cohort_assignments_user_id_fkey(*),
          cohort:cohorts!user_cohort_assignments_cohort_id_fkey(*),
          assigned_by_user:profiles!user_cohort_assignments_assigned_by_fkey(*)
        `)
        .eq('cohort_id', cohortId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting cohort assignments:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get assigned cohorts for a user
   */
  static async getAssignedCohortsForUser(
    userId: string
  ): Promise<ApiResponse<Cohort[]>> {
    try {
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .select(`
          cohort:cohorts!user_cohort_assignments_cohort_id_fkey(*)
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      
      const cohorts = data?.map(item => item.cohort).filter(Boolean) || [];
      return { data: cohorts, error: null, success: true };
    } catch (error) {
      console.error('Error getting assigned cohorts for user:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * Get users assigned to a cohort
   */
  static async getUsersForCohort(
    cohortId: string
  ): Promise<ApiResponse<UserProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .select(`
          user:profiles!user_cohort_assignments_user_id_fkey(*)
        `)
        .eq('cohort_id', cohortId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      
      const users = data?.map(item => item.user).filter(Boolean) || [];
      return { data: users, error: null };
    } catch (error) {
      console.error('Error getting users for cohort:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Bulk assign cohorts to users
   */
  static async bulkAssignCohorts(
    input: BulkCohortAssignmentInput,
    assignedByUserId: string
  ): Promise<ApiResponse<number>> {
    try {
      const assignments = [];
      
      for (const userId of input.user_ids) {
        for (const cohortId of input.cohort_ids) {
          assignments.push({
            user_id: userId,
            cohort_id: cohortId,
            assigned_by: assignedByUserId,
          });
        }
      }

      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .upsert(assignments, {
          onConflict: 'user_id,cohort_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return { data: data?.length || 0, error: null, success: true };
    } catch (error) {
      console.error('Error bulk assigning cohorts:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * Bulk remove cohort assignments
   */
  static async bulkRemoveCohorts(
    input: BulkCohortRemovalInput
  ): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .delete()
        .in('user_id', input.user_ids)
        .in('cohort_id', input.cohort_ids)
        .select();

      if (error) throw error;
      return { data: data?.length || 0, error: null, success: true };
    } catch (error) {
      console.error('Error bulk removing cohorts:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStats(): Promise<ApiResponse<CohortAssignmentStats>> {
    try {
      const { data: total } = await supabase
        .from('user_cohort_assignments')
        .select('id', { count: 'exact' });

      const { data: uniqueUsers } = await supabase
        .from('user_cohort_assignments')
        .select('user_id', { count: 'exact', head: true });

      const { data: uniqueCohorts } = await supabase
        .from('user_cohort_assignments')
        .select('cohort_id', { count: 'exact', head: true });

      const stats: CohortAssignmentStats = {
        total_assignments: total?.length || 0,
        users_with_assignments: uniqueUsers?.length || 0,
        cohorts_with_assignments: uniqueCohorts?.length || 0,
      };

      return { data: stats, error: null, success: true };
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  /**
   * Search assignments with filters
   */
  static async searchAssignments(
    filters: CohortAssignmentFilters
  ): Promise<ApiResponse<CohortAssignmentWithDetails[]>> {
    try {
      let query = supabase
        .from('user_cohort_assignments')
        .select(`
          *,
          user:profiles!user_cohort_assignments_user_id_fkey(*),
          cohort:cohorts!user_cohort_assignments_cohort_id_fkey(*),
          assigned_by_user:profiles!user_cohort_assignments_assigned_by_fkey(*)
        `);

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.cohort_id) {
        query = query.eq('cohort_id', filters.cohort_id);
      }
      if (filters.assigned_by) {
        query = query.eq('assigned_by', filters.assigned_by);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query.order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching assignments:', error);
      return { data: null, error: error as Error };
    }
  }
}
