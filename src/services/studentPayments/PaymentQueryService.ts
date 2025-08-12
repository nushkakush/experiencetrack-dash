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
        .eq('cohort_id', cohortId)
        .order('due_date', { ascending: true });

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
        const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
        
        const totalPayable = studentPayments.reduce((sum, payment) => sum + payment.amount_payable, 0);
        const totalPaid = studentPayments.reduce((sum, payment) => sum + payment.amount_paid, 0);
        const totalPending = totalPayable - totalPaid;
        
        const pendingPayments = studentPayments.filter(p => p.status === 'pending' || p.status === 'overdue');
        const nextDuePayment = pendingPayments.length > 0 
          ? pendingPayments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
          : null;

        return {
          student_id: student.id,
          student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
          student_email: student.email,
          total_payable: totalPayable,
          total_paid: totalPaid,
          total_pending: totalPending,
          payment_count: studentPayments.length,
          next_due_date: nextDuePayment?.due_date || null,
          next_due_amount: nextDuePayment?.amount_payable || 0,
          payment_status: this.calculateOverallStatus(studentPayments),
          payment_plan: studentPayments[0]?.payment_plan || 'unknown'
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
    
    const hasOverdue = payments.some(p => p.status === 'overdue');
    const hasPending = payments.some(p => p.status === 'pending');
    const allPaid = payments.every(p => p.status === 'paid' || p.status === 'complete');
    
    if (hasOverdue) return 'overdue';
    if (allPaid) return 'paid';
    if (hasPending) return 'pending';
    
    return 'unknown';
  }
}
