import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

export type PaymentPlan = 'one_shot' | 'sem_wise' | 'instalment_wise' | 'not_selected';

export interface StudentPaymentPlan {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_plan: PaymentPlan | null;
  scholarship_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlanResult {
  success: boolean;
  data?: StudentPaymentPlan;
  error?: string;
}

class StudentPaymentPlanService {
  private logger = new Logger('StudentPaymentPlanService');

  async getByStudent(studentId: string): Promise<PaymentPlanResult> {
    try {
      this.logger.info('Getting payment plan for student', { studentId });

      const { data, error } = await supabase
        .from('student_payments')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is expected if no payment plan exists
        this.logger.error('Error fetching payment plan', { studentId }, error);
        return { success: false, error: error.message };
      }

      this.logger.info('Payment plan fetched successfully', { 
        studentId, 
        hasData: !!data,
        paymentPlan: data?.payment_plan 
      });

      return { success: true, data: data || undefined };
    } catch (error) {
      this.logger.error('Exception getting payment plan', { studentId }, error as Error);
      return { success: false, error: 'Failed to fetch payment plan' };
    }
  }

  async setPaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    adminUserId: string
  ): Promise<PaymentPlanResult> {
    try {
      this.logger.info('Setting payment plan for student', {
        studentId,
        cohortId,
        paymentPlan,
        adminUserId,
      });

      // Check if payment plan already exists
      const existingResult = await this.getByStudent(studentId);

      let result;
      if (existingResult.data) {
        // Update existing payment plan
        this.logger.info('Updating existing payment plan', { studentId, paymentPlan });
        
        const { data, error } = await supabase
          .from('student_payments')
          .update({
            payment_plan: paymentPlan,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId)
          .select()
          .single();

        result = { data, error };
      } else {
        // Create new payment plan record
        this.logger.info('Creating new payment plan', { studentId, paymentPlan });
        
        const { data, error } = await supabase
          .from('student_payments')
          .insert({
            student_id: studentId,
            cohort_id: cohortId,
            payment_plan: paymentPlan,
          })
          .select()
          .single();

        result = { data, error };
      }

      if (result.error) {
        this.logger.error('Error setting payment plan', {
          studentId,
          paymentPlan,
        }, result.error);
        return { success: false, error: result.error.message };
      }

      this.logger.info('Payment plan set successfully', {
        studentId,
        paymentPlan,
        data: result.data,
      });

      return { success: true, data: result.data };
    } catch (error) {
      this.logger.error('Exception setting payment plan', {
        studentId,
        paymentPlan,
      }, error as Error);
      return { success: false, error: 'Failed to set payment plan' };
    }
  }

  async removePaymentPlan(studentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('Removing payment plan for student', { studentId });

      const { error } = await supabase
        .from('student_payments')
        .delete()
        .eq('student_id', studentId);

      if (error) {
        this.logger.error('Error removing payment plan', { studentId }, error);
        return { success: false, error: error.message };
      }

      this.logger.info('Payment plan removed successfully', { studentId });
      return { success: true };
    } catch (error) {
      this.logger.error('Exception removing payment plan', { studentId }, error as Error);
      return { success: false, error: 'Failed to remove payment plan' };
    }
  }
}

export const studentPaymentPlanService = new StudentPaymentPlanService();
