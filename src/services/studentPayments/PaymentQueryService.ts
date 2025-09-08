import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import {
  StudentPaymentRow,
  PaymentTransactionRow,
  CommunicationHistoryRow,
  StudentPaymentSummaryRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { Logger } from '@/lib/logging/Logger';
import {
  getFullPaymentView,
  getBatchPaymentSummary,
} from '@/services/payments/paymentEngineClient';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';

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
      console.log(
        '🚀 [PaymentQueryService] Starting batch payment summary for cohort:',
        cohortId
      );

      // First, get all students in the cohort
      const { data: students, error: studentsError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId)
        .neq('dropped_out_status', 'dropped_out');

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

      console.log(
        `🚀 [PaymentQueryService] Found ${students.length} students, using batch processing`
      );

      // Get fee structure once for the entire batch
      const { feeStructure } =
        await FeeStructureService.getCompleteFeeStructure(cohortId);

      // Prepare fee structure data for batch processing
      const feeStructureData = feeStructure
        ? {
            total_program_fee: Number(feeStructure.total_program_fee),
            admission_fee: Number(feeStructure.admission_fee),
            number_of_semesters: (feeStructure as Record<string, unknown>)
              .number_of_semesters as number,
            instalments_per_semester: (feeStructure as Record<string, unknown>)
              .instalments_per_semester as number,
            one_shot_discount_percentage: (
              feeStructure as Record<string, unknown>
            ).one_shot_discount_percentage as number,
            program_fee_includes_gst:
              (feeStructure as Record<string, unknown>)
                .program_fee_includes_gst ?? true,
            equal_scholarship_distribution:
              (feeStructure as Record<string, unknown>)
                .equal_scholarship_distribution ?? false,
            one_shot_dates: (feeStructure as Record<string, unknown>)
              .one_shot_dates as Record<string, string>,
            sem_wise_dates: (feeStructure as Record<string, unknown>)
              .sem_wise_dates as Record<string, unknown>,
            instalment_wise_dates: (feeStructure as Record<string, unknown>)
              .instalment_wise_dates as Record<string, unknown>,
          }
        : undefined;

      // Use batch payment engine call instead of individual calls
      const batchResult = await getBatchPaymentSummary({
        cohortId,
        studentIds: students.map(s => s.id),
        feeStructureData,
      });

      if (!batchResult.success) {
        throw new Error('Batch payment summary failed');
      }

      console.log('✅ [PaymentQueryService] Batch processing completed:', {
        processed: batchResult.data.length,
        cohortId,
      });

      // Map batch results to the expected format and include student data
      const summary: StudentPaymentSummary[] = batchResult.data.map(
        (batchItem, index) => {
          const student = students[index];
          return {
            ...batchItem,
            student: student,
            token_fee_paid: false, // TODO: Check if admission fee is paid
          };
        }
      );

      return {
        data: summary,
        error: null,
        success: true,
        statistics: batchResult.statistics, // Include server-calculated statistics
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
}
