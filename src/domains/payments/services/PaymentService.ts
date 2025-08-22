/**
 * Payment Domain Service
 * Centralizes all payment-related business logic and data access
 */

import { getApiClient, ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';

export interface Payment {
  id: string;
  student_id: string;
  cohort_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'razorpay';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'verification_pending';
  transaction_id?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlan {
  id: string;
  student_id: string;
  plan_type: 'one_shot' | 'sem_wise' | 'instalment_wise';
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  next_due_date?: string;
  status: 'active' | 'completed' | 'suspended';
}

export interface PaymentScheduleItem {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  payment_id?: string;
  semester_number?: number;
}

export interface PaymentFilters {
  status?: Payment['status'];
  paymentMethod?: Payment['payment_method'];
  studentId?: string;
  cohortId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  limit?: number;
  offset?: number;
}

export interface PaymentStats {
  totalCollected: number;
  pendingAmount: number;
  overdueAmount: number;
  totalStudents: number;
  paidStudents: number;
  pendingStudents: number;
  collectionRate: number;
}

export class PaymentService {
  private apiClient = getApiClient();
  private logger = Logger.getInstance();

  /**
   * Fetch payments with filtering and pagination
   */
  async getPayments(filters: PaymentFilters = {}): Promise<ApiResponse<Payment[]>> {
    try {
      let query = this.apiClient.select('payments', `
        *,
        student:students(*),
        cohort:cohorts(*)
      `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      if (filters.cohortId) {
        query = query.eq('cohort_id', filters.cohortId);
      }

      if (filters.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('payment_date', filters.dateTo);
      }

      if (filters.amountMin) {
        query = query.gte('amount', filters.amountMin);
      }

      if (filters.amountMax) {
        query = query.lte('amount', filters.amountMax);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const result = await query.order('payment_date', { ascending: false });

      return {
        data: result.data as Payment[],
        error: result.error?.message || null,
        success: !result.error,
      };
    } catch (error) {
      this.logger.error('Failed to fetch payments', { error, filters });
      return {
        data: null,
        error: 'Failed to fetch payments',
        success: false,
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<ApiResponse<Payment>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('payments', `
          *,
          student:students(*),
          cohort:cohorts(*)
        `)
        .eq('id', paymentId)
        .maybeSingle(),
      { cache: true }
    );
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Payment>> {
    return this.apiClient.insert('payments', {
      ...paymentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string, 
    status: Payment['status'], 
    transactionId?: string
  ): Promise<ApiResponse<Payment>> {
    return this.apiClient.update(
      'payments',
      {
        status,
        transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', paymentId)
    );
  }

  /**
   * Process payment verification
   */
  async verifyPayment(paymentId: string, receiptUrl?: string): Promise<ApiResponse<Payment>> {
    return this.apiClient.update(
      'payments',
      {
        status: 'verification_pending',
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', paymentId)
    );
  }

  /**
   * Get student payment plan
   */
  async getStudentPaymentPlan(studentId: string): Promise<ApiResponse<PaymentPlan>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('payment_plans', '*')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .maybeSingle(),
      { cache: true }
    );
  }

  /**
   * Get payment schedule for a plan
   */
  async getPaymentSchedule(planId: string): Promise<ApiResponse<PaymentScheduleItem[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('payment_schedule_items', `
          *,
          payment:payments(*)
        `)
        .eq('payment_plan_id', planId)
        .order('due_date', { ascending: true }),
      { cache: true }
    );
  }

  /**
   * Get payment statistics for a cohort
   */
  async getCohortPaymentStats(cohortId: string): Promise<ApiResponse<PaymentStats>> {
    try {
      // This would be better implemented as a database view
      const [paymentsResult, plansResult] = await Promise.all([
        this.getPayments({ cohortId, limit: 1000 }),
        this.getCohortPaymentPlans(cohortId),
      ]);

      if (!paymentsResult.success) {
        return paymentsResult as any;
      }

      const payments = paymentsResult.data || [];
      const plans = plansResult.data || [];

      const stats: PaymentStats = {
        totalCollected: payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0),
        pendingAmount: plans.reduce((sum, p) => sum + p.remaining_amount, 0),
        overdueAmount: this.calculateOverdueAmount(plans),
        totalStudents: plans.length,
        paidStudents: plans.filter(p => p.remaining_amount === 0).length,
        pendingStudents: plans.filter(p => p.remaining_amount > 0).length,
        collectionRate: plans.length > 0 
          ? (plans.filter(p => p.remaining_amount === 0).length / plans.length) * 100 
          : 0,
      };

      return {
        data: stats,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to fetch payment stats', { error, cohortId });
      return {
        data: null,
        error: 'Failed to fetch payment statistics',
        success: false,
      };
    }
  }

  /**
   * Get payment plans for a cohort
   */
  private async getCohortPaymentPlans(cohortId: string): Promise<ApiResponse<PaymentPlan[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('payment_plans', `
          *,
          student:students!inner(cohort_assignments!inner(cohort_id))
        `)
        .eq('student.cohort_assignments.cohort_id', cohortId)
        .eq('status', 'active'),
      { cache: true }
    );
  }

  /**
   * Calculate overdue amount from payment plans
   */
  private calculateOverdueAmount(plans: PaymentPlan[]): number {
    const now = new Date();
    return plans
      .filter(plan => plan.next_due_date && new Date(plan.next_due_date) < now)
      .reduce((sum, plan) => sum + plan.remaining_amount, 0);
  }

  /**
   * Submit payment for processing
   */
  async submitPayment(paymentData: {
    studentId: string;
    cohortId: string;
    amount: number;
    paymentMethod: Payment['payment_method'];
    receipt?: File;
    notes?: string;
  }): Promise<ApiResponse<Payment>> {
    try {
      // Upload receipt if provided
      let receiptUrl: string | undefined;
      if (paymentData.receipt) {
        const uploadResult = await this.uploadReceipt(paymentData.receipt);
        if (!uploadResult.success) {
          return uploadResult as any;
        }
        receiptUrl = uploadResult.data;
      }

      // Create payment record
      return this.createPayment({
        student_id: paymentData.studentId,
        cohort_id: paymentData.cohortId,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        payment_date: new Date().toISOString(),
        status: receiptUrl ? 'verification_pending' : 'pending',
        receipt_url: receiptUrl,
        notes: paymentData.notes,
      });
    } catch (error) {
      this.logger.error('Failed to submit payment', { error, paymentData });
      return {
        data: null,
        error: 'Failed to submit payment',
        success: false,
      };
    }
  }

  /**
   * Upload payment receipt
   */
  private async uploadReceipt(file: File): Promise<ApiResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `receipts/${Date.now()}_${Math.random().toString(36)}.${fileExt}`;

      const { data, error } = await this.apiClient.storage
        .from('payment-receipts')
        .upload(fileName, file);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const { data: urlData } = this.apiClient.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      return {
        data: urlData.publicUrl,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to upload receipt', { error });
      return {
        data: null,
        error: 'Failed to upload receipt',
        success: false,
      };
    }
  }

  /**
   * Get pending payments requiring verification
   */
  async getPendingVerifications(cohortId?: string): Promise<ApiResponse<Payment[]>> {
    const filters: PaymentFilters = {
      status: 'verification_pending',
      ...(cohortId && { cohortId }),
      limit: 100,
    };

    return this.getPayments(filters);
  }

  /**
   * Approve payment verification
   */
  async approvePayment(paymentId: string): Promise<ApiResponse<Payment>> {
    return this.updatePaymentStatus(paymentId, 'completed');
  }

  /**
   * Reject payment verification
   */
  async rejectPayment(paymentId: string, reason?: string): Promise<ApiResponse<Payment>> {
    return this.apiClient.update(
      'payments',
      {
        status: 'failed',
        notes: reason,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', paymentId)
    );
  }

  /**
   * Subscribe to payment changes
   */
  subscribeToPaymentChanges(callback: (payload: any) => void) {
    const channel = this.apiClient.createChannel('payments-changes');
    
    channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        }, 
        callback
      )
      .subscribe();

    return () => {
      this.apiClient.removeChannel('payments-changes');
    };
  }
}

// Singleton instance
let paymentServiceInstance: PaymentService | null = null;

export const getPaymentService = (): PaymentService => {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService();
  }
  return paymentServiceInstance;
};

export const paymentService = getPaymentService();
