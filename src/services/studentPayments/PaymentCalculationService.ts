import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { PaymentPlan } from '@/types/fee';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { Logger } from '@/lib/logging/Logger';

export class PaymentCalculationService {
  async calculatePaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    scholarshipId?: string,
    forceUpdate: boolean = false
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    Logger.getInstance().info('PaymentCalculationService: Starting payment plan calculation', { 
      studentId, 
      paymentPlan, 
      cohortId 
    });
    
    try {
      // Check if student has already made any payments
      if (!forceUpdate) {
        const { data: existingPayments, error: existingError } = await supabase
          .from('student_payments')
          .select('amount_paid, status')
          .eq('student_id', studentId)
          .eq('cohort_id', cohortId);

        if (existingError) {
          Logger.getInstance().error('PaymentCalculationService: Error checking existing payments', { error: existingError });
          throw new Error('Failed to check existing payments');
        }

        // Check if any payments have been made
        const hasMadePayments = existingPayments?.some((payment) => 
          payment.amount_paid > 0 || payment.status === 'paid' || payment.status === 'complete'
        );

        if (hasMadePayments) {
          throw new Error('Payment plan cannot be changed because you have already made payments. Please contact the administration to change your payment plan.');
        }
      }

      // Get cohort data for start date
      const { data: cohortData, error: cohortError } = await supabase
        .from('cohorts')
        .select('start_date')
        .eq('id', cohortId)
        .single();

      if (cohortError) {
        Logger.getInstance().error('PaymentCalculationService: Error fetching cohort data', { error: cohortError });
        throw new Error('Failed to fetch cohort data');
      }

      if (!cohortData?.start_date) {
        throw new Error('Cohort start date not found');
      }

      // Get fee structure
      const { data: feeStructure, error: feeError } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('cohort_id', cohortId)
        .single();

      if (feeError) {
        Logger.getInstance().error('PaymentCalculationService: Error fetching fee structure', { error: feeError });
        throw new Error('Failed to fetch fee structure');
      }

      if (!feeStructure) {
        throw new Error('Fee structure not found');
      }

      // Delete existing payment records for this student
      const { error: deleteError } = await supabase
        .from('student_payments')
        .delete()
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId);

      if (deleteError) {
        Logger.getInstance().error('PaymentCalculationService: Error deleting existing payments', { error: deleteError });
        throw deleteError;
      }

      // Note: Individual student scholarships are not supported in the current schema
      // Only cohort-level scholarships are available via cohort_scholarships table
      Logger.getInstance().info('PaymentCalculationService: Individual scholarships not supported, using cohort scholarships only');

      // Create payment records based on payment plan
      const paymentRecords = this.generatePaymentRecords(
        studentId,
        cohortId,
        paymentPlan,
        feeStructure,
        cohortData.start_date
      );

      // Insert payment records
      if (paymentRecords.length > 0) {
        Logger.getInstance().info('PaymentCalculationService: Inserting payment records', { 
          recordCount: paymentRecords.length, 
          studentId, 
          paymentPlan 
        });
        
        const { error: insertError } = await supabase
          .from('student_payments')
          .insert(paymentRecords);

        if (insertError) {
          Logger.getInstance().error('PaymentCalculationService: Error inserting payment records', { error: insertError });
          throw insertError;
        }
      }

      // Note: Individual student scholarships are not supported in the current schema
      // Scholarship information is available through cohort_scholarships table
      if (scholarshipId && scholarshipId !== 'no_scholarship') {
        Logger.getInstance().info('PaymentCalculationService: Scholarship selected but individual scholarships not supported', { 
          scholarshipId, 
          studentId 
        });
      }

      return {
        data: { success: true, message: 'Payment plan updated successfully' },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentCalculationService: Error calculating payment plan', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment plan',
        success: false,
      };
    }
  }

  private generatePaymentRecords(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    feeStructure: FeeStructure,
    startDate: string
  ): Array<{
    student_id: string;
    cohort_id: string;
    payment_type: string;
    payment_plan: string;
    base_amount: number;
    amount_payable: number;
    amount_paid: number;
    due_date: string;
    status: string;
  }> {
    const paymentRecords: Array<{
      student_id: string;
      cohort_id: string;
      payment_type: string;
      payment_plan: string;
      base_amount: number;
      amount_payable: number;
      amount_paid: number;
      due_date: string;
      status: string;
    }> = [];

    if (paymentPlan === 'one_shot') {
      // Create one-shot payment record
      paymentRecords.push({
        student_id: studentId,
        cohort_id: cohortId,
        payment_type: 'one_shot',
        payment_plan: paymentPlan,
        base_amount: feeStructure.total_program_fee,
        amount_payable: feeStructure.total_program_fee,
        amount_paid: 0,
        due_date: startDate,
        status: 'pending'
      });
    } else if (paymentPlan === 'sem_wise') {
      // Create semester-wise payment records
      const semesterAmount = feeStructure.total_program_fee / feeStructure.number_of_semesters;
      const startDateObj = new Date(startDate);
      
      for (let i = 0; i < feeStructure.number_of_semesters; i++) {
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(startDateObj.getMonth() + (i * 6)); // 6 months per semester
        
        paymentRecords.push({
          student_id: studentId,
          cohort_id: cohortId,
          payment_type: 'sem_plan',
          payment_plan: paymentPlan,
          base_amount: semesterAmount,
          amount_payable: semesterAmount,
          amount_paid: 0,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending'
        });
      }
    } else if (paymentPlan === 'instalment_wise') {
      // Create installment-wise payment records
      const totalInstallments = feeStructure.number_of_semesters * feeStructure.instalments_per_semester;
      const installmentAmount = feeStructure.total_program_fee / totalInstallments;
      const startDateObj = new Date(startDate);
      
      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(startDateObj.getMonth() + i); // Monthly installments
        
        paymentRecords.push({
          student_id: studentId,
          cohort_id: cohortId,
          payment_type: 'instalments',
          payment_plan: paymentPlan,
          base_amount: installmentAmount,
          amount_payable: installmentAmount,
          amount_paid: 0,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending'
        });
      }
    }

    return paymentRecords;
  }
}
