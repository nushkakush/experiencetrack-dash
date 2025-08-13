import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentSummaryView } from '@/integrations/supabase/types/tables/payments';

export class StudentPaymentSummaryService {
  /**
   * Get payment summary for a specific student
   */
  static async getStudentPaymentSummary(studentId: string): Promise<ApiResponse<StudentPaymentSummaryView | null>> {
    try {
      const { data, error } = await supabase
        .from('student_payment_summary_view')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error) {
        Logger.getInstance().error('Error fetching student payment summary', { error, studentId });
        return { success: false, data: null, error };
      }

      return { success: true, data, error: null };
    } catch (error) {
      Logger.getInstance().error('Error in getStudentPaymentSummary', { error, studentId });
      return { success: false, data: null, error };
    }
  }

  /**
   * Get payment summaries for all students in a cohort
   */
  static async getCohortPaymentSummaries(cohortId: string): Promise<ApiResponse<StudentPaymentSummaryView[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payment_summary_view')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.getInstance().error('Error fetching cohort payment summaries', { error, cohortId });
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [], error: null };
    } catch (error) {
      Logger.getInstance().error('Error in getCohortPaymentSummaries', { error, cohortId });
      return { success: false, data: [], error };
    }
  }

  /**
   * Get payment summaries with scholarship information
   */
  static async getPaymentSummariesWithScholarships(cohortId: string): Promise<ApiResponse<StudentPaymentSummaryView[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payment_summary_view')
        .select('*')
        .eq('cohort_id', cohortId)
        .not('scholarship_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.getInstance().error('Error fetching payment summaries with scholarships', { error, cohortId });
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [], error: null };
    } catch (error) {
      Logger.getInstance().error('Error in getPaymentSummariesWithScholarships', { error, cohortId });
      return { success: false, data: [], error };
    }
  }
}
