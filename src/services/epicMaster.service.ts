import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/common';
import type {
  EpicMasterAssignment,
  CreateEpicMasterAssignmentData,
  UpdateEpicMasterAssignmentData,
  EpicMasterAssignmentWithMentors,
} from '@/types/epicMasterAssignment';

export class EpicMasterService {
  /**
   * Get epic master assignment for a specific cohort epic
   */
  static async getEpicMasterAssignment(
    cohortEpicId: string
  ): Promise<ApiResponse<EpicMasterAssignmentWithMentors | null>> {
    try {
      const { data, error } = await supabase
        .from('epic_master_assignments')
        .select(`
          *,
          epic_master:mentors!epic_master_assignments_epic_master_id_fkey(
            id,
            first_name,
            last_name,
            email,
            specialization,
            current_company,
            avatar_url,
            status
          ),
          associate_epic_master:mentors!epic_master_assignments_associate_epic_master_id_fkey(
            id,
            first_name,
            last_name,
            email,
            specialization,
            current_company,
            avatar_url,
            status
          )
        `)
        .eq('cohort_epic_id', cohortEpicId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is acceptable
        throw error;
      }

      return { 
        data: data as EpicMasterAssignmentWithMentors | null, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error fetching epic master assignment:', error);
      return { 
        data: null, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Create or update epic master assignment
   */
  static async assignEpicMasters(
    input: CreateEpicMasterAssignmentData
  ): Promise<ApiResponse<EpicMasterAssignmentWithMentors>> {
    try {
      // First, check if assignment already exists
      const existing = await this.getEpicMasterAssignment(input.cohort_epic_id);
      
      let result;
      if (existing.data) {
        // Update existing assignment
        const { data, error } = await supabase
          .from('epic_master_assignments')
          .update({
            epic_master_id: input.epic_master_id,
            associate_epic_master_id: input.associate_epic_master_id,
          })
          .eq('cohort_epic_id', input.cohort_epic_id)
          .select(`
            *,
            epic_master:mentors!epic_master_assignments_epic_master_id_fkey(
              id,
              first_name,
              last_name,
              email,
              specialization,
              current_company,
              avatar_url,
              status
            ),
            associate_epic_master:mentors!epic_master_assignments_associate_epic_master_id_fkey(
              id,
              first_name,
              last_name,
              email,
              specialization,
              current_company,
              avatar_url,
              status
            )
          `)
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new assignment
        const { data, error } = await supabase
          .from('epic_master_assignments')
          .insert({
            cohort_epic_id: input.cohort_epic_id,
            epic_master_id: input.epic_master_id,
            associate_epic_master_id: input.associate_epic_master_id,
            created_by: input.created_by,
          })
          .select(`
            *,
            epic_master:mentors!epic_master_assignments_epic_master_id_fkey(
              id,
              first_name,
              last_name,
              email,
              specialization,
              current_company,
              avatar_url,
              status
            ),
            associate_epic_master:mentors!epic_master_assignments_associate_epic_master_id_fkey(
              id,
              first_name,
              last_name,
              email,
              specialization,
              current_company,
              avatar_url,
              status
            )
          `)
          .single();

        if (error) throw error;
        result = data;
      }

      return { 
        data: result as EpicMasterAssignmentWithMentors, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error assigning epic masters:', error);
      return { 
        data: null as any, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Update epic master assignment
   */
  static async updateEpicMasterAssignment(
    cohortEpicId: string,
    updates: UpdateEpicMasterAssignmentData
  ): Promise<ApiResponse<EpicMasterAssignmentWithMentors>> {
    try {
      const { data, error } = await supabase
        .from('epic_master_assignments')
        .update(updates)
        .eq('cohort_epic_id', cohortEpicId)
        .select(`
          *,
          epic_master:mentors!epic_master_assignments_epic_master_id_fkey(
            id,
            first_name,
            last_name,
            email,
            specialization,
            current_company,
            avatar_url,
            status
          ),
          associate_epic_master:mentors!epic_master_assignments_associate_epic_master_id_fkey(
            id,
            first_name,
            last_name,
            email,
            specialization,
            current_company,
            avatar_url,
            status
          )
        `)
        .single();

      if (error) throw error;

      return { 
        data: data as EpicMasterAssignmentWithMentors, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error updating epic master assignment:', error);
      return { 
        data: null as any, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Remove epic master assignment
   */
  static async removeEpicMasterAssignment(
    cohortEpicId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('epic_master_assignments')
        .delete()
        .eq('cohort_epic_id', cohortEpicId);

      if (error) throw error;

      return { 
        data: true, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error removing epic master assignment:', error);
      return { 
        data: false, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Get all epic master assignments for a cohort
   */
  static async getCohortEpicMasterAssignments(
    cohortId: string
  ): Promise<ApiResponse<EpicMasterAssignmentWithMentors[]>> {
    try {
      const { data, error } = await supabase
        .from('epic_master_assignments')
        .select(`
          *,
          epic_master:mentors!epic_master_assignments_epic_master_id_fkey(
            id,
            first_name,
            last_name,
            email,
            specialization,
            current_company,
            avatar_url,
            status
          ),
          associate_epic_master:mentors!epic_master_assignments_associate_epic_master_id_fkey(
            id,
            first_name,
            last_name,
            email,
            specialization,
            current_company,
            avatar_url,
            status
          ),
          cohort_epic:cohort_epics!epic_master_assignments_cohort_epic_id_fkey(*)
        `)
        .eq('cohort_epic.cohort_id', cohortId);

      if (error) throw error;

      return { 
        data: data as EpicMasterAssignmentWithMentors[] || [], 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error fetching cohort epic master assignments:', error);
      return { 
        data: [], 
        error: (error as Error).message, 
        success: false 
      };
    }
  }
}
