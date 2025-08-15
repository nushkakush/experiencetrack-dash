import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import {
  StudentPaymentRow,
  PaymentTransactionRow,
  CommunicationHistoryRow,
  StudentPaymentSummaryRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { Logger } from '@/lib/logging/Logger';

// Type aliases for backward compatibility
type StudentPayment = StudentPaymentRow;
type PaymentTransaction = PaymentTransactionRow;
type CommunicationHistory = CommunicationHistoryRow;
type StudentPaymentSummary = StudentPaymentSummaryRow;

export class PaymentQueryService {
  async getStudentPayments(
    cohortId: string
  ): Promise<ApiResponse<StudentPaymentRow[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select(
          `
          *,
          student:cohort_students(*)
        `
        )
        .eq('cohort_id', cohortId);

      if (error) throw error;

      return {
        data: data as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error(
        'PaymentQueryService: Error fetching student payments',
        { error }
      );
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch student payments',
        success: false,
      };
    }
  }

  async getStudentPaymentByStudentId(
    studentId: string,
    cohortId: string
  ): Promise<ApiResponse<StudentPayment[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      // Attach convenience field for UI to access the record id
      const withId = (data || []).map(p => ({
        ...p,
        student_payment_id: p.id,
      }));
      return {
        data: withId as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error(
        'PaymentQueryService: Error fetching student payment by student ID',
        { error, studentId, cohortId }
      );
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch student payment',
        success: false,
      };
    }
  }

  async getStudentPaymentSummary(
    cohortId: string
  ): Promise<ApiResponse<StudentPaymentSummary[]>> {
    try {
      // First, get all students in the cohort
      const { data: students, error: studentsError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId);

      if (studentsError) {
        Logger.getInstance().error(
          'PaymentQueryService: Students query error',
          { error: studentsError }
        );
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
        Logger.getInstance().error(
          'PaymentQueryService: Payments query error',
          { error: paymentsError }
        );
        throw paymentsError;
      }

      // Get all payment transactions for the cohort
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('*')
        .in('payment_id', payments?.map(p => p.id) || []);

      if (transactionsError) {
        Logger.getInstance().error(
          'PaymentQueryService: Transactions query error',
          { error: transactionsError }
        );
        throw transactionsError;
      }

      // Create summary for each student
      const summary: StudentPaymentSummary[] = students.map(student => {
        const studentPayment = payments?.find(p => p.student_id === student.id);

        if (!studentPayment) {
          return {
            student_id: student.id,
            // No payment record yet, so no linked id
            student_payment_id: undefined as unknown as string,
            total_amount: 0,
            paid_amount: 0,
            pending_amount: 0,
            overdue_amount: 0,
            scholarship_name: undefined,
            scholarship_id: undefined,
            token_fee_paid: false,
            payment_plan: 'not_selected',
            student: student,
            payments: [],
          };
        }

        // Get transactions for this student's payment
        const studentTransactions =
          transactions?.filter(t => t.payment_id === studentPayment.id) || [];

        // Convert payment transactions to a format that matches StudentPayment interface
        const convertedPayments = studentTransactions.map(transaction => ({
          id: transaction.id,
          student_id: student.id,
          cohort_id: cohortId,
          payment_type: 'program_fee' as const,
          payment_plan: studentPayment.payment_plan,
          base_amount: parseFloat(transaction.amount || '0'),
          scholarship_amount: 0,
          discount_amount: 0,
          gst_amount: 0,
          amount_payable: parseFloat(transaction.amount || '0'),
          amount_paid:
            transaction.status === 'success'
              ? parseFloat(transaction.amount || '0')
              : 0,
          due_date: transaction.payment_date || transaction.created_at,
          payment_date: transaction.payment_date,
          status: transaction.status === 'success' ? 'paid' : 'pending',
          receipt_url:
            transaction.receipt_url || transaction.proof_of_payment_url,
          notes: transaction.notes,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        }));

        return {
          student_id: student.id,
          // expose underlying record id so UI can fetch transactions reliably
          student_payment_id: studentPayment.id,
          total_amount: (() => {
            // Use the total_amount_payable from the student payment record as the source of truth
            return studentPayment.total_amount_payable || 0;
          })(),
          paid_amount: (() => {
            // Calculate paid amount from approved transactions only
            const approvedTransactions = studentTransactions.filter(
              t => t.verification_status === 'approved'
            );
            const transactionPaidAmount = approvedTransactions.reduce(
              (sum, t) => sum + parseFloat(t.amount || '0'),
              0
            );

            // Use the total_amount_paid from the student payment record as the source of truth
            // This includes admission fee if it's been paid
            return Math.max(
              transactionPaidAmount,
              studentPayment.total_amount_paid || 0
            );
          })(),
          pending_amount: (() => {
            // Calculate pending amount (total - paid)
            const totalAmount = studentPayment.total_amount_payable || 0;
            const paidAmount = Math.max(
              studentTransactions
                .filter(t => t.verification_status === 'approved')
                .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
              studentPayment.total_amount_paid || 0
            );
            return Math.max(0, totalAmount - paidAmount);
          })(),
          overdue_amount: 0, // TODO: Calculate overdue amount
          scholarship_name: undefined, // TODO: Get from scholarship table
          scholarship_id: studentPayment.scholarship_id || undefined,
          token_fee_paid: false, // TODO: Check if admission fee is paid
          payment_plan: studentPayment.payment_plan || 'not_selected',
          student: student,
          payments: convertedPayments,
          payment_schedule: studentPayment.payment_schedule,
        };
      });

      return {
        data: summary,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error(
        'PaymentQueryService: Error fetching student payment summary',
        { error }
      );
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch payment summary',
        success: false,
      };
    }
  }

  async getPaymentTransactions(
    paymentId: string
  ): Promise<ApiResponse<PaymentTransaction[]>> {
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
      Logger.getInstance().error(
        'PaymentQueryService: Error fetching payment transactions',
        { error, paymentId }
      );
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch payment transactions',
        success: false,
      };
    }
  }

  async getCommunicationHistory(
    studentId: string
  ): Promise<ApiResponse<CommunicationHistory[]>> {
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
      Logger.getInstance().error(
        'PaymentQueryService: Error fetching communication history',
        { error, studentId }
      );
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch communication history',
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
