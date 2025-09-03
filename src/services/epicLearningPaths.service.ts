import { supabase } from '@/integrations/supabase/client';
import type { 
  EpicLearningPath, 
  CreateEpicLearningPathRequest, 
  UpdateEpicLearningPathRequest,
  EpicLearningPathWithDetails,
  EpicInPath 
} from '@/types/epicLearningPath';
import type { Epic } from '@/types/epic';

export class EpicLearningPathsService {
  /**
   * Get all epic learning paths with optional search and pagination
   */
  static async getEpicLearningPaths({
    search,
    limit = 50,
    offset = 0,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: EpicLearningPath[]; count: number }> {
    let query = supabase
      .from('epic_learning_paths')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch epic learning paths: ${error.message}`);
    }

    return { data: data || [], count: count || 0 };
  }

  /**
   * Get a single epic learning path by ID
   */
  static async getEpicLearningPath(id: string): Promise<EpicLearningPath> {
    const { data, error } = await supabase
      .from('epic_learning_paths')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch epic learning path: ${error.message}`);
    }

    return data;
  }

  /**
   * Get epic learning path with detailed epic information
   */
  static async getEpicLearningPathWithDetails(id: string): Promise<EpicLearningPathWithDetails> {
    const learningPath = await this.getEpicLearningPath(id);
    
    if (learningPath.epics.length === 0) {
      return {
        ...learningPath,
        epics: []
      };
    }

    // Get epic details for all epics in the learning path
    const epicIds = learningPath.epics.map(epic => epic.id);
    const { data: epics, error } = await supabase
      .from('epics')
      .select('id, name, description, avatar_url')
      .in('id', epicIds);

    if (error) {
      throw new Error(`Failed to fetch epic details: ${error.message}`);
    }

    // Combine learning path epics with their details, maintaining order
    const epicsWithDetails = learningPath.epics
      .map(epicInPath => {
        const epicDetails = epics?.find(epic => epic.id === epicInPath.id);
        return {
          ...epicInPath,
          name: epicDetails?.name || 'Unknown Epic',
          description: epicDetails?.description,
          avatar_url: epicDetails?.avatar_url,
        };
      })
      .sort((a, b) => a.order - b.order);

    return {
      ...learningPath,
      epics: epicsWithDetails
    };
  }

  /**
   * Create a new epic learning path
   */
  static async createEpicLearningPath(learningPath: CreateEpicLearningPathRequest): Promise<EpicLearningPath> {
    const { data, error } = await supabase
      .from('epic_learning_paths')
      .insert({
        ...learningPath,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create epic learning path: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert an epic learning path (create or update)
   */
  static async upsertEpicLearningPath(learningPath: CreateEpicLearningPathRequest & { id?: string }): Promise<EpicLearningPath> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (learningPath.id) {
      // Update existing
      const { data, error } = await supabase
        .from('epic_learning_paths')
        .update({
          title: learningPath.title,
          description: learningPath.description,
          outcomes: learningPath.outcomes,
          avatar_url: learningPath.avatar_url,
          banner_url: learningPath.banner_url,
          epics: learningPath.epics,
        })
        .eq('id', learningPath.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update epic learning path: ${error.message}`);
      }

      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('epic_learning_paths')
        .insert({
          title: learningPath.title,
          description: learningPath.description,
          outcomes: learningPath.outcomes,
          avatar_url: learningPath.avatar_url,
          banner_url: learningPath.banner_url,
          epics: learningPath.epics,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create epic learning path: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * Update an existing epic learning path
   */
  static async updateEpicLearningPath(learningPath: UpdateEpicLearningPathRequest): Promise<EpicLearningPath> {
    const { id, ...updateData } = learningPath;

    const { data, error } = await supabase
      .from('epic_learning_paths')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update epic learning path: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an epic learning path
   */
  static async deleteEpicLearningPath(id: string): Promise<void> {
    const { error } = await supabase
      .from('epic_learning_paths')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete epic learning path: ${error.message}`);
    }
  }

  /**
   * Get all available epics for selection
   */
  static async getAvailableEpics(): Promise<Epic[]> {
    const { data, error } = await supabase
      .from('epics')
      .select('id, name, description, avatar_url')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch available epics: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(
    file: File,
    type: 'avatar' | 'banner'
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `epic-learning-paths/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Use existing avatars bucket
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Reorder epics in a learning path
   */
  static async reorderEpics(
    learningPathId: string, 
    epics: EpicInPath[]
  ): Promise<EpicLearningPath> {
    const { data, error } = await supabase
      .from('epic_learning_paths')
      .update({ epics })
      .eq('id', learningPathId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reorder epics: ${error.message}`);
    }

    return data;
  }
}
