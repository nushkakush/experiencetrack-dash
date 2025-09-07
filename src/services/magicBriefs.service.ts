import { supabase } from '@/integrations/supabase/client';
import type { MagicBrief } from '@/types/magicBrief';

/**
 * Service for managing magic briefs in the database
 * Focused only on CRUD operations
 */
export class MagicBriefsService {
  /**
   * Get all magic briefs for a specific epic
   */
  static async getMagicBriefs(epicId: string): Promise<MagicBrief[]> {
    const { data, error } = await supabase
      .from('magic_briefs')
      .select('*')
      .eq('epic_id', epicId)
      .order('challenge_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch magic briefs: ${error.message}`);
    }

    // Transform raw_response to rawResponse for frontend compatibility
    const transformedData = (data || []).map(brief => ({
      ...brief,
      rawResponse: brief.raw_response || null
    }));

    return transformedData;
  }

  /**
   * Get a single magic brief by ID
   */
  static async getMagicBrief(briefId: string): Promise<MagicBrief> {
    const { data, error } = await supabase
      .from('magic_briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch magic brief: ${error.message}`);
    }

    // Transform raw_response to rawResponse for frontend compatibility
    return {
      ...data,
      rawResponse: data.raw_response || null
    };
  }

  /**
   * Create multiple magic briefs
   */
  static async createMagicBriefs(
    briefs: Omit<MagicBrief, 'id' | 'created_at' | 'created_by'>[]
  ): Promise<MagicBrief[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const briefsToInsert = briefs.map(brief => {
      const { rawResponse, ...briefData } = brief;
      return {
        ...briefData,
        raw_response: rawResponse, // Transform rawResponse to raw_response for database
        created_by: user?.id,
      };
    });

    const { data, error } = await supabase
      .from('magic_briefs')
      .insert(briefsToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to create magic briefs: ${error.message}`);
    }

    // Transform raw_response back to rawResponse for frontend compatibility
    const transformedData = (data || []).map(brief => ({
      ...brief,
      rawResponse: brief.raw_response || null
    }));

    return transformedData;
  }

  /**
   * Mark a magic brief as expanded
   */
  static async markBriefAsExpanded(
    briefId: string, 
    experienceId: string
  ): Promise<MagicBrief> {
    const { data, error } = await supabase
      .from('magic_briefs')
      .update({
        expanded: true,
        expanded_experience_id: experienceId,
      })
      .eq('id', briefId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark brief as expanded: ${error.message}`);
    }

    // Transform raw_response to rawResponse for frontend compatibility
    return {
      ...data,
      rawResponse: data.raw_response || null
    };
  }

  /**
   * Delete a magic brief
   */
  static async deleteMagicBrief(briefId: string): Promise<void> {
    const { error } = await supabase
      .from('magic_briefs')
      .delete()
      .eq('id', briefId);

    if (error) {
      throw new Error(`Failed to delete magic brief: ${error.message}`);
    }
  }

  /**
   * Update a magic brief with regenerated content
   */
  static async updateMagicBrief(
    briefId: string, 
    updates: Partial<MagicBrief>
  ): Promise<MagicBrief> {
    // Transform rawResponse to raw_response for database
    const { rawResponse, ...updateData } = updates;
    const dbUpdates = {
      ...updateData,
      raw_response: rawResponse,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('magic_briefs')
      .update(dbUpdates)
      .eq('id', briefId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update magic brief: ${error.message}`);
    }

    // Transform raw_response back to rawResponse for frontend compatibility
    return {
      ...data,
      rawResponse: data.raw_response || null
    };
  }

  /**
   * Get raw response from logs for debugging
   */
  static async getRawResponseFromLogs(briefId: string): Promise<any> {
    // This method was referenced in the component but not implemented
    // For now, return null - this would typically fetch from a logging service
    console.warn(`getRawResponseFromLogs called for brief ${briefId} - not implemented`);
    return null;
  }

}
