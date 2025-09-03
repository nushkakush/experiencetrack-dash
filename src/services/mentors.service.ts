import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/common';
import type { UserProfile } from '@/types/auth';
import type {
  Mentor,
  CreateMentorData,
  UpdateMentorData,
} from '@/types/mentor';

export class MentorsService {
  // ================= Existing calendar-facing helpers (preserve behavior) =================
  /**
   * Get mentors assigned to a specific cohort
   */
  static async getCohortMentors(cohortId: string): Promise<ApiResponse<UserProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('user_cohort_assignments')
        .select(`
          user:profiles!user_cohort_assignments_user_id_fkey (
            user_id,
            first_name,
            last_name,
            email,
            avatar_url,
            role
          )
        `)
        .eq('cohort_id', cohortId)
        .eq('user.role', 'mentor_manager');

      if (error) throw error;

      const mentors = data?.map(item => {
        if (!item || !item.user) return null;
        return {
          id: item.user.user_id,
          first_name: item.user.first_name,
          last_name: item.user.last_name,
          email: item.user.email,
          avatar_url: item.user.avatar_url,
          role: item.user.role,
        };
      }).filter(mentor => mentor && mentor.id && mentor.first_name) || [];
      
      return { data: mentors, error: null, success: true };
    } catch (error) {
      console.error('Error fetching cohort mentors:', error);
      return { data: null, error: (error as Error).message, success: false };
    }
  }

  /**
   * Get all mentors (for fallback when no cohort-specific mentors)
   */
  static async getAllMentors(): Promise<ApiResponse<UserProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url, role')
        .eq('role', 'mentor_manager')
        .limit(4);

      if (error) throw error;
      
      const mentors = data?.map(profile => {
        if (!profile || !profile.user_id) return null;
        return {
          id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: profile.role,
        };
      }).filter(mentor => mentor && mentor.id && mentor.first_name) || [];
      
      return { data: mentors, error: null, success: true };
    } catch (error) {
      console.error('Error fetching all mentors:', error);
      return { data: null, error: (error as Error).message, success: false };
    }
  }

  // ================= New mentors table CRUD (internal) =================

  static async listMentors(): Promise<ApiResponse<Mentor[]>> {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: (data as Mentor[]) || [], error: null, success: true };
    } catch (error: any) {
      console.error('Error listing mentors:', error);
      return { data: [], error: error.message || 'Unknown error', success: false };
    }
  }

  static async createMentor(
    input: CreateMentorData,
    createdByUserId: string
  ): Promise<ApiResponse<Mentor>> {
    try {
      const payload = {
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone ?? null,
        specialization: input.specialization ?? null,
        experience_years: input.experience_years ?? null,
        current_company: input.current_company ?? null,
        designation: input.designation ?? null,
        linkedin_url: input.linkedin_url ?? null,
        bio: input.bio ?? null,
        avatar_url: input.avatar_url ?? null,
        internal_notes: input.internal_notes ?? null,
        created_by: createdByUserId || null,
      };

      const { data, error } = await supabase
        .from('mentors')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return { data: data as Mentor, error: null, success: true };
    } catch (error: any) {
      console.error('Error creating mentor:', error);
      return { data: null as any, error: error.message || 'Unknown error', success: false };
    }
  }

  static async updateMentor(
    mentorId: string,
    updates: UpdateMentorData
  ): Promise<ApiResponse<Mentor>> {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .update({ ...updates })
        .eq('id', mentorId)
        .select('*')
        .single();

      if (error) throw error;
      return { data: data as Mentor, error: null, success: true };
    } catch (error: any) {
      console.error('Error updating mentor:', error);
      return { data: null as any, error: error.message || 'Unknown error', success: false };
    }
  }

  static async setMentorStatus(
    mentorId: string,
    status: Mentor['status']
  ): Promise<ApiResponse<Mentor>> {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .update({ status })
        .eq('id', mentorId)
        .select('*')
        .single();

      if (error) throw error;
      return { data: data as Mentor, error: null, success: true };
    } catch (error: any) {
      console.error('Error setting mentor status:', error);
      return { data: null as any, error: error.message || 'Unknown error', success: false };
    }
  }

  static async deleteMentor(mentorId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('mentors')
        .delete()
        .eq('id', mentorId);

      if (error) throw error;
      return { data: null, error: null, success: true };
    } catch (error: any) {
      console.error('Error deleting mentor:', error);
      return { data: null, error: error.message || 'Unknown error', success: false };
    }
  }
}
