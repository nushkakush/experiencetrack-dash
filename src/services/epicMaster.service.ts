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
   * Helper function to fetch mentor details
   */
  private static async fetchMentorDetails(mentorId: string) {
    const { data, error } = await supabase
      .from('mentors')
      .select(
        'id, first_name, last_name, email, specialization, current_company, avatar_url, status'
      )
      .eq('id', mentorId)
      .single();

    if (error) {
      console.error('Error fetching mentor details:', error);
      return null;
    }

    return data;
  }

  /**
   * Get epic master assignment for a specific cohort epic
   */
  static async getEpicMasterAssignment(
    cohortEpicId: string
  ): Promise<ApiResponse<EpicMasterAssignmentWithMentors | null>> {
    try {
      // First, get the epic master assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('epic_master_assignments')
        .select('*')
        .eq('cohort_epic_id', cohortEpicId)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is acceptable
        throw assignmentError;
      }

      if (!assignment) {
        return {
          data: null,
          error: null,
          success: true,
        };
      }

      // Get the epic master details
      const epicMaster = await this.fetchMentorDetails(
        assignment.epic_master_id
      );

      // Get the associate epic master details
      const associateEpicMaster = await this.fetchMentorDetails(
        assignment.associate_epic_master_id
      );

      const result: EpicMasterAssignmentWithMentors = {
        ...assignment,
        epic_master: epicMaster,
        associate_epic_master: associateEpicMaster,
      };

      return {
        data: result,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching epic master assignment:', error);
      return {
        data: null,
        error: (error as Error).message,
        success: false,
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
          .select('*')
          .single();

        if (error) throw error;

        // Fetch mentor details separately
        const epicMaster = await this.fetchMentorDetails(data.epic_master_id);
        const associateEpicMaster = await this.fetchMentorDetails(
          data.associate_epic_master_id
        );

        result = {
          ...data,
          epic_master: epicMaster,
          associate_epic_master: associateEpicMaster,
        };
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
          .select('*')
          .single();

        if (error) throw error;

        // Fetch mentor details separately
        const epicMaster = await this.fetchMentorDetails(data.epic_master_id);
        const associateEpicMaster = await this.fetchMentorDetails(
          data.associate_epic_master_id
        );

        result = {
          ...data,
          epic_master: epicMaster,
          associate_epic_master: associateEpicMaster,
        };
      }

      return {
        data: result as EpicMasterAssignmentWithMentors,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error assigning epic masters:', error);
      return {
        data: null as any,
        error: (error as Error).message,
        success: false,
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
        .select('*')
        .single();

      if (error) throw error;

      // Fetch mentor details separately
      const epicMaster = await this.fetchMentorDetails(data.epic_master_id);
      const associateEpicMaster = await this.fetchMentorDetails(
        data.associate_epic_master_id
      );

      const result = {
        ...data,
        epic_master: epicMaster,
        associate_epic_master: associateEpicMaster,
      };

      return {
        data: result as EpicMasterAssignmentWithMentors,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error updating epic master assignment:', error);
      return {
        data: null as any,
        error: (error as Error).message,
        success: false,
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
        success: true,
      };
    } catch (error) {
      console.error('Error removing epic master assignment:', error);
      return {
        data: false,
        error: (error as Error).message,
        success: false,
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
        .select(
          `
          *,
          cohort_epic:cohort_epics!epic_master_assignments_cohort_epic_id_fkey(*)
        `
        )
        .eq('cohort_epic.cohort_id', cohortId);

      if (error) throw error;

      // Fetch mentor details for each assignment
      const assignmentsWithMentors = await Promise.all(
        (data || []).map(async assignment => {
          const epicMaster = await this.fetchMentorDetails(
            assignment.epic_master_id
          );
          const associateEpicMaster = await this.fetchMentorDetails(
            assignment.associate_epic_master_id
          );

          return {
            ...assignment,
            epic_master: epicMaster,
            associate_epic_master: associateEpicMaster,
          };
        })
      );

      return {
        data: assignmentsWithMentors as EpicMasterAssignmentWithMentors[],
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching cohort epic master assignments:', error);
      return {
        data: [],
        error: (error as Error).message,
        success: false,
      };
    }
  }
}
