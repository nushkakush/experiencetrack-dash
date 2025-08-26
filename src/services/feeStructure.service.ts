import { supabase } from '@/integrations/supabase/client';
import {
  FeeStructure,
  FeeStructureInsert,
  FeeStructureUpdate,
} from '@/types/payments/FeeStructureTypes';
import { PaymentScheduleOverrides } from './payments/PaymentScheduleOverrides';

export class FeeStructureService {
  static async upsertFeeStructure(
    feeStructure: FeeStructureInsert
  ): Promise<FeeStructure | null> {
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
    const planSpecificDates = PaymentScheduleOverrides.toPlanSpecificJson(
      customDates,
      paymentPlan
    );

    // Create custom plan with plan-specific dates
    const customPlan: FeeStructureInsert = {
      ...cohortStructure,
      id: undefined, // Let it generate a new ID
      student_id: studentId,
      structure_type: 'custom',
      // Set the appropriate plan-specific field
      one_shot_dates: paymentPlan === 'one_shot' ? planSpecificDates : {},
      sem_wise_dates: paymentPlan === 'sem_wise' ? planSpecificDates : {},
      instalment_wise_dates:
        paymentPlan === 'instalment_wise' ? planSpecificDates : {},
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

  /**
   * Upsert a student-specific custom plan by copying base fields from the cohort plan
   * and applying edited base fields + plan-specific dates for the selected plan.
   */
  static async upsertCustomPlanForStudent(params: {
    cohortId: string;
    studentId: string;
    baseFields: {
      admission_fee: number;
      total_program_fee: number;
      number_of_semesters: number;
      instalments_per_semester: number;
      one_shot_discount_percentage: number;
      program_fee_includes_gst: boolean;
      equal_scholarship_distribution: boolean;
    };
    selectedPlan: 'one_shot' | 'sem_wise' | 'instalment_wise';
    editedDates: Record<string, string>;
  }): Promise<FeeStructure | null> {
    const { cohortId, studentId, baseFields, selectedPlan, editedDates } =
      params;

    // Get existing custom plan for the student (if any)
    const { data: existingCustom } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('student_id', studentId)
      .eq('structure_type', 'custom')
      .maybeSingle();

    // Load cohort plan (as base when no custom exists)
    const { data: cohortStructure, error: fetchError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort')
      .single();

    if (fetchError || !cohortStructure) {
      console.error(
        'upsertCustomPlanForStudent: cohort plan fetch error',
        fetchError
      );
      return null;
    }

    // Map dates to plan-specific JSON
    const planSpecificDates = PaymentScheduleOverrides.toPlanSpecificJson(
      editedDates,
      selectedPlan
    );

    // Construct row: start from existingCustom if present, else from cohortStructure
    const baseRow = existingCustom || cohortStructure;

    const payload: FeeStructureInsert = {
      // When upserting, let PostgREST identify row by conflict target
      cohort_id: cohortId,
      student_id: studentId,
      structure_type: 'custom',
      admission_fee: baseFields.admission_fee,
      total_program_fee: baseFields.total_program_fee,
      number_of_semesters: baseFields.number_of_semesters,
      instalments_per_semester: baseFields.instalments_per_semester,
      one_shot_discount_percentage: baseFields.one_shot_discount_percentage,
      program_fee_includes_gst: baseFields.program_fee_includes_gst,
      equal_scholarship_distribution: baseFields.equal_scholarship_distribution,
      is_setup_complete: true,
      // Only set the selected plan's dates; leave others as-is (empty object on insert)
      one_shot_dates:
        selectedPlan === 'one_shot'
          ? planSpecificDates
          : existingCustom?.one_shot_dates || {},
      sem_wise_dates:
        selectedPlan === 'sem_wise'
          ? planSpecificDates
          : existingCustom?.sem_wise_dates || {},
      instalment_wise_dates:
        selectedPlan === 'instalment_wise'
          ? planSpecificDates
          : existingCustom?.instalment_wise_dates || {},
    } as unknown as FeeStructureInsert;

    const { data, error } = await supabase
      .from('fee_structures')
      .upsert(payload, {
        onConflict: 'cohort_id,student_id,structure_type',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting custom plan for student:', error);
      return null;
    }

    return data as unknown as FeeStructure;
  }

  static async deleteCustomPlanForStudent(
    cohortId: string,
    studentId: string
  ): Promise<boolean> {
    // Find the custom fee structure for this student
    const { data: existingStructures, error: queryError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('student_id', studentId)
      .eq('structure_type', 'custom');

    if (queryError) {
      console.error(
        'deleteCustomPlanForStudent: error querying existing structures',
        queryError
      );
      return false;
    }

    // Delete the custom structure if it exists
    if (existingStructures && existingStructures.length > 0) {
      const structureToDelete = existingStructures[0];

      const { error: deleteError } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', structureToDelete.id);

      if (deleteError) {
        console.error(
          'deleteCustomPlanForStudent: error deleting custom structure',
          deleteError
        );
        return false;
      }
    }

    return true;
  }

  static async updateCohortPlanDates(
    cohortId: string,
    customDates: Record<string, string>,
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise'
  ): Promise<boolean> {
    // Convert custom dates to plan-specific JSON
    const planSpecificDates = PaymentScheduleOverrides.toPlanSpecificJson(
      customDates,
      paymentPlan
    );

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

  static async getFeeStructure(
    cohortId: string,
    studentId?: string
  ): Promise<FeeStructure | null> {
    if (studentId) {
      // Try to get custom plan first
      const query = supabase
        .from('fee_structures')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('student_id', studentId)
        .eq('structure_type', 'custom');

      const { data: customData, error: customError } =
        await query.maybeSingle();

      // Debug logging
      console.log('getFeeStructure: custom plan query result', {
        cohortId,
        studentId,
        data: customData,
        error: customError,
        query: `cohort_id=${cohortId} AND student_id=${studentId} AND structure_type='custom'`,
      });

      // If custom plan exists, return it
      if (customData) {
        return customData as FeeStructure;
      }

      // If no custom plan exists, fall back to cohort plan
      console.log(
        'getFeeStructure: No custom plan found, falling back to cohort plan'
      );
    }

    // Get cohort plan (either directly or as fallback)
    const query = supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort');

    const { data, error } = await query.maybeSingle();

    // Debug logging
    console.log('getFeeStructure: cohort plan query result', {
      cohortId,
      studentId,
      data,
      error,
      query: `cohort_id=${cohortId} AND structure_type='cohort'`,
    });

    // When no fee structure exists yet, return null without logging an error
    if (error) {
      // PGRST116 (406): Cannot coerce the result to a single JSON object (0 rows)
      const code = (error as { code?: string })?.code || '';
      if (code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching fee structure:', error);
      return null;
    }

    return (data as FeeStructure) || null;
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
   * Load fee structure along with cohort scholarships
   * Prioritizes custom plan for specific student if provided, otherwise uses cohort plan
   * Used by dashboards and setup flows that need both pieces together
   */
  static async getCompleteFeeStructure(
    cohortId: string,
    studentId?: string
  ): Promise<{
    feeStructure: FeeStructure | null;
    scholarships: Array<Record<string, unknown>>;
  }> {
    // Load fee structure - prioritize custom plan for student if it exists
    const feeStructure = await this.getFeeStructure(cohortId, studentId);

    // Load scholarships for the cohort (visible to authenticated users per policy)
    const { data: scholarships, error: schError } = await supabase
      .from('cohort_scholarships')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('start_percentage', { ascending: true });

    if (schError) {
      console.error('Error fetching cohort scholarships:', schError);
    }

    return {
      feeStructure: feeStructure,
      scholarships: scholarships || [],
    };
  }
}
