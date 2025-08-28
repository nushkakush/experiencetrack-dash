/**
 * Service for calculating installment counts including scholarship-covered (₹0) installments
 */

import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { Logger } from '@/lib/logging/Logger';

export interface InstallmentCounts {
  total_installments: number;
  completed_installments: number;
  scholarship_installments: number;
  paid_installments: number;
}

export class InstallmentCalculationService {
  /**
   * Calculate installment counts for a student including scholarship installments
   */
  static async calculateInstallmentCounts(
    studentId: string,
    cohortId: string,
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise',
    scholarshipId?: string,
    paidTransactionCount: number = 0,
    feeStructureData?: any
  ): Promise<InstallmentCounts> {
    try {
      // Call payment engine to get actual breakdown
      const response = await getFullPaymentView({
        studentId,
        cohortId,
        paymentPlan,
        scholarshipId,
        feeStructureData: {
          ...feeStructureData,
          program_fee_includes_gst:
            feeStructureData?.program_fee_includes_gst ?? true,
          equal_scholarship_distribution:
            feeStructureData?.equal_scholarship_distribution ?? false,
        },
      });

      const breakdown = response.breakdown;
      let totalInstallments = 0;
      let scholarshipInstallments = 0;

      if (paymentPlan === 'one_shot') {
        totalInstallments = 1;
        // Check if the one-shot payment is ₹0 due to scholarship
        if (breakdown.oneShotPayment?.amountPayable === 0) {
          scholarshipInstallments = 1;
        }
      } else if (breakdown.semesters && Array.isArray(breakdown.semesters)) {
        // Count installments from payment engine breakdown
        breakdown.semesters.forEach((semester: any) => {
          const instalments = semester.instalments || [];
          if (Array.isArray(instalments)) {
            totalInstallments += instalments.length;

            // Count ₹0 installments (scholarship-covered)
            instalments.forEach((installment: any) => {
              const amountPayable = Number(installment.amountPayable || 0);
              if (amountPayable === 0) {
                scholarshipInstallments++;
              }
            });
          }
        });
      }

      const paidInstallments = paidTransactionCount;
      const completedInstallments = paidInstallments + scholarshipInstallments;

      Logger.getInstance().info(
        `InstallmentCalculationService: Student ${studentId} - Total: ${totalInstallments}, Paid: ${paidInstallments}, Scholarship: ${scholarshipInstallments}, Completed: ${completedInstallments}`
      );

      return {
        total_installments: totalInstallments,
        completed_installments: completedInstallments,
        scholarship_installments: scholarshipInstallments,
        paid_installments: paidInstallments,
      };
    } catch (error) {
      Logger.getInstance().error(
        `InstallmentCalculationService: Error calculating for student ${studentId}:`,
        error
      );

      // Fallback to default calculation
      let defaultTotal = 1;
      if (paymentPlan === 'sem_wise') {
        defaultTotal = 4;
      } else if (paymentPlan === 'instalment_wise') {
        defaultTotal = 12;
      }

      return {
        total_installments: defaultTotal,
        completed_installments: paidTransactionCount,
        scholarship_installments: 0,
        paid_installments: paidTransactionCount,
      };
    }
  }

  /**
   * Batch calculate installment counts for multiple students
   * This can be optimized to reduce API calls
   */
  static async batchCalculateInstallmentCounts(
    students: Array<{
      studentId: string;
      cohortId: string;
      paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise';
      scholarshipId?: string;
      paidTransactionCount: number;
    }>,
    feeStructureData?: any
  ): Promise<Record<string, InstallmentCounts>> {
    const results: Record<string, InstallmentCounts> = {};

    // For now, calculate individually
    // TODO: Optimize with batch API calls or caching
    for (const student of students) {
      results[student.studentId] = await this.calculateInstallmentCounts(
        student.studentId,
        student.cohortId,
        student.paymentPlan,
        student.scholarshipId,
        student.paidTransactionCount,
        feeStructureData
      );
    }

    return results;
  }
}
