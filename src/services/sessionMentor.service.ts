import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/common';
import type {
  SessionMentorAssignment,
  CreateSessionMentorAssignmentData,
  UpdateSessionMentorAssignmentData,
  SessionMentorAssignmentWithMentor,
  SessionWithMentors,
} from '@/types/sessionMentorAssignment';

export class SessionMentorService {
  /**
   * Get mentor assignments for a specific session
   */
  static async getSessionMentorAssignments(
    sessionId: string
  ): Promise<ApiResponse<SessionMentorAssignmentWithMentor[]>> {
    try {
      const { data, error } = await supabase
        .from('session_mentor_assignments')
        .select(`
          *,
          mentor:mentors!session_mentor_assignments_mentor_id_fkey(
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
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { 
        data: data as SessionMentorAssignmentWithMentor[] || [], 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error fetching session mentor assignments:', error);
      return { 
        data: [], 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Assign mentor to session
   */
  static async assignMentorToSession(
    input: CreateSessionMentorAssignmentData
  ): Promise<ApiResponse<SessionMentorAssignmentWithMentor>> {
    try {
      const { data, error } = await supabase
        .from('session_mentor_assignments')
        .insert({
          session_id: input.session_id,
          mentor_id: input.mentor_id,
          role_type: input.role_type,
          is_epic_master: input.is_epic_master || false,
          is_associate_epic_master: input.is_associate_epic_master || false,
          assigned_by: input.assigned_by,
        })
        .select(`
          *,
          mentor:mentors!session_mentor_assignments_mentor_id_fkey(
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
        data: data as SessionMentorAssignmentWithMentor, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error assigning mentor to session:', error);
      return { 
        data: null as any, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Remove mentor from session
   */
  static async removeMentorFromSession(
    assignmentId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('session_mentor_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      return { 
        data: true, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error removing mentor from session:', error);
      return { 
        data: false, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Update mentor role in session
   */
  static async updateMentorRole(
    assignmentId: string,
    updates: UpdateSessionMentorAssignmentData
  ): Promise<ApiResponse<SessionMentorAssignmentWithMentor>> {
    try {
      const { data, error } = await supabase
        .from('session_mentor_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select(`
          *,
          mentor:mentors!session_mentor_assignments_mentor_id_fkey(
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
        data: data as SessionMentorAssignmentWithMentor, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error updating mentor role:', error);
      return { 
        data: null as any, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Get sessions with mentor assignments for a cohort/epic
   */
  static async getSessionsWithMentors(
    cohortId: string,
    epicId: string
  ): Promise<ApiResponse<SessionWithMentors[]>> {
    try {
      // First get all planned sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('planned_sessions')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .order('session_date', { ascending: true })
        .order('session_number', { ascending: true });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Get all mentor assignments for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: assignments, error: assignmentsError } = await supabase
        .from('session_mentor_assignments')
        .select(`
          *,
          mentor:mentors!session_mentor_assignments_mentor_id_fkey(
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
        .in('session_id', sessionIds);

      if (assignmentsError) throw assignmentsError;

      // Group assignments by session_id
      const assignmentsBySession = (assignments || []).reduce((acc, assignment) => {
        if (!acc[assignment.session_id]) {
          acc[assignment.session_id] = [];
        }
        acc[assignment.session_id].push(assignment as SessionMentorAssignmentWithMentor);
        return acc;
      }, {} as Record<string, SessionMentorAssignmentWithMentor[]>);

      // Combine sessions with their mentor assignments
      const sessionsWithMentors: SessionWithMentors[] = sessions.map(session => ({
        ...session,
        mentor_assignments: assignmentsBySession[session.id] || []
      }));

      return { 
        data: sessionsWithMentors, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error fetching sessions with mentors:', error);
      return { 
        data: [], 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Assign epic master to session (helper method)
   */
  static async assignEpicMasterToSession(
    sessionId: string,
    mentorId: string,
    roleType: 'mentor' | 'trainer' | 'judge',
    isEpicMaster: boolean,
    assignedBy?: string
  ): Promise<ApiResponse<SessionMentorAssignmentWithMentor>> {
    return this.assignMentorToSession({
      session_id: sessionId,
      mentor_id: mentorId,
      role_type: roleType,
      is_epic_master: isEpicMaster,
      is_associate_epic_master: !isEpicMaster,
      assigned_by: assignedBy,
    });
  }

  /**
   * Check if mentor is already assigned to session with specific role
   */
  static async isMentorAssignedToSession(
    sessionId: string,
    mentorId: string,
    roleType: 'mentor' | 'trainer' | 'judge'
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('session_mentor_assignments')
        .select('id')
        .eq('session_id', sessionId)
        .eq('mentor_id', mentorId)
        .eq('role_type', roleType)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which means not assigned
        throw error;
      }

      return { 
        data: !!data, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error checking mentor assignment:', error);
      return { 
        data: false, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }

  /**
   * Get mentor assignments for multiple sessions (batch operation)
   */
  static async getBatchSessionMentorAssignments(
    sessionIds: string[]
  ): Promise<ApiResponse<Record<string, SessionMentorAssignmentWithMentor[]>>> {
    try {
      if (sessionIds.length === 0) {
        return { data: {}, error: null, success: true };
      }

      const { data, error } = await supabase
        .from('session_mentor_assignments')
        .select(`
          *,
          mentor:mentors!session_mentor_assignments_mentor_id_fkey(
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
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by session_id
      const groupedAssignments = (data || []).reduce((acc, assignment) => {
        if (!acc[assignment.session_id]) {
          acc[assignment.session_id] = [];
        }
        acc[assignment.session_id].push(assignment as SessionMentorAssignmentWithMentor);
        return acc;
      }, {} as Record<string, SessionMentorAssignmentWithMentor[]>);

      return { 
        data: groupedAssignments, 
        error: null, 
        success: true 
      };
    } catch (error) {
      console.error('Error fetching batch session mentor assignments:', error);
      return { 
        data: {}, 
        error: (error as Error).message, 
        success: false 
      };
    }
  }
}
