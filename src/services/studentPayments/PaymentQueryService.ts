import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { 
  StudentPaymentRow,
  PaymentTransactionRow,
  CommunicationHistoryRow,
  StudentPaymentSummaryRow
} from '@/types/payments/DatabaseAlignedTypes';
import { Logger } from '@/lib/logging/Logger';

// Type aliases for backward compatibility
type StudentPayment = StudentPaymentRow;
type PaymentTransaction = PaymentTransactionRow;
type CommunicationHistory = CommunicationHistoryRow;
type StudentPaymentSummary = StudentPaymentSummaryRow;

export class PaymentQueryService {
  async getStudentPayments(cohortId: string): Promise<ApiResponse<StudentPaymentRow[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          student:cohort_students(*)
        `)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      return {
        data: data as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentQueryService: Error fetching student payments', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payments',
        success: false,
      };
    }
  }

  async getStudentPaymentByStudentId(studentId: string, cohortId: string): Promise<ApiResponse<StudentPayment[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      return {
        data: data as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentQueryService: Error fetching student payment by student ID', { error, studentId, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payment',
        success: false,
      };
    }
  }

  async getStudentPaymentSummary(cohortId: string): Promise<ApiResponse<StudentPaymentSummary[]>> {
    try {
      // First, get all students in the cohort
      const { data: students, error: studentsError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId);

      if (studentsError) {
        Logger.getInstance().error('PaymentQueryService: Students query error', { error: studentsError });
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      // Get all payments for the cohort
      const { data: payments, error: paymentsError } = await supabase
        .from('student_payments')
        .select('*')
        .eq('cohort_id', cohortId);

      if (paymentsError) {
        Logger.getInstance().error('PaymentQueryService: Payments query error', { error: paymentsError });
        throw paymentsError;
      }

      // Create summary for each student
      const summary: StudentPaymentSummary[] = students.map((student) => {
        const studentPayment = payments?.find(p => p.student_id === student.id);
        
        if (!studentPayment) {
          return {
            student_id: student.id,
            student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
            student_email: student.email,
            total_payable: 0,
            total_paid: 0,
            total_pending: 0,
            payment_count: 0,
            next_due_date: null,
            next_due_amount: 0,
            payment_status: 'no_plan',
            payment_plan: 'not_selected'
          };
        }

        return {
          student_id: student.id,
          student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
          student_email: student.email,
          total_payable: studentPayment.total_amount_payable || 0,
          total_paid: studentPayment.total_amount_paid || 0,
          total_pending: studentPayment.total_amount_pending || 0,
          payment_count: 1, // Single record per student
          next_due_date: studentPayment.next_due_date || null,
          next_due_amount: studentPayment.total_amount_pending || 0,
          payment_status: studentPayment.payment_status || 'pending',
          payment_plan: studentPayment.payment_plan || 'unknown'
        };
      });

      return {
        data: summary,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentQueryService: Error fetching student payment summary', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch payment summary',
        success: false,
      };
    }
  }

  async getPaymentTransactions(paymentId: string): Promise<ApiResponse<PaymentTransaction[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data as PaymentTransaction[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentQueryService: Error fetching payment transactions', { error, paymentId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch payment transactions',
        success: false,
      };
    }
  }

  async getCommunicationHistory(studentId: string): Promise<ApiResponse<CommunicationHistory[]>> {
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .select('*')
        .eq('student_id', studentId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      return {
        data: data as CommunicationHistory[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentQueryService: Error fetching communication history', { error, studentId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch communication history',
        success: false,
      };
    }
  }

  private calculateOverallStatus(payments: StudentPayment[]): string {
    if (payments.length === 0) return 'no_payments';
    
    // With single record approach, we only have one payment record per student
    const payment = payments[0];
    if (!payment) return 'unknown';
    
    return payment.payment_status || 'unknown';
  }
}
