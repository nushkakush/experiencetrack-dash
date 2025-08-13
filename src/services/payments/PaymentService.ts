import { BaseService } from '../base.service';
import { ApiResponse, PaginatedResponse } from '@/types/common';
import { 
  PaymentStatus, 
  PaymentType
} from '@/types/fee';
import { apiClient } from '@/api/client';
import { 
  StudentPaymentRow,
  PaymentTransactionRow,
  Student,
  PaymentSummary,
  StudentScholarship
} from '@/types/payments/PaymentServiceTypes';

export class PaymentService extends BaseService<StudentPaymentRow> {
  constructor() {
    super('student_payments');
  }

  /**
   * Get all payments for a cohort
   */
  async getCohortPayments(cohortId: string): Promise<ApiResponse<StudentPaymentRow[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await apiClient.get(`/rest/v1/${this.tableName}`, {
        headers: {
          'cohort_id': `eq.${cohortId}`,
          'order': 'due_date.asc'
        }
      });

      if (error) throw new Error(error);
      return { data, error: null };
    });
  }

  /**
   * Get payment summary for a cohort
   */
  async getPaymentSummary(cohortId: string): Promise<ApiResponse<PaymentSummary[]>> {
    return this.executeQuery(async () => {
      // Get all students in the cohort
      const { data: students, error: studentsError } = await apiClient.get('/rest/v1/cohort_students', {
        headers: {
          'cohort_id': `eq.${cohortId}`
        }
      });

      if (studentsError) throw new Error(studentsError);
      if (!students || students.length === 0) {
        return { data: [], error: null };
      }

      const studentIds = students.map((s: Student) => s.id);

      // Get payments for these students
      const { data: payments, error: paymentsError } = await apiClient.get(`/rest/v1/${this.tableName}`, {
        headers: {
          'student_id': `in.(${studentIds.join(',')})`
        }
      });

      if (paymentsError) throw new Error(paymentsError);

      // Get scholarships for these students
      const { data: scholarships, error: scholarshipsError } = await apiClient.get('/rest/v1/student_scholarships', {
        headers: {
          'student_id': `in.(${studentIds.join(',')})`
        }
      });

      if (scholarshipsError) throw new Error(scholarshipsError);

      // Calculate payment summaries
      const summaries = students.map((student: Student) => {
        const studentPayments = payments?.filter((p: StudentPaymentRow) => p.student_id === student.id) || [];
        const studentScholarship = scholarships?.find((s: StudentScholarship) => s.student_id === student.id);

        const totalAmount = studentPayments.reduce((sum: number, p: StudentPaymentRow) => sum + p.amount_payable, 0);
        const paidAmount = studentPayments.reduce((sum: number, p: StudentPaymentRow) => sum + p.amount_paid, 0);
        const pendingAmount = totalAmount - paidAmount;
        const overdueAmount = studentPayments
          .filter((p: StudentPaymentRow) => p.status === 'overdue')
          .reduce((sum: number, p: StudentPaymentRow) => sum + p.amount_payable - p.amount_paid, 0);

        return {
          student_id: student.id,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          overdue_amount: overdueAmount,
          scholarship_name: studentScholarship?.scholarship?.name,
          scholarship_id: studentScholarship?.scholarship?.id,
          token_fee_paid: studentPayments.some((p: StudentPaymentRow) => p.payment_type === 'admission_fee' && p.status === 'paid'),
          payment_plan: studentPayments[0]?.payment_plan || 'not_selected',
          student,
          payments: studentPayments,
        };
      });

      return { data: summaries, error: null };
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string, 
    status: PaymentStatus, 
    notes?: string
  ): Promise<ApiResponse<StudentPaymentRow>> {
    return this.executeQuery(async () => {
              const updateData: Partial<StudentPaymentRow> = { status };
      if (notes) updateData.notes = notes;

      const { data, error } = await apiClient.patch(`/rest/v1/${this.tableName}`, updateData, {
        headers: {
          'id': `eq.${paymentId}`
        }
      });

      if (error) throw new Error(error);
      return { data: data?.[0], error: null };
    });
  }

  /**
   * Record a payment transaction
   */
  async recordPayment(
    paymentId: string,
    amount: number,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<ApiResponse<PaymentTransactionRow>> {
    return this.executeQuery(async () => {
      // Create payment transaction record
      const transactionData = {
        payment_id: paymentId,
        transaction_type: 'payment',
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        status: 'success',
        notes,
      };

      const { data, error } = await apiClient.post('/rest/v1/payment_transactions', transactionData);

      if (error) throw new Error(error);

      // Update the payment record
      const { data: paymentData, error: paymentError } = await apiClient.patch(`/rest/v1/${this.tableName}`, {
        amount_paid: amount,
        payment_date: new Date().toISOString(),
        status: 'paid'
      }, {
        headers: {
          'id': `eq.${paymentId}`
        }
      });

      if (paymentError) throw new Error(paymentError);

      return { data: data?.[0], error: null };
    });
  }

  /**
   * Get payment transactions for a payment
   */
  async getPaymentTransactions(paymentId: string): Promise<ApiResponse<PaymentTransactionRow[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await apiClient.get('/rest/v1/payment_transactions', {
        headers: {
          'payment_id': `eq.${paymentId}`,
          'order': 'created_at.desc'
        }
      });

      if (error) throw new Error(error);
      return { data, error: null };
    });
  }
}
