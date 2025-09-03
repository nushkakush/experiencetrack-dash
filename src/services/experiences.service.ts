import { supabase } from '@/integrations/supabase/client';
import type { 
  Experience, 
  CreateExperienceRequest, 
  UpdateExperienceRequest
} from '@/types/experience';

export class ExperiencesService {
  /**
   * Get all experiences with optional search and pagination
   */
  static async getExperiences({
    search,
    type,
    epicId,
    limit = 50,
    offset = 0,
  }: {
    search?: string;
    type?: string;
    epicId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Experience[]; count: number }> {
    let query = supabase
      .from('experiences')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%`);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (epicId) {
      query = query.eq('epic_id', epicId);
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch experiences: ${error.message}`);
    }

    return { data: data || [], count: count || 0 };
  }

  /**
   * Get a single experience by ID
   */
  static async getExperience(id: string): Promise<Experience> {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch experience: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new experience
   */
  static async createExperience(experience: CreateExperienceRequest): Promise<Experience> {
    const { data, error } = await supabase
      .from('experiences')
      .insert({
        ...experience,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create experience: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing experience
   */
  static async updateExperience(experience: UpdateExperienceRequest): Promise<Experience> {
    const { id, ...updateData } = experience;

    const { data, error } = await supabase
      .from('experiences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update experience: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert an experience (create or update)
   */
  static async upsertExperience(experience: CreateExperienceRequest & { id?: string }): Promise<Experience> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (experience.id) {
      // Update existing
      const { data, error } = await supabase
        .from('experiences')
        .update({
          title: experience.title,
          learning_outcomes: experience.learning_outcomes,
          type: experience.type,
          epic_id: experience.epic_id,
          challenge: experience.challenge,
          deliverables: experience.deliverables,
          grading_rubric: experience.grading_rubric,
          pass_conditions: experience.pass_conditions,
          distinction_conditions: experience.distinction_conditions,
          lecture_sessions: experience.lecture_sessions,
          sample_brand_profiles: experience.sample_brand_profiles,
          sample_mentor_profiles: experience.sample_mentor_profiles,
          sample_judge_profiles: experience.sample_judge_profiles,
        })
        .eq('id', experience.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update experience: ${error.message}`);
      }

      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('experiences')
        .insert({
          title: experience.title,
          learning_outcomes: experience.learning_outcomes,
          type: experience.type,
          epic_id: experience.epic_id,
          challenge: experience.challenge,
          deliverables: experience.deliverables,
          grading_rubric: experience.grading_rubric,
          pass_conditions: experience.pass_conditions,
          distinction_conditions: experience.distinction_conditions,
          lecture_sessions: experience.lecture_sessions,
          sample_brand_profiles: experience.sample_brand_profiles,
          sample_mentor_profiles: experience.sample_mentor_profiles,
          sample_judge_profiles: experience.sample_judge_profiles,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create experience: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * Delete an experience
   */
  static async deleteExperience(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete experience: ${error.message}`);
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  static async uploadFile(
    file: File,
    type: 'deliverable' | 'resource' | 'avatar' | 'banner'
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `experiences/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Use existing avatars bucket
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Get experience statistics
   */
  static async getExperienceStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('experiences')
      .select('type');

    if (error) {
      throw new Error(`Failed to fetch experience stats: ${error.message}`);
    }

    const total = data?.length || 0;
    const byType = data?.reduce((acc, exp) => {
      acc[exp.type] = (acc[exp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return { total, byType };
  }
}
