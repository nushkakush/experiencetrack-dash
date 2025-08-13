import { supabase } from '@/integrations/supabase/client';
import { FeeStructure, Scholarship, NewFeeStructureInput, NewScholarshipInput } from '@/types/fee';
import { Logger } from '@/lib/logging/Logger';

export class FeeStructureService {
  /**
   * Get fee structure for a cohort
   */
  static async getFeeStructure(cohortId: string): Promise<FeeStructure | null> {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .single();

    if (error) {
      Logger.getInstance().error('Error fetching fee structure', { error, cohortId });
      return null;
    }

    return data;
  }

  /**
   * Create or update fee structure
   */
  static async upsertFeeStructure(input: NewFeeStructureInput): Promise<FeeStructure | null> {
    const { data, error } = await supabase
      .from('fee_structures')
      .upsert({
        ...input,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }, {
        onConflict: 'cohort_id'
      })
      .select()
      .single();

    if (error) {
      Logger.getInstance().error('Error upserting fee structure', { error, input });
      return null;
    }

    return data;
  }

  /**
   * Mark fee structure as complete
   */
  static async markFeeStructureComplete(cohortId: string): Promise<boolean> {
    const { error } = await supabase
      .from('fee_structures')
      .update({ is_setup_complete: true })
      .eq('cohort_id', cohortId);

    if (error) {
      Logger.getInstance().error('Error marking fee structure complete', { error, cohortId });
      return false;
    }

    return true;
  }

  /**
   * Get scholarships for a cohort
   */
  static async getScholarships(cohortId: string): Promise<Scholarship[]> {
    const { data, error } = await supabase
      .from('cohort_scholarships')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('start_percentage', { ascending: true });

    if (error) {
      Logger.getInstance().error('Error fetching scholarships', { error, cohortId });
      return [];
    }

    return data || [];
  }

  /**
   * Create scholarship
   */
  static async createScholarship(input: NewScholarshipInput): Promise<Scholarship | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Logger.getInstance().error('No authenticated user found when creating scholarship');
        return null;
      }

      const { data, error } = await supabase
        .from('cohort_scholarships')
        .insert({
          ...input,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        Logger.getInstance().error('Error creating scholarship', { error, input });
        return null;
      }

      return data;
    } catch (error) {
      Logger.getInstance().error('Error in createScholarship', { error, input });
      return null;
    }
  }

  /**
   * Update scholarship
   */
  static async updateScholarship(id: string, input: Partial<NewScholarshipInput>): Promise<Scholarship | null> {
    const { data, error } = await supabase
      .from('cohort_scholarships')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      Logger.getInstance().error('Error updating scholarship', { error, id, input });
      return null;
    }

    return data;
  }

  /**
   * Delete scholarship
   */
  static async deleteScholarship(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('cohort_scholarships')
      .delete()
      .eq('id', id);

    if (error) {
      Logger.getInstance().error('Error deleting scholarship', { error, id });
      return false;
    }

    return true;
  }

  /**
   * Get complete fee structure with scholarships
   */
  static async getCompleteFeeStructure(cohortId: string): Promise<{
    feeStructure: FeeStructure | null;
    scholarships: Scholarship[];
  }> {
    const [feeStructure, scholarships] = await Promise.all([
      this.getFeeStructure(cohortId),
      this.getScholarships(cohortId)
    ]);

    return {
      feeStructure,
      scholarships
    };
  }
}
