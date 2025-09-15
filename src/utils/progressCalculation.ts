import { StudentPaymentSummary } from '@/types/fee';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { supabase } from '@/integrations/supabase/client';

export interface ProgressCalculationResult {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  progressPercentage: number;
  totalInstallments: number;
  paidInstallments: number;
  admissionFee: number;
  admissionFeePaid: boolean;
  verifiedPayments: number;
  calculationMethod: 'payment_engine' | 'database' | 'fallback';
}

/**
 * Centralized progress calculation utility
 * Ensures consistent progress calculations across all components
 */
export class ProgressCalculator {
  /**
   * Calculate progress using payment engine (most accurate)
   */
  static async calculateWithPaymentEngine(
    student: StudentPaymentSummary,
    feeStructure?: {
      total_program_fee: number;
      admission_fee: number;
      number_of_semesters: number;
      instalments_per_semester: number;
      one_shot_discount_percentage: number;
      one_shot_dates?: Record<string, string>;
      sem_wise_dates?: Record<string, string | Record<string, unknown>>;
      instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
    }
  ): Promise<ProgressCalculationResult> {
    try {
      // Validate required data
      const validPaymentPlans = ['one_shot', 'sem_wise', 'instalment_wise'];

      if (
        !student.student_id ||
        student.student_id === 'undefined' ||
        !student.student?.cohort_id ||
        student.student?.cohort_id === 'undefined' ||
        !student.payment_plan ||
        student.payment_plan === 'not_selected' ||
        student.payment_plan === 'undefined' ||
        !validPaymentPlans.includes(student.payment_plan) ||
        !feeStructure
      ) {
        console.log(
          '🔍 [ProgressCalculator] Skipping payment engine - missing required data:',
          {
            student_id: student.student_id,
            cohort_id: student.student?.cohort_id,
            payment_plan: student.payment_plan,
            hasFeeStructure: !!feeStructure,
          }
        );

        return this.calculateWithDatabase(student);
      }

      // Get custom fee structure if available
      const customFeeStructure = await FeeStructureService.getFeeStructure(
        String(student.student?.cohort_id),
        String(student.student_id)
      );

      const feeStructureToUse = customFeeStructure || feeStructure;

      // Get additional discount percentage from database
      let additionalDiscountPercentage = 0;
      if (student.scholarship_id) {
        try {
          const { data: scholarship } = await supabase
            .from('student_scholarships')
            .select('additional_discount_percentage')
            .eq('student_id', student.student_id)
            .eq('scholarship_id', student.scholarship_id)
            .maybeSingle();

          if (
            scholarship &&
            typeof scholarship.additional_discount_percentage === 'number'
          ) {
            additionalDiscountPercentage =
              scholarship.additional_discount_percentage;
          }
        } catch (error) {
          console.warn('Error fetching additional discount percentage:', error);
        }
      }

      // Get payment engine breakdown
      const { breakdown: feeReview } = await getFullPaymentView({
        studentId: String(student.student_id),
        cohortId: String(student.student?.cohort_id),
        paymentPlan: student.payment_plan as
          | 'one_shot'
          | 'sem_wise'
          | 'instalment_wise',
        scholarshipId: student.scholarship_id || undefined,
        additionalDiscountPercentage,
        feeStructureData: {
          total_program_fee: feeStructureToUse.total_program_fee,
          admission_fee: feeStructureToUse.admission_fee,
          number_of_semesters: feeStructureToUse.number_of_semesters,
          instalments_per_semester: feeStructureToUse.instalments_per_semester,
          one_shot_discount_percentage:
            feeStructureToUse.one_shot_discount_percentage,
          // FIXED: Add missing toggle fields for accurate payment engine calculations
          program_fee_includes_gst:
            (feeStructureToUse as any).program_fee_includes_gst ?? true,
          equal_scholarship_distribution:
            (feeStructureToUse as any).equal_scholarship_distribution ?? false,
          one_shot_dates: feeStructureToUse.one_shot_dates,
          sem_wise_dates: feeStructureToUse.sem_wise_dates,
          instalment_wise_dates: feeStructureToUse.instalment_wise_dates,
        },
      });

      const programFeeAmount =
        feeReview?.overallSummary?.totalAmountPayable || 0;
      const admissionFee =
        feeReview?.admissionFee?.totalPayable ||
        feeStructureToUse.admission_fee;

      // For financial summary, total amount should NOT add admission fee separately
      // because programFeeAmount (totalAmountPayable) already includes admission fee
      const totalAmount = programFeeAmount;

      console.log('🔍 [ProgressCalculator] Total amount calculation:', {
        programFeeAmount,
        admissionFee,
        totalAmount,
        student_id: student.student_id,
      });

      // Get verified payments
      let verifiedPayments = 0;
      if (student.student_payment_id) {
        const txResponse = await paymentTransactionService.getByPaymentId(
          student.student_payment_id
        );

        const txs =
          txResponse?.success && Array.isArray(txResponse.data)
            ? txResponse.data
            : [];

        if (txs.length > 0) {
          const relevantTransactions = txs.filter(
            t => t?.verification_status === 'approved' // Only count approved payments, not verification pending
          );
          verifiedPayments = relevantTransactions.reduce(
            (sum, t) => sum + Number(t?.amount || 0),
            0
          );
        }
      }

      // Calculate paid amount (including admission fee since students are registered)
      const paidAmount = verifiedPayments + admissionFee;
      const pendingAmount = Math.max(0, totalAmount - paidAmount);
      const progressPercentage =
        totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

      // Calculate installments
      const { totalInstallments, paidInstallments } =
        this.calculateInstallments(
          student.payment_plan,
          feeStructureToUse,
          totalAmount,
          admissionFee,
          verifiedPayments
        );

      return {
        totalAmount,
        paidAmount,
        pendingAmount,
        progressPercentage,
        totalInstallments,
        paidInstallments,
        admissionFee,
        admissionFeePaid: true, // Students are registered, so admission fee is considered paid
        verifiedPayments,
        calculationMethod: 'payment_engine',
      };
    } catch (error) {
      console.error('Error calculating progress with payment engine:', error);
      return this.calculateWithDatabase(student);
    }
  }

  /**
   * Calculate progress using database values (fallback)
   */
  static calculateWithDatabase(
    student: StudentPaymentSummary
  ): ProgressCalculationResult {
    const totalAmount = Number(student.total_amount) || 0;
    const paidAmount = Number(student.paid_amount) || 0;
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const progressPercentage =
      totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      progressPercentage,
      totalInstallments: 0, // Not available from database
      paidInstallments: 0, // Not available from database
      admissionFee: 0, // Not available from database
      admissionFeePaid: false,
      verifiedPayments: paidAmount,
      calculationMethod: 'database',
    };
  }

  /**
   * Calculate installments based on payment plan
   */
  private static calculateInstallments(
    paymentPlan: string,
    feeStructure: {
      number_of_semesters: number;
      instalments_per_semester: number;
    },
    totalAmount: number,
    admissionFee: number,
    verifiedPayments: number
  ): { totalInstallments: number; paidInstallments: number } {
    if (paymentPlan === 'one_shot') {
      return {
        totalInstallments: 1,
        paidInstallments: verifiedPayments > 0 ? 1 : 0,
      };
    } else if (paymentPlan === 'sem_wise') {
      const totalInstallments = feeStructure.number_of_semesters;
      const installmentAmount =
        (totalAmount - admissionFee) / totalInstallments;
      const paidInstallments = Math.floor(verifiedPayments / installmentAmount);

      return {
        totalInstallments,
        paidInstallments: Math.min(paidInstallments, totalInstallments),
      };
    } else if (paymentPlan === 'instalment_wise') {
      const totalInstallments =
        feeStructure.number_of_semesters *
        feeStructure.instalments_per_semester;
      const installmentAmount =
        (totalAmount - admissionFee) / totalInstallments;
      const paidInstallments = Math.floor(verifiedPayments / installmentAmount);

      return {
        totalInstallments,
        paidInstallments: Math.min(paidInstallments, totalInstallments),
      };
    }

    return { totalInstallments: 0, paidInstallments: 0 };
  }

  /**
   * Get progress calculation with fallback strategy
   * Tries payment engine first, falls back to database values
   */
  static async getProgress(
    student: StudentPaymentSummary,
    feeStructure?: {
      total_program_fee: number;
      admission_fee: number;
      number_of_semesters: number;
      instalments_per_semester: number;
      one_shot_discount_percentage: number;
      one_shot_dates?: Record<string, string>;
      sem_wise_dates?: Record<string, string | Record<string, unknown>>;
      instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
    }
  ): Promise<ProgressCalculationResult> {
    try {
      return await this.calculateWithPaymentEngine(student, feeStructure);
    } catch (error) {
      console.warn('Falling back to database calculation:', error);
      return this.calculateWithDatabase(student);
    }
  }
}
