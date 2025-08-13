import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { Logger } from '@/lib/logging/Logger';

interface PaymentSchedule {
  plan: PaymentPlan;
  total_amount: number;
  admission_fee: number;
  program_fee: number;
  installments: PaymentInstallment[];
  summary: {
    total_installments: number;
    next_due_date?: string;
    next_due_amount?: number;
    completion_percentage: number;
  };
}

interface PaymentInstallment {
  installment_number: number;
  semester_number?: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  amount_paid: number;
  amount_pending: number;
}

export class PaymentCalculationService {
  async calculatePaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    scholarshipId?: string,
    forceUpdate: boolean = false
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      Logger.getInstance().info('PaymentCalculationService: Starting payment plan calculation', { 
        studentId, 
        paymentPlan, 
        cohortId 
      });

      // Check if student has already made any payments
      if (!forceUpdate) {
        const { data: existingPayment, error: existingError } = await supabase
          .from('student_payments')
          .select('total_amount_paid, payment_status')
          .eq('student_id', studentId)
          .eq('cohort_id', cohortId)
          .single();

        if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
          Logger.getInstance().error('PaymentCalculationService: Error checking existing payments', { error: existingError });
          throw new Error('Failed to check existing payments');
        }

        // Check if any payments have been made
        if (existingPayment && existingPayment.total_amount_paid > 0) {
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

      // Get scholarship percentage if scholarshipId is provided
      let scholarshipPercentage = 0;
      if (scholarshipId) {
        scholarshipPercentage = await this.getScholarshipPercentage(scholarshipId);
      }

      // Calculate payment schedule
      const paymentSchedule = this.calculatePaymentSchedule(
        paymentPlan,
        feeStructure,
        cohortData.start_date,
        scholarshipPercentage
      );

      // Calculate total amount payable
      const totalAmountPayable = paymentSchedule.total_amount;

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
            payment_schedule: paymentSchedule,
            total_amount_payable: totalAmountPayable,
            scholarship_id: scholarshipId,
            payment_status: this.calculatePaymentStatus(existingRecord.total_amount_paid, totalAmountPayable),
            next_due_date: paymentSchedule.summary.next_due_date,
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
            payment_schedule: paymentSchedule,
            total_amount_payable: totalAmountPayable,
            total_amount_paid: 0,
            scholarship_id: scholarshipId,
            payment_status: 'pending',
            next_due_date: paymentSchedule.summary.next_due_date
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      Logger.getInstance().info('PaymentCalculationService: Payment plan updated successfully', { 
        studentId, 
        paymentPlan,
        totalAmount: totalAmountPayable,
        scholarshipPercentage
      });

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

  private async getScholarshipPercentage(scholarshipId: string): Promise<number> {
    try {
      const { data: scholarship, error } = await supabase
        .from('cohort_scholarships')
        .select('amount_percentage')
        .eq('id', scholarshipId)
        .single();

      if (error) {
        Logger.getInstance().error('PaymentCalculationService: Error fetching scholarship', { error, scholarshipId });
        return 0;
      }

      return Number(scholarship?.amount_percentage || 0);
    } catch (error) {
      Logger.getInstance().error('PaymentCalculationService: Error in getScholarshipPercentage', { error, scholarshipId });
      return 0;
    }
  }

  private calculatePaymentSchedule(
    paymentPlan: PaymentPlan,
    feeStructure: FeeStructure,
    startDate: string,
    scholarshipPercentage: number
  ): PaymentSchedule {
    const totalProgramFee = Number(feeStructure.total_program_fee);
    const admissionFee = Number(feeStructure.admission_fee);
    
    const totalDiscount = scholarshipPercentage;
    const discountAmount = (totalProgramFee * totalDiscount) / 100;
    const finalProgramFee = totalProgramFee - discountAmount;
    const totalAmount = admissionFee + finalProgramFee;

    const installments: PaymentInstallment[] = [];
    const startDateObj = new Date(startDate);

    if (paymentPlan === 'one_shot') {
      // Single payment
      installments.push({
        installment_number: 1,
        due_date: startDateObj.toISOString().split('T')[0],
        amount: totalAmount,
        status: 'pending',
        amount_paid: 0,
        amount_pending: totalAmount
      });
    } else if (paymentPlan === 'sem_wise') {
      // Semester-wise payments
      const semesterAmount = finalProgramFee / feeStructure.number_of_semesters;
      
      for (let i = 0; i < feeStructure.number_of_semesters; i++) {
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(startDateObj.getMonth() + (i * 6)); // 6 months per semester
        
        installments.push({
          installment_number: i + 1,
          semester_number: i + 1,
          due_date: dueDate.toISOString().split('T')[0],
          amount: semesterAmount,
          status: 'pending',
          amount_paid: 0,
          amount_pending: semesterAmount
        });
      }
    } else if (paymentPlan === 'instalment_wise') {
      // Installment-wise payments - properly group by semester
      const totalInstallments = feeStructure.number_of_semesters * feeStructure.instalments_per_semester;
      const installmentAmount = finalProgramFee / totalInstallments;
      
      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(startDateObj.getMonth() + i); // Monthly installments
        
        // Calculate which semester this installment belongs to
        const semesterNumber = Math.floor(i / feeStructure.instalments_per_semester) + 1;
        
        installments.push({
          installment_number: i + 1,
          semester_number: semesterNumber, // Add semester number for proper grouping
          due_date: dueDate.toISOString().split('T')[0],
          amount: installmentAmount,
          status: 'pending',
          amount_paid: 0,
          amount_pending: installmentAmount
        });
      }
    }

    return {
      plan: paymentPlan,
      total_amount: totalAmount,
      admission_fee: admissionFee,
      program_fee: finalProgramFee,
      installments,
      summary: {
        total_installments: installments.length,
        next_due_date: installments[0]?.due_date,
        next_due_amount: installments[0]?.amount,
        completion_percentage: 0
      }
    };
  }

  private calculatePaymentStatus(amountPaid: number, amountPayable: number): 'pending' | 'partially_paid' | 'paid' | 'overdue' {
    if (amountPaid >= amountPayable) {
      return 'paid';
    } else if (amountPaid > 0) {
      return 'partially_paid';
    } else {
      return 'pending';
    }
  }

  /**
   * Recalculate payment schedules for existing students to fix semester grouping
   */
  async recalculateExistingPaymentSchedules(cohortId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      Logger.getInstance().info('PaymentCalculationService: Starting recalculation for cohort', { cohortId });

      // Get all student payments for the cohort
      const { data: studentPayments, error: fetchError } = await supabase
        .from('student_payments')
        .select('*')
        .eq('cohort_id', cohortId);

      if (fetchError) {
        Logger.getInstance().error('PaymentCalculationService: Error fetching student payments', { error: fetchError });
        throw new Error('Failed to fetch student payments');
      }

      if (!studentPayments || studentPayments.length === 0) {
        return {
          data: { success: true, message: 'No student payments found for recalculation' },
          error: null,
          success: true,
        };
      }

      // Get fee structure and cohort data
      const { data: feeStructure, error: feeError } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('cohort_id', cohortId)
        .single();

      if (feeError) {
        Logger.getInstance().error('PaymentCalculationService: Error fetching fee structure', { error: feeError });
        throw new Error('Failed to fetch fee structure');
      }

      const { data: cohortData, error: cohortError } = await supabase
        .from('cohorts')
        .select('start_date')
        .eq('id', cohortId)
        .single();

      if (cohortError) {
        Logger.getInstance().error('PaymentCalculationService: Error fetching cohort data', { error: cohortError });
        throw new Error('Failed to fetch cohort data');
      }

      let updatedCount = 0;
      let errorCount = 0;

      // Recalculate each student's payment schedule
      for (const studentPayment of studentPayments) {
        try {
          // Get scholarship percentage if applicable
          let scholarshipPercentage = 0;
          if (studentPayment.scholarship_id) {
            scholarshipPercentage = await this.getScholarshipPercentage(studentPayment.scholarship_id);
          }

          // Recalculate payment schedule
          const newPaymentSchedule = this.calculatePaymentSchedule(
            studentPayment.payment_plan as PaymentPlan,
            feeStructure,
            cohortData.start_date,
            scholarshipPercentage
          );

          // Update the payment record
          const { error: updateError } = await supabase
            .from('student_payments')
            .update({
              payment_schedule: newPaymentSchedule,
              total_amount_payable: newPaymentSchedule.total_amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', studentPayment.id);

          if (updateError) {
            Logger.getInstance().error('PaymentCalculationService: Error updating student payment', { 
              error: updateError, 
              studentId: studentPayment.student_id 
            });
            errorCount++;
          } else {
            updatedCount++;
          }
        } catch (error) {
          Logger.getInstance().error('PaymentCalculationService: Error processing student payment', { 
            error, 
            studentId: studentPayment.student_id 
          });
          errorCount++;
        }
      }

      Logger.getInstance().info('PaymentCalculationService: Recalculation completed', { 
        cohortId, 
        updatedCount, 
        errorCount 
      });

      return {
        data: { 
          success: true, 
          message: `Recalculation completed. Updated: ${updatedCount}, Errors: ${errorCount}` 
        },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentCalculationService: Error in recalculateExistingPaymentSchedules', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to recalculate payment schedules',
        success: false,
      };
    }
  }
}
