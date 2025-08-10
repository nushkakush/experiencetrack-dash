/**
 * Fee calculation utilities - Main entry point
 * 
 * This module provides a unified interface for all fee-related calculations.
 * It combines functionality from specialized modules:
 * - GST calculations
 * - Scholarship calculations  
 * - Payment plan calculations
 * - Semester calculations
 */

import { FeeStructure, Scholarship, PaymentPlan, FeeStructureReview } from '@/types/fee';

// Import all calculation modules
export * from './gst';
export * from './scholarships';
export * from './payment-plans';
export * from './semesters';

// Re-export commonly used functions for backward compatibility
import { calculateGST, extractGSTFromTotal, extractBaseAmountFromTotal } from './gst';
import { calculateScholarshipAmount, validateScholarshipRanges } from './scholarships';
import { calculateOneShotDiscount, calculateTotalPayable, getInstalmentDistribution, calculateOneShotPayment } from './payment-plans';
import { calculateAdmissionFee, calculateSemesterFee, generateSemesterPaymentDates } from './semesters';

/**
 * Generate complete fee structure review
 * This is the main function that combines all calculations
 */
export const generateFeeStructureReview = (
  feeStructure: FeeStructure,
  scholarships: Scholarship[],
  paymentPlan: PaymentPlan,
  testScore: number = 0,
  cohortStartDate: string,
  selectedScholarshipId?: string
): FeeStructureReview => {
  const selectedScholarship = selectedScholarshipId 
    ? scholarships.find(s => s.id === selectedScholarshipId)
    : null;
  
  const scholarshipAmount = selectedScholarship 
    ? calculateScholarshipAmount(feeStructure.total_program_fee, testScore, [selectedScholarship])
    : 0;
  
  // Calculate admission fee
  const admissionFee = calculateAdmissionFee(feeStructure.admission_fee);
  
  // Calculate one-shot discount
  // Extract base amount from admission fee (since it already includes GST)
  const admissionFeeBase = extractBaseAmountFromTotal(feeStructure.admission_fee);
  const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);
  
  // Program fee (excluding admission fee)
  const programFeeOnly = feeStructure.total_program_fee - feeStructure.admission_fee;
  
  // Calculate program fee GST
  const programFeeGST = calculateGST(programFeeOnly);
  
  // Total base amount and GST
  const totalBaseAmount = programFeeOnly + admissionFeeBase;
  const totalGSTAmount = programFeeGST + admissionFeeGST;
  const totalWithGST = totalBaseAmount + totalGSTAmount;
  
  const oneShotDiscount = paymentPlan === 'one_shot' 
    ? calculateOneShotDiscount(totalWithGST, feeStructure.one_shot_discount_percentage)
    : 0;
  
  // Calculate semesters
  const semesters = [];
  if (paymentPlan === 'sem_wise' || paymentPlan === 'instalment_wise') {
    for (let i = 1; i <= feeStructure.number_of_semesters; i++) {
      const semester = calculateSemesterFee(
        i,
        feeStructure.total_program_fee,
        feeStructure.admission_fee,
        feeStructure.number_of_semesters,
        feeStructure.instalments_per_semester,
        cohortStartDate,
        scholarshipAmount,
        oneShotDiscount,
        paymentPlan
      );
      semesters.push(semester);
    }
  }
  
  // Calculate overall summary
  const totalProgramFee = programFeeOnly;
  const totalGST = programFeeGST + admissionFeeGST;
  const totalDiscount = oneShotDiscount;
  const totalAmountPayable = totalWithGST - totalDiscount - scholarshipAmount;
  
  return {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: feeStructure.admission_fee
    },
    semesters,
    overallSummary: {
      totalProgramFee,
      admissionFee: feeStructure.admission_fee,
      totalGST,
      totalDiscount,
      totalAmountPayable: Math.max(0, totalAmountPayable)
    }
  };
};

// Export the main function for backward compatibility
export { generateFeeStructureReview as default };
