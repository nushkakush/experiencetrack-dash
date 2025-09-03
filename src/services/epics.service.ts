import { supabase } from '@/integrations/supabase/client';
import type { Epic, CreateEpicRequest, UpdateEpicRequest } from '@/types/epic';

export class EpicsService {
  /**
   * Get all epics with optional search and pagination
   */
  static async getEpics({
    search,
    limit = 50,
    offset = 0,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Epic[]; count: number }> {
    let query = supabase
      .from('epics')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch epics: ${error.message}`);
    }

    return { data: data || [], count: count || 0 };
  }

  /**
   * Get a single epic by ID
   */
  static async getEpic(id: string): Promise<Epic> {
    const { data, error } = await supabase
      .from('epics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch epic: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new epic
   */
  static async createEpic(epic: CreateEpicRequest): Promise<Epic> {
    const { data, error } = await supabase
      .from('epics')
      .insert({
        ...epic,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create epic: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing epic
   */
  static async updateEpic(epic: UpdateEpicRequest): Promise<Epic> {
    const { id, ...updateData } = epic;

    const { data, error } = await supabase
      .from('epics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update epic: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an epic
   */
  static async deleteEpic(id: string): Promise<void> {
    const { error } = await supabase
      .from('epics')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete epic: ${error.message}`);
    }
  }

  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(
    file: File,
    type: 'avatar' | 'banner'
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `epics/${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Use existing avatars bucket for now
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
}
