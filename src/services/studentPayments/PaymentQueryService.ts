import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import {
  StudentPaymentRow,
  PaymentTransactionRow,
  CommunicationHistoryRow,
  StudentPaymentSummaryRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { Logger } from '@/lib/logging/Logger';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
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

      // Load fee structure and scholarships for payment engine calls
      const { feeStructure, scholarships } = await FeeStructureService.getCompleteFeeStructure(cohortId);
      const { data: studentScholarships } = await studentScholarshipsService.getByCohort(cohortId);

      // Create summary for each student
      const summary: StudentPaymentSummary[] = await Promise.all(
        students.map(async (student) => {
          const studentPayment = payments?.find(p => p.student_id === student.id);
          const studentScholarship = studentScholarships?.find(s => s.student_id === student.id);

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

          // Use payment engine to get accurate aggregate status
          let aggregateStatus = 'pending';
          let totalAmount = studentPayment.total_amount_payable || 0;
          let paidAmount = 0;
          let pendingAmount = 0;
          let overdueAmount = 0;
          let paymentEngineBreakdown = null;

          try {
            if (studentPayment.payment_plan && studentPayment.payment_plan !== 'not_selected') {
              const paymentEngineResult = await getFullPaymentView({
                studentId: student.id,
                cohortId: cohortId,
                paymentPlan: studentPayment.payment_plan as any,
                scholarshipId: studentScholarship?.scholarship_id,
                additionalDiscountPercentage: studentScholarship?.additional_discount_percentage || 0,
                feeStructureData: {
                  total_program_fee: Number(feeStructure.total_program_fee),
                  admission_fee: Number(feeStructure.admission_fee),
                  number_of_semesters: (feeStructure as any).number_of_semesters,
                  instalments_per_semester: (feeStructure as any).instalments_per_semester,
                  one_shot_discount_percentage: (feeStructure as any).one_shot_discount_percentage,
                  one_shot_dates: (feeStructure as any).one_shot_dates,
                  sem_wise_dates: (feeStructure as any).sem_wise_dates,
                  instalment_wise_dates: (feeStructure as any).instalment_wise_dates,
                }
              });

              if (paymentEngineResult.aggregate) {
                aggregateStatus = paymentEngineResult.aggregate.paymentStatus;
                totalAmount = paymentEngineResult.aggregate.totalPayable;
                paidAmount = paymentEngineResult.aggregate.totalPaid;
                pendingAmount = paymentEngineResult.aggregate.totalPending;
                paymentEngineBreakdown = paymentEngineResult.breakdown;
                
                // Include admission fee in paid amount since students have registered
                // This makes the calculation consistent with FinancialSummary modal
                const admissionFee = paymentEngineResult.breakdown?.admissionFee?.totalPayable || 0;
                paidAmount += admissionFee;
                pendingAmount = Math.max(0, totalAmount - paidAmount);
                
                // Calculate overdue amount based on aggregate status
                if (aggregateStatus === 'overdue' || aggregateStatus === 'partially_paid_overdue') {
                  overdueAmount = pendingAmount;
                }
              }
            }
          } catch (error) {
            Logger.getInstance().error(
              'PaymentQueryService: Error calling payment engine for student',
              { error, studentId: student.id, cohortId }
            );
            // Fallback to database values if payment engine fails
            totalAmount = studentPayment.total_amount_payable || 0;
            paidAmount = Math.max(
              studentTransactions
                .filter(t => t.verification_status === 'approved')
                .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
              studentPayment.total_amount_paid || 0
            );
            pendingAmount = Math.max(0, totalAmount - paidAmount);
          }

          return {
            student_id: student.id,
            // expose underlying record id so UI can fetch transactions reliably
            student_payment_id: studentPayment.id,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            pending_amount: pendingAmount,
            overdue_amount: overdueAmount,
            scholarship_name: studentScholarship?.scholarship?.name,
            scholarship_id: studentPayment.scholarship_id || undefined,
            token_fee_paid: false, // TODO: Check if admission fee is paid
            payment_plan: studentPayment.payment_plan || 'not_selected',
            student: student,
            payments: convertedPayments,
            // Calculate installment counts including ₹0 scholarship installments
            total_installments: (() => {
              if (studentPayment.payment_plan === 'one_shot') {
                return 1;
              } else if (studentPayment.payment_plan === 'sem_wise') {
                return 4; // Default: 4 semesters
              } else if (studentPayment.payment_plan === 'instalment_wise') {
                return 12; // Default: 4 semesters × 3 installments
              }
              return 1;
            })(),
            completed_installments: (() => {
              // Count approved transactions
              const paidTransactionCount = studentTransactions.filter(
                t => t.verification_status === 'approved'
              ).length;
              
              // TODO: Use InstallmentCalculationService for accurate scholarship counting
              // For performance reasons, this is currently just transaction count
              // To get accurate scholarship installment counting, use:
              // InstallmentCalculationService.calculateInstallmentCounts()
              
              return paidTransactionCount;
            })(),
            // Add aggregate status from payment engine
            aggregate_status: aggregateStatus,
            // Add payment engine breakdown for accurate next due calculation
            payment_engine_breakdown: paymentEngineBreakdown,
          };
        })
      );

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
