import { PaymentEntity, PaymentEntityData } from './PaymentEntity';
import { PaymentStatus, PaymentType, PaymentPlan } from '@/types/fee';
import { ApiResponse } from '@/types/common';

export interface PaymentFilters {
  studentId?: string;
  cohortId?: string;
  paymentType?: PaymentType;
  paymentPlan?: PaymentPlan;
  status?: PaymentStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
  isPaid?: boolean;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averagePaymentPercentage: number;
}

export interface PaymentRepository {
  // Basic CRUD operations
  findById(id: string): Promise<ApiResponse<PaymentEntity | null>>;
  findByStudentId(studentId: string): Promise<ApiResponse<PaymentEntity[]>>;
  findByCohortId(cohortId: string): Promise<ApiResponse<PaymentEntity[]>>;
  findWithFilters(filters: PaymentFilters): Promise<ApiResponse<PaymentEntity[]>>;
  
  // Create and update
  create(paymentData: Omit<PaymentEntityData, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<PaymentEntity>>;
  update(id: string, updates: Partial<PaymentEntityData>): Promise<ApiResponse<PaymentEntity>>;
  delete(id: string): Promise<ApiResponse<boolean>>;
  
  // Business operations
  recordPayment(id: string, amount: number, paymentDate?: string): Promise<ApiResponse<PaymentEntity>>;
  updateStatus(id: string, status: PaymentStatus, notes?: string): Promise<ApiResponse<PaymentEntity>>;
  addNotes(id: string, notes: string): Promise<ApiResponse<PaymentEntity>>;
  
  // Aggregations and summaries
  getPaymentSummary(cohortId: string): Promise<ApiResponse<PaymentSummary>>;
  getStudentPaymentSummary(studentId: string): Promise<ApiResponse<PaymentSummary>>;
  getOverduePayments(cohortId?: string): Promise<ApiResponse<PaymentEntity[]>>;
  getUpcomingPayments(cohortId?: string, daysAhead?: number): Promise<ApiResponse<PaymentEntity[]>>;
  
  // Bulk operations
  bulkUpdateStatus(ids: string[], status: PaymentStatus, notes?: string): Promise<ApiResponse<PaymentEntity[]>>;
  bulkCreate(payments: Omit<PaymentEntityData, 'id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<PaymentEntity[]>>;
}

// Concrete implementation using Supabase
export class SupabasePaymentRepository implements PaymentRepository {
  private tableName = 'student_payments';

  async findById(id: string): Promise<ApiResponse<PaymentEntity | null>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        success: true,
        data: data ? PaymentEntity.fromJSON(data) : null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to find payment',
      };
    }
  }

  async findByStudentId(studentId: string): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      return {
        success: true,
        data: data?.map(payment => PaymentEntity.fromJSON(payment)) || [],
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to find payments',
      };
    }
  }

  async findByCohortId(cohortId: string): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('cohort_id', cohortId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      return {
        success: true,
        data: data?.map(payment => PaymentEntity.fromJSON(payment)) || [],
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to find payments',
      };
    }
  }

  async findWithFilters(filters: PaymentFilters): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      let query = supabase.from(this.tableName).select('*');

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      if (filters.cohortId) {
        query = query.eq('cohort_id', filters.cohortId);
      }
      if (filters.paymentType) {
        query = query.eq('payment_type', filters.paymentType);
      }
      if (filters.paymentPlan) {
        query = query.eq('payment_plan', filters.paymentPlan);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;

      let payments = data?.map(payment => PaymentEntity.fromJSON(payment)) || [];

      // Apply business logic filters
      if (filters.isOverdue !== undefined) {
        payments = payments.filter(payment => payment.isOverdue === filters.isOverdue);
      }
      if (filters.isPaid !== undefined) {
        payments = payments.filter(payment => payment.isPaid === filters.isPaid);
      }

      return {
        success: true,
        data: payments,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to find payments',
      };
    }
  }

  async create(paymentData: Omit<PaymentEntityData, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<PaymentEntity>> {
    try {
      const payment = PaymentEntity.create(paymentData);
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(payment.toJSON())
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        data: PaymentEntity.fromJSON(data),
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      };
    }
  }

  async update(id: string, updates: Partial<PaymentEntityData>): Promise<ApiResponse<PaymentEntity>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        data: PaymentEntity.fromJSON(data),
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment',
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return {
        success: true,
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : 'Failed to delete payment',
      };
    }
  }

  async recordPayment(id: string, amount: number, paymentDate?: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      // Get current payment
      const currentPayment = await this.findById(id);
      if (!currentPayment.success || !currentPayment.data) {
        throw new Error('Payment not found');
      }

      const payment = currentPayment.data;
      payment.recordPayment(amount, paymentDate);

      // Update in database
      return await this.update(id, payment.toJSON());
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record payment',
      };
    }
  }

  async updateStatus(id: string, status: PaymentStatus, notes?: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      // Get current payment
      const currentPayment = await this.findById(id);
      if (!currentPayment.success || !currentPayment.data) {
        throw new Error('Payment not found');
      }

      const payment = currentPayment.data;
      if (!payment.canUpdateStatus(status)) {
        throw new Error('Invalid status transition');
      }

      payment.updateStatus(status);
      if (notes) {
        payment.addNotes(notes);
      }

      // Update in database
      return await this.update(id, payment.toJSON());
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
      };
    }
  }

  async addNotes(id: string, notes: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      // Get current payment
      const currentPayment = await this.findById(id);
      if (!currentPayment.success || !currentPayment.data) {
        throw new Error('Payment not found');
      }

      const payment = currentPayment.data;
      payment.addNotes(notes);

      // Update in database
      return await this.update(id, payment.toJSON());
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to add notes',
      };
    }
  }

  async getPaymentSummary(cohortId: string): Promise<ApiResponse<PaymentSummary>> {
    try {
      const payments = await this.findByCohortId(cohortId);
      if (!payments.success) {
        throw new Error(payments.error || 'Failed to get payments');
      }

      const summary: PaymentSummary = {
        totalPayments: payments.data.length,
        totalAmount: payments.data.reduce((sum, p) => sum + p.amountPayable, 0),
        paidAmount: payments.data.reduce((sum, p) => sum + p.amountPaid, 0),
        pendingAmount: payments.data.reduce((sum, p) => sum + p.pendingAmount, 0),
        overdueAmount: payments.data
          .filter(p => p.isOverdue)
          .reduce((sum, p) => sum + p.pendingAmount, 0),
        averagePaymentPercentage: payments.data.length > 0
          ? Math.round(payments.data.reduce((sum, p) => sum + p.paymentPercentage, 0) / payments.data.length)
          : 0,
      };

      return {
        success: true,
        data: summary,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payment summary',
      };
    }
  }

  async getStudentPaymentSummary(studentId: string): Promise<ApiResponse<PaymentSummary>> {
    try {
      const payments = await this.findByStudentId(studentId);
      if (!payments.success) {
        throw new Error(payments.error || 'Failed to get payments');
      }

      const summary: PaymentSummary = {
        totalPayments: payments.data.length,
        totalAmount: payments.data.reduce((sum, p) => sum + p.amountPayable, 0),
        paidAmount: payments.data.reduce((sum, p) => sum + p.amountPaid, 0),
        pendingAmount: payments.data.reduce((sum, p) => sum + p.pendingAmount, 0),
        overdueAmount: payments.data
          .filter(p => p.isOverdue)
          .reduce((sum, p) => sum + p.pendingAmount, 0),
        averagePaymentPercentage: payments.data.length > 0
          ? Math.round(payments.data.reduce((sum, p) => sum + p.paymentPercentage, 0) / payments.data.length)
          : 0,
      };

      return {
        success: true,
        data: summary,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payment summary',
      };
    }
  }

  async getOverduePayments(cohortId?: string): Promise<ApiResponse<PaymentEntity[]>> {
    const filters: PaymentFilters = { isOverdue: true };
    if (cohortId) filters.cohortId = cohortId;
    return this.findWithFilters(filters);
  }

  async getUpcomingPayments(cohortId?: string, daysAhead: number = 7): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      const filters: PaymentFilters = {
        dueDateFrom: today.toISOString().split('T')[0],
        dueDateTo: futureDate.toISOString().split('T')[0],
        isPaid: false,
      };
      if (cohortId) filters.cohortId = cohortId;

      return this.findWithFilters(filters);
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to get upcoming payments',
      };
    }
  }

  async bulkUpdateStatus(ids: string[], status: PaymentStatus, notes?: string): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const results: PaymentEntity[] = [];
      
      for (const id of ids) {
        const result = await this.updateStatus(id, status, notes);
        if (result.success && result.data) {
          results.push(result.data);
        }
      }

      return {
        success: true,
        data: results,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to bulk update status',
      };
    }
  }

  async bulkCreate(payments: Omit<PaymentEntityData, 'id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const paymentEntities = payments.map(payment => PaymentEntity.create(payment));
      const paymentData = paymentEntities.map(payment => payment.toJSON());

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(paymentData)
        .select();

      if (error) throw error;
      
      return {
        success: true,
        data: data?.map(payment => PaymentEntity.fromJSON(payment)) || [],
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to bulk create payments',
      };
    }
  }
}

// Import supabase client
import { supabase } from '@/integrations/supabase/client';
