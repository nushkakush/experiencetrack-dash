import { supabase } from '@/integrations/supabase/client';
import { FeeStructure, FeeStructureInsert, FeeStructureUpdate } from '@/types/payments/FeeStructureTypes';
import { PaymentScheduleOverrides } from './payments/PaymentScheduleOverrides';

export class FeeStructureService {
  static async upsertFeeStructure(feeStructure: FeeStructureInsert): Promise<FeeStructure | null> {
    const { data, error } = await supabase
      .from('fee_structures')
      .upsert(feeStructure, {
        onConflict: 'cohort_id,structure_type',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting fee structure:', error);
      return null;
    }

    return data;
  }

  static async createCustomPlanFromCohort(
    cohortId: string,
    studentId: string,
    customDates: Record<string, string>,
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise'
  ): Promise<FeeStructure | null> {
    // First, get the cohort fee structure
    const { data: cohortStructure, error: fetchError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort')
      .single();

    if (fetchError || !cohortStructure) {
      console.error('Error fetching cohort fee structure:', fetchError);
      return null;
    }

    // Convert custom dates to plan-specific JSON
    const planSpecificDates = PaymentScheduleOverrides.toPlanSpecificJson(customDates, paymentPlan);

    // Create custom plan with plan-specific dates
    const customPlan: FeeStructureInsert = {
      ...cohortStructure,
      id: undefined, // Let it generate a new ID
      student_id: studentId,
      structure_type: 'custom',
      // Set the appropriate plan-specific field
      one_shot_dates: paymentPlan === 'one_shot' ? planSpecificDates : {},
      sem_wise_dates: paymentPlan === 'sem_wise' ? planSpecificDates : {},
      instalment_wise_dates: paymentPlan === 'instalment_wise' ? planSpecificDates : {},
    };

    const { data, error } = await supabase
      .from('fee_structures')
      .upsert(customPlan, {
        onConflict: 'cohort_id,student_id,structure_type',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom plan:', error);
      return null;
    }

    return data;
  }

  static async updateCohortPlanDates(
    cohortId: string,
    customDates: Record<string, string>,
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise'
  ): Promise<boolean> {
    // Convert custom dates to plan-specific JSON
    const planSpecificDates = PaymentScheduleOverrides.toPlanSpecificJson(customDates, paymentPlan);

    // Update only the specific plan field, don't touch the others
    const updateData: Partial<FeeStructureUpdate> = {};

    // Set only the specific plan field
    if (paymentPlan === 'one_shot') {
      updateData.one_shot_dates = planSpecificDates;
    } else if (paymentPlan === 'sem_wise') {
      updateData.sem_wise_dates = planSpecificDates;
    } else if (paymentPlan === 'instalment_wise') {
      updateData.instalment_wise_dates = planSpecificDates;
    }

    const { error } = await supabase
      .from('fee_structures')
      .update(updateData)
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort');

    if (error) {
      console.error('Error updating cohort plan dates:', error);
      return false;
    }

    return true;
  }

  static async markFeeStructureComplete(cohortId: string): Promise<boolean> {
    const { error } = await supabase
      .from('fee_structures')
      .update({ is_setup_complete: true })
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort');

    if (error) {
      console.error('Error marking fee structure complete:', error);
      return false;
    }

    return true;
  }

  static async getFeeStructure(cohortId: string, studentId?: string): Promise<FeeStructure | null> {
    let query = supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId);

    if (studentId) {
      // Try to get custom plan first
      query = query.eq('student_id', studentId).eq('structure_type', 'custom');
    } else {
      // Get cohort plan
      query = query.eq('structure_type', 'cohort');
    }

    const { data, error } = await query.maybeSingle();

    // When no fee structure exists yet, return null without logging an error
    if (error) {
      // PGRST116 (406): Cannot coerce the result to a single JSON object (0 rows)
      const code = (error as any)?.code || '';
      if (code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching fee structure:', error);
      return null;
    }

    return (data as any) || null;
  }

  static async deleteFeeStructure(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting fee structure:', error);
      return false;
    }

    return true;
  }

  /**
   * Load cohort-level fee structure along with cohort scholarships
   * Used by dashboards and setup flows that need both pieces together
   */
  static async getCompleteFeeStructure(cohortId: string): Promise<{
    feeStructure: FeeStructure | null;
    scholarships: Array<any>;
  }> {
    // Load cohort-level fee structure
    const { data: feeStructure, error: fsError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort')
      .maybeSingle();

    // Load scholarships for the cohort (visible to authenticated users per policy)
    const { data: scholarships, error: schError } = await supabase
      .from('cohort_scholarships')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('start_percentage', { ascending: true });

    if (fsError) {
      console.error('Error fetching cohort fee structure (complete):', fsError);
    }
    if (schError) {
      console.error('Error fetching cohort scholarships:', schError);
    }

    return {
      feeStructure: (feeStructure as any) || null,
      scholarships: scholarships || [],
    };
  }
}
