/**
 * Student Payment Service
 * Handles student payment operations with single responsibility
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { 
  StudentPayment, 
  StudentPaymentSummary,
  PaymentStatus,
  PaymentPlan
} from '@/types/payments';
import { CohortStudent } from '@/types/cohort';
import { Logger } from '@/lib/logging/Logger';

export interface StudentPaymentFilters {
  cohortId?: string;
  studentId?: string;
  status?: PaymentStatus;
  paymentPlan?: PaymentPlan;
  dueDateFrom?: string;
  dueDateTo?: string;
}

class StudentPaymentService {
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
      Logger.getInstance().error('StudentPaymentService: Error fetching student payments', { error, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payments',
        success: false,
      };
    }
  }

  /**
   * Get student payments by student ID
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
      Logger.getInstance().error('StudentPaymentService: Error fetching student payment by student ID', { error, studentId, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payment',
        success: false,
      };
    }
  }

  /**
   * Get student payment summary for a cohort
   */
  async getStudentPaymentSummary(cohortId: string): Promise<ApiResponse<StudentPaymentSummary[]>> {
    try {
      // First, get all students in the cohort
      const { data: students, error: studentsError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId);

      if (studentsError) {
        Logger.getInstance().error('StudentPaymentService: Students query error in getStudentPaymentSummary', { error: studentsError, cohortId });
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
        Logger.getInstance().error('StudentPaymentService: Payments query error in getStudentPaymentSummary', { error: paymentsError, cohortId });
        throw paymentsError;
      }

      // Get scholarships for these students
      const { data: scholarships, error: scholarshipsError } = await supabase
        .from('student_scholarships')
        .select(`
          *,
          scholarship:scholarships(*)
        `)
        .in('student_id', studentIds);

      if (scholarshipsError) {
        Logger.getInstance().error('StudentPaymentService: Scholarships query error in getStudentPaymentSummary', { error: scholarshipsError, cohortId });
        throw scholarshipsError;
      }

      // Create a map of student scholarships
      const scholarshipMap = new Map();
      scholarships?.forEach(scholarship => {
        scholarshipMap.set(scholarship.student_id, scholarship);
      });

      // Calculate summary for each student
      const summary: StudentPaymentSummary[] = students.map(student => {
        const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
        const studentScholarship = scholarshipMap.get(student.id);

        const totalAmount = studentPayments.reduce((sum, payment) => sum + payment.amount_payable, 0);
        const paidAmount = studentPayments.reduce((sum, payment) => sum + payment.amount_paid, 0);
        const pendingAmount = totalAmount - paidAmount;
        const overdueAmount = studentPayments
          .filter(payment => payment.status === 'overdue')
          .reduce((sum, payment) => sum + (payment.amount_payable - payment.amount_paid), 0);

        const tokenFeePaid = studentPayments.some(payment => 
          payment.payment_type === 'admission_fee' && payment.status === 'paid'
        );

        return {
          student_id: student.id,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          overdue_amount: overdueAmount,
          scholarship_name: studentScholarship?.scholarship?.name,
          scholarship_percentage: studentScholarship?.scholarship?.amount_percentage,
          token_fee_paid: tokenFeePaid,
          payment_plan: studentPayments[0]?.payment_plan || 'not_selected',
          student: student,
          payments: studentPayments
        };
      });

      return {
        data: summary,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('StudentPaymentService: Error fetching student payment summary', { error, cohortId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payment summary',
        success: false,
      };
    }
  }

  /**
   * Update payment status
   */
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
      Logger.getInstance().error('StudentPaymentService: Error updating payment status', { error, paymentId, status });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
        success: false,
      };
    }
  }

  /**
   * Update student payment plan
   */
  async updateStudentPaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    scholarshipId?: string,
    forceUpdate: boolean = false
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      // Check if student already has a payment plan
      const { data: existingPayments, error: existingError } = await supabase
        .from('student_payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId);

      if (existingError) throw existingError;

      if (existingPayments && existingPayments.length > 0 && !forceUpdate) {
        return {
          data: { success: false, message: 'Student already has a payment plan. Use forceUpdate to override.' },
          error: null,
          success: true,
        };
      }

      // If force update, delete existing payments
      if (forceUpdate && existingPayments && existingPayments.length > 0) {
        const { error: deleteError } = await supabase
          .from('student_payments')
          .delete()
          .eq('student_id', studentId)
          .eq('cohort_id', cohortId);

        if (deleteError) throw deleteError;
      }

      // Update or create scholarship assignment
      if (scholarshipId) {
        const { error: scholarshipError } = await supabase
          .from('student_scholarships')
          .upsert({
            student_id: studentId,
            scholarship_id: scholarshipId,
            additional_discount_percentage: 0,
            assigned_at: new Date().toISOString()
          });

        if (scholarshipError) throw scholarshipError;
      }

      return {
        data: { success: true, message: 'Payment plan updated successfully' },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('StudentPaymentService: Error updating student payment plan', { error, studentId, cohortId, paymentPlan });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment plan',
        success: false,
      };
    }
  }

  /**
   * Get student payments with filters
   */
  async getStudentPaymentsWithFilters(filters: StudentPaymentFilters): Promise<ApiResponse<StudentPayment[]>> {
    try {
      let query = supabase
        .from('student_payments')
        .select(`
          *,
          student:cohort_students(*)
        `);

      if (filters.cohortId) {
        query = query.eq('cohort_id', filters.cohortId);
      }

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.paymentPlan) {
        query = query.eq('payment_plan', filters.paymentPlan);
      }

      if (filters.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }

      if (filters.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      query = query.order('due_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data as StudentPayment[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('StudentPaymentService: Error fetching student payments with filters', { error, filters });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch student payments',
        success: false,
      };
    }
  }
}

export const studentPaymentService = new StudentPaymentService();
