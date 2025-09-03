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

    return data || [];
  }

  /**
   * Create multiple magic briefs
   */
  static async createMagicBriefs(
    briefs: Omit<MagicBrief, 'id' | 'created_at' | 'created_by'>[]
  ): Promise<MagicBrief[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const briefsToInsert = briefs.map(brief => ({
      ...brief,
      created_by: user?.id,
    }));

    const { data, error } = await supabase
      .from('magic_briefs')
      .insert(briefsToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to create magic briefs: ${error.message}`);
    }

    return data || [];
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

    return data;
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
   * Get all existing brand names from magic briefs database
   */
  static async getAllExistingBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('magic_briefs')
      .select('brand_name')
      .not('brand_name', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch existing brands: ${error.message}`);
    }

    // Extract unique brand names and normalize them
    const brands = new Set<string>();
    data?.forEach(brief => {
      if (brief.brand_name) {
        brands.add(brief.brand_name.trim());
      }
    });

    return Array.from(brands);
  }
}
