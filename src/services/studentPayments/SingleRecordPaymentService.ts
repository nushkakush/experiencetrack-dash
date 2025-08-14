import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { Logger } from '@/lib/logging/Logger';

export interface StudentPaymentRecord {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_plan: PaymentPlan;
  payment_schedule: PaymentSchedule;
  total_amount_payable: number;
  total_amount_paid: number;
  total_amount_pending: number;
  scholarship_id?: string;
  payment_status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  next_due_date?: string;
  last_payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
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

export interface PaymentInstallment {
  installment_number: number;
  semester_number?: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  amount_paid: number;
  amount_pending: number;
}

export class SingleRecordPaymentService {
  /**
   * Create or update student payment record with calculated schedule
   */
  async setupStudentPayment(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    feeStructure: FeeStructure,
    scholarshipId?: string,
    additionalDiscountPercentage: number = 0
  ): Promise<ApiResponse<StudentPaymentRecord>> {
    try {
      Logger.getInstance().info('Setting up student payment record', {
        studentId,
        cohortId,
        paymentPlan,
        scholarshipId
      });

      // Calculate payment schedule
      const paymentSchedule = this.calculatePaymentSchedule(
        paymentPlan,
        feeStructure,
        scholarshipId,
        additionalDiscountPercentage
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
        const { data, error } = await supabase
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

        if (error) throw error;
        result = data;
      } else {
        // Create new record with admission fee already paid
        const admissionFee = paymentSchedule.admission_fee || 0;
        const { data, error } = await supabase
          .from('student_payments')
          .insert({
            student_id: studentId,
            cohort_id: cohortId,
            payment_plan: paymentPlan,
            payment_schedule: paymentSchedule,
            total_amount_payable: totalAmountPayable,
            total_amount_paid: admissionFee, // Include admission fee as already paid
            scholarship_id: scholarshipId,
            payment_status: this.calculatePaymentStatus(admissionFee, totalAmountPayable),
            next_due_date: paymentSchedule.summary.next_due_date
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return {
        success: true,
        data: result as StudentPaymentRecord,
        error: null
      };
    } catch (error) {
      Logger.getInstance().error('Error setting up student payment', { error, studentId, cohortId });
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to setup student payment'
      };
    }
  }

  /**
   * Get student payment record
   */
  async getStudentPayment(studentId: string, cohortId: string): Promise<ApiResponse<StudentPaymentRecord>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as StudentPaymentRecord,
        error: null
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching student payment', { error, studentId, cohortId });
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payment'
      };
    }
  }

  /**
   * Record a payment and update the record
   */
  async recordPayment(
    studentId: string,
    cohortId: string,
    amount: number,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<ApiResponse<StudentPaymentRecord>> {
    try {
      // Get current payment record
      const currentRecord = await this.getStudentPayment(studentId, cohortId);
      if (!currentRecord.success || !currentRecord.data) {
        throw new Error('Student payment record not found');
      }

      const record = currentRecord.data;
      const newTotalPaid = record.total_amount_paid + amount;
      const newPaymentStatus = this.calculatePaymentStatus(newTotalPaid, record.total_amount_payable);

      // Update payment record
      const { data, error } = await supabase
        .from('student_payments')
        .update({
          total_amount_paid: newTotalPaid,
          payment_status: newPaymentStatus,
          last_payment_date: new Date().toISOString(),
          next_due_date: this.calculateNextDueDate(record.payment_schedule, newTotalPaid),
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;

      // Create transaction record
      await this.createTransactionRecord(record.id, amount, paymentMethod, referenceNumber, notes);

      return {
        success: true,
        data: data as StudentPaymentRecord,
        error: null
      };
    } catch (error) {
      Logger.getInstance().error('Error recording payment', { error, studentId, cohortId, amount });
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record payment'
      };
    }
  }

  /**
   * Calculate payment schedule based on plan and fee structure
   */
  private calculatePaymentSchedule(
    paymentPlan: PaymentPlan,
    feeStructure: FeeStructure,
    scholarshipId?: string,
    additionalDiscountPercentage: number = 0
  ): PaymentSchedule {
    const totalProgramFee = Number(feeStructure.total_program_fee);
    const admissionFee = Number(feeStructure.admission_fee);
    
    // Calculate scholarship amount
    let scholarshipPercentage = 0;
    if (scholarshipId) {
      // Get scholarship percentage from cohort_scholarships table
      // For now, using a placeholder - this should be fetched from the database
      scholarshipPercentage = 10; // Placeholder
    }

    const totalDiscount = scholarshipPercentage + additionalDiscountPercentage;
    const discountAmount = (totalProgramFee * totalDiscount) / 100;
    const finalProgramFee = totalProgramFee - discountAmount;
    const totalAmount = admissionFee + finalProgramFee;

    const installments: PaymentInstallment[] = [];
    const startDate = new Date();

    if (paymentPlan === 'one_shot') {
      // Single payment
      installments.push({
        installment_number: 1,
        due_date: startDate.toISOString().split('T')[0],
        amount: totalAmount,
        status: 'pending',
        amount_paid: 0,
        amount_pending: totalAmount
      });
    } else if (paymentPlan === 'sem_wise') {
      // Semester-wise payments
      const semesterAmount = finalProgramFee / feeStructure.number_of_semesters;
      
      for (let i = 0; i < feeStructure.number_of_semesters; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + (i * 6)); // 6 months per semester
        
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
      // Installment-wise payments
      const totalInstallments = feeStructure.number_of_semesters * feeStructure.instalments_per_semester;
      const installmentAmount = finalProgramFee / totalInstallments;
      
      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i); // Monthly installments
        
        installments.push({
          installment_number: i + 1,
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

  /**
   * Calculate payment status based on amounts
   */
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
   * Calculate next due date based on payment schedule and current amount paid
   */
  private calculateNextDueDate(schedule: PaymentSchedule, amountPaid: number): string | undefined {
    let cumulativeAmount = 0;
    
    for (const installment of schedule.installments) {
      cumulativeAmount += installment.amount;
      if (cumulativeAmount > amountPaid) {
        return installment.due_date;
      }
    }
    
    return undefined; // All payments are complete
  }

  /**
   * Create transaction record
   */
  private async createTransactionRecord(
    paymentId: string,
    amount: number,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<void> {
    try {
      await supabase
        .from('payment_transactions')
        .insert({
          payment_id: paymentId,
          transaction_type: 'payment',
          amount,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          status: 'success',
          notes
        });
    } catch (error) {
      Logger.getInstance().error('Error creating transaction record', { error, paymentId, amount });
    }
  }
}
