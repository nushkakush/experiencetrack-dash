import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { 
  StudentPayment, 
  StudentPaymentSummary, 
  PaymentTransaction, 
  CommunicationHistory
} from '@/types/fee';
import { Logger } from '@/lib/logging/Logger';

export class PaymentQueryService {
  /**
   * Get all student payments for a cohort
   */
  async getStudentPayments(cohortId: string): Promise<ApiResponse<StudentPayment[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          student:cohort_students(*)
        `)
        .eq('cohort_id', cohortId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return {
        data: data as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching student payments', { error, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payments',
        success: false,
      };
    }
  }

  /**
   * Get student payments by student ID and cohort ID
   */
  async getStudentPaymentByStudentId(studentId: string, cohortId: string): Promise<ApiResponse<StudentPayment[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          student:cohort_students(*)
        `)
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return {
        data: data as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching student payment by student ID', { error, studentId, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payment',
        success: false,
      };
    }
  }

  /**
   * Get payment summary for all students in a cohort
   */
  async getStudentPaymentSummary(cohortId: string): Promise<ApiResponse<StudentPaymentSummary[]>> {
    try {
      // Get all students in the cohort
      const { data: students, error: studentsError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId)
        .neq('dropped_out_status', 'dropped_out');

      if (studentsError) {
        Logger.getInstance().error('getStudentPaymentSummary: Students query error', { error: studentsError, cohortId });
        throw studentsError;
      }

      if (!students || students.length === 0) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      // Get student IDs for separate queries
      const studentIds = students.map(s => s.id);

      // Get payments for these students
      const { data: payments, error: paymentsError } = await supabase
        .from('student_payments')
        .select('*')
        .in('student_id', studentIds);

      if (paymentsError) {
        Logger.getInstance().error('getStudentPaymentSummary: Payments query error', { error: paymentsError, cohortId });
        throw paymentsError;
      }

      // Calculate summary for each student
      const summary = students.map(student => {
        const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
        const totalAmount = studentPayments.reduce((sum, payment) => sum + (payment.amount_payable || 0), 0);
        const paidAmount = studentPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
        const pendingAmount = totalAmount - paidAmount;
        const overdueAmount = studentPayments
          .filter(payment => new Date(payment.due_date) < new Date() && payment.amount_paid < payment.amount_payable)
          .reduce((sum, payment) => sum + (payment.amount_payable - payment.amount_paid), 0);

        return {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          student_email: student.email,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          overdue_amount: overdueAmount,
          payment_count: studentPayments.length,
          last_payment_date: studentPayments.length > 0 ? 
            new Date(Math.max(...studentPayments.map(p => new Date(p.updated_at || p.created_at).getTime()))) : 
            null
        };
      });

      return {
        data: summary as StudentPaymentSummary[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching student payment summary', { error, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payment summary',
        success: false,
      };
    }
  }

  /**
   * Get payment transactions for a specific payment
   */
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
      Logger.getInstance().error('Error fetching payment transactions', { error, paymentId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch payment transactions',
        success: false,
      };
    }
  }

  /**
   * Get communication history for a student
   */
  async getCommunicationHistory(studentId: string): Promise<ApiResponse<CommunicationHistory[]>> {
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data as CommunicationHistory[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching communication history', { error, studentId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch communication history',
        success: false,
      };
    }
  }
}

export const paymentQueryService = new PaymentQueryService();
