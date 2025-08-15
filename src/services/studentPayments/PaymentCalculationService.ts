import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { PaymentPlan } from '@/types/fee';
import { Logger } from '@/lib/logging/Logger';

export class PaymentCalculationService {
  async updatePaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    scholarshipId?: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      Logger.getInstance().info('PaymentCalculationService: Starting payment plan update', { 
        studentId, 
        paymentPlan, 
        cohortId 
      });

      // Check if record already exists
      const { data: existingRecord } = await supabase
        .from('student_payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId)
        .single();

      let result;
      if (existingRecord) {
        // Update existing record
        const { data, error: updateError } = await supabase
          .from('student_payments')
          .update({
            payment_plan: paymentPlan,
            scholarship_id: scholarshipId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new record
        const { data, error: insertError } = await supabase
          .from('student_payments')
          .insert({
            student_id: studentId,
            cohort_id: cohortId,
            payment_plan: paymentPlan,
            scholarship_id: scholarshipId
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      Logger.getInstance().info('PaymentCalculationService: Payment plan updated successfully', { 
        studentId, 
        paymentPlan
      });

      return {
        data: { success: true, message: 'Payment plan updated successfully' },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentCalculationService: Error updating payment plan', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment plan',
        success: false,
      };
    }
  }
}
