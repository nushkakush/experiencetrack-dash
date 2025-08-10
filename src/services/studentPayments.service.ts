import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { 
  StudentPayment, 
  StudentPaymentSummary, 
  PaymentTransaction, 
  CommunicationHistory,
  PaymentStatus,
  PaymentType,
  PaymentPlan
} from '@/types/fee';

class StudentPaymentsService {
  async getStudentPayments(cohortId: string): Promise<ApiResponse<StudentPayment[]>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          student:cohort_students(*),
          scholarship:student_scholarships(*)
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
      console.error('Error fetching student payments:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payments',
        success: false,
      };
    }
  }

  async getStudentPaymentSummary(cohortId: string): Promise<ApiResponse<StudentPaymentSummary[]>> {
    try {
      // Get all students in the cohort with their payment summaries
      const { data, error } = await supabase
        .from('cohort_students')
        .select(`
          *,
          payments:student_payments(*),
          scholarship:student_scholarships(
            *,
            scholarship:scholarships(*)
          )
        `)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      // Transform the data to create payment summaries
      const summaries: StudentPaymentSummary[] = (data || []).map((student: any) => {
        const payments = student.payments || [];
        const scholarship = student.scholarship?.[0];
        
        const totalAmount = payments.reduce((sum: number, p: any) => sum + p.amount_payable, 0);
        const paidAmount = payments.reduce((sum: number, p: any) => sum + p.amount_paid, 0);
        const pendingAmount = totalAmount - paidAmount;
        const overdueAmount = payments
          .filter((p: any) => p.status === 'overdue' || p.status === 'partially_paid_overdue')
          .reduce((sum: number, p: any) => sum + (p.amount_payable - p.amount_paid), 0);

        return {
          student_id: student.id,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          overdue_amount: overdueAmount,
          scholarship_name: scholarship?.scholarship?.name,
          scholarship_percentage: scholarship?.scholarship?.amount_percentage,
          token_fee_paid: payments.some((p: any) => p.payment_type === 'admission_fee' && p.status === 'paid'),
          payment_plan: payments[0]?.payment_plan || 'instalment_wise',
          student: student,
          payments: payments,
        };
      });

      return {
        data: summaries,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching student payment summaries:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch payment summaries',
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
      console.error('Error fetching payment transactions:', error);
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
      console.error('Error fetching communication history:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch communication history',
        success: false,
      };
    }
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus, notes?: string): Promise<ApiResponse<StudentPayment>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .update({ 
          status, 
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select('*')
        .single();

      if (error) throw error;

      return {
        data: data as StudentPayment,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
        success: false,
      };
    }
  }

  async recordPayment(
    paymentId: string, 
    amount: number, 
    paymentMethod: PaymentTransaction['payment_method'],
    referenceNumber?: string,
    notes?: string
  ): Promise<ApiResponse<PaymentTransaction>> {
    try {
      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          payment_id: paymentId,
          transaction_type: 'payment',
          amount,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          status: 'success',
          notes,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (transactionError) throw transactionError;

      // Update payment amount
      const { error: paymentError } = await supabase
        .from('student_payments')
        .update({ 
          amount_paid: supabase.rpc('increment_amount_paid', { payment_id: paymentId, amount }),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      return {
        data: transaction as PaymentTransaction,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record payment',
        success: false,
      };
    }
  }

  async sendCommunication(
    studentId: string,
    type: CommunicationHistory['type'],
    channel: CommunicationHistory['channel'],
    subject: string,
    message: string
  ): Promise<ApiResponse<CommunicationHistory>> {
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .insert({
          student_id: studentId,
          type,
          channel,
          subject,
          message,
          sent_at: new Date().toISOString(),
          status: 'sent',
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        data: data as CommunicationHistory,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('Error sending communication:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send communication',
        success: false,
      };
    }
  }
}

export const studentPaymentsService = new StudentPaymentsService();
