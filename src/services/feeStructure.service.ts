import { supabase } from '@/integrations/supabase/client';
import { FeeStructure, Scholarship, NewFeeStructureInput, NewScholarshipInput } from '@/types/fee';
import { Logger } from '@/lib/logging/Logger';

export class FeeStructureService {
  /**
   * Resolve fee structure for a cohort/student with override-awareness
   * - If studentId provided, prefer custom row for that student; else fallback to cohort row
   */
  static async resolveFeeStructure(cohortId: string, studentId?: string): Promise<FeeStructure | null> {
    try {
      if (studentId) {
        const { data: customFs, error: customErr } = await supabase
          .from('fee_structures')
          .select('*')
          .eq('cohort_id', cohortId)
          .eq('structure_type', 'custom')
          .eq('student_id', studentId)
          .maybeSingle();
        if (!customErr && customFs) return customFs as FeeStructure;
      }
      const { data: cohortFs } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('structure_type', 'cohort')
        .maybeSingle();
      return (cohortFs as FeeStructure) || null;
    } catch (error) {
      Logger.getInstance().error('resolveFeeStructure failed', { error, cohortId, studentId });
      return null;
    }
  }
  /**
   * Get fee structure for a cohort
   */
  static async getFeeStructure(cohortId: string): Promise<FeeStructure | null> {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort')
      .maybeSingle();

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
        // default to cohort scope for existing calls
        structure_type: 'cohort' as any,
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
   * Create or replace a custom plan for a specific student by cloning the cohort plan
   */
  static async createCustomPlanFromCohort(cohortId: string, studentId: string): Promise<FeeStructure | null> {
    try {
      const { data: cohortFs, error: fsErr } = await supabase
        .from('fee_structures')
        .select('cohort_id, admission_fee, total_program_fee, number_of_semesters, instalments_per_semester, one_shot_discount_percentage')
        .eq('cohort_id', cohortId)
        .eq('structure_type', 'cohort')
        .single();
      if (fsErr || !cohortFs) {
        Logger.getInstance().error('No cohort fee structure found to clone', { fsErr, cohortId, studentId });
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('fee_structures')
        .upsert({
          cohort_id: cohortId,
          student_id: studentId,
          structure_type: 'custom' as any,
          admission_fee: cohortFs.admission_fee,
          total_program_fee: cohortFs.total_program_fee,
          number_of_semesters: cohortFs.number_of_semesters,
          instalments_per_semester: cohortFs.instalments_per_semester,
          one_shot_discount_percentage: cohortFs.one_shot_discount_percentage,
          custom_dates_enabled: false,
          payment_schedule_dates: {},
          created_by: user?.id,
        }, { onConflict: 'cohort_id,student_id' })
        .select()
        .single();

      if (error) {
        Logger.getInstance().error('Error upserting custom plan', { error, cohortId, studentId });
        return null;
      }
      return data as FeeStructure;
    } catch (error) {
      Logger.getInstance().error('createCustomPlanFromCohort failed', { error, cohortId, studentId });
      return null;
    }
  }

  /** Update custom plan dates (and toggle enabled flag) */
  static async updateCustomPlanDates(
    cohortId: string,
    studentId: string,
    paymentScheduleDates: Record<string, unknown>,
    enabled = true,
  ): Promise<boolean> {
    const { error } = await supabase
      .from('fee_structures')
      .update({
        custom_dates_enabled: enabled,
        payment_schedule_dates: paymentScheduleDates as any,
      })
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'custom')
      .eq('student_id', studentId);
    if (error) {
      Logger.getInstance().error('updateCustomPlanDates failed', { error, cohortId, studentId });
      return false;
    }
    return true;
  }

  /** Update cohort plan dates (and toggle enabled flag) */
  static async updateCohortPlanDates(
    cohortId: string,
    paymentScheduleDates: Record<string, unknown>,
    enabled = true,
  ): Promise<boolean> {
    const { error } = await supabase
      .from('fee_structures')
      .update({
        custom_dates_enabled: enabled,
        payment_schedule_dates: paymentScheduleDates as any,
      })
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort');
    if (error) {
      Logger.getInstance().error('updateCohortPlanDates failed', { error, cohortId });
      return false;
    }
    return true;
  }

  /** Delete a custom plan so student falls back to cohort plan */
  static async deleteCustomPlan(cohortId: string, studentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'custom')
      .eq('student_id', studentId);
    if (error) {
      Logger.getInstance().error('deleteCustomPlan failed', { error, cohortId, studentId });
      return false;
    }
    return true;
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
