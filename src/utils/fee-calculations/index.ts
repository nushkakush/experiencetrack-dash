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
import { calculateOneShotDiscount, calculateTotalPayable, getInstalmentDistribution, calculateOneShotPayment, calculateSemesterPayment } from './payment-plans';
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
  
  // Calculate scholarship amount directly from selected scholarship, not based on test score
  const scholarshipAmount = selectedScholarship 
    ? Math.round(feeStructure.total_program_fee * (selectedScholarship.amount_percentage / 100) * 100) / 100
    : 0;

  console.log('generateFeeStructureReview - Scholarship calculation:', {
    selectedScholarshipId,
    selectedScholarship,
    testScore,
    totalProgramFee: feeStructure.total_program_fee,
    scholarshipAmount,
    numberOfSemesters: feeStructure.number_of_semesters
  });
  
  // Calculate admission fee
  const admissionFee = calculateAdmissionFee(feeStructure.admission_fee);
  
  // Calculate semesters based on payment plan
  const semesters = [];
  if (paymentPlan === 'sem_wise' || paymentPlan === 'instalment_wise') {
    for (let i = 1; i <= feeStructure.number_of_semesters; i++) {
      const semesterInstallments = calculateSemesterPayment(
        i,
        feeStructure.total_program_fee,
        feeStructure.admission_fee,
        feeStructure.number_of_semesters,
        feeStructure.instalments_per_semester,
        cohortStartDate,
        scholarshipAmount,
        0 // No one-shot discount for semester payments
      );
      
      // Calculate semester totals
      const semesterTotal = {
        scholarshipAmount: semesterInstallments.reduce((sum, inst) => sum + inst.scholarshipAmount, 0),
        baseAmount: semesterInstallments.reduce((sum, inst) => sum + inst.baseAmount, 0),
        gstAmount: semesterInstallments.reduce((sum, inst) => sum + inst.gstAmount, 0),
        discountAmount: semesterInstallments.reduce((sum, inst) => sum + inst.discountAmount, 0),
        totalPayable: semesterInstallments.reduce((sum, inst) => sum + inst.amountPayable, 0)
      };
      
      semesters.push({
        semesterNumber: i,
        instalments: semesterInstallments,
        total: semesterTotal
      });
    }
  }
  
  // Calculate one-shot payment if applicable
  let oneShotPayment = null;
  if (paymentPlan === 'one_shot') {
    oneShotPayment = calculateOneShotPayment(
      feeStructure.total_program_fee,
      feeStructure.admission_fee,
      feeStructure.one_shot_discount_percentage,
      scholarshipAmount,
      cohortStartDate
    );
  }
  
  // Calculate overall summary
  const programFeeOnly = feeStructure.total_program_fee - feeStructure.admission_fee;
  const admissionFeeBase = extractBaseAmountFromTotal(feeStructure.admission_fee);
  const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);
  
  // Calculate GST on program fee after scholarship (GST exclusive amount)
  const programFeeAfterScholarship = programFeeOnly - scholarshipAmount;
  const programFeeGST = calculateGST(programFeeAfterScholarship);
  
  const totalProgramFee = programFeeOnly; // GST exclusive
  const totalGST = programFeeGST + admissionFeeGST;
  
  // Calculate total discount (one-shot discount)
  const totalDiscount = paymentPlan === 'one_shot' 
    ? calculateOneShotDiscount(programFeeAfterScholarship + admissionFeeBase, feeStructure.one_shot_discount_percentage)
    : 0;
  
  const totalAmountPayable = programFeeAfterScholarship + admissionFeeBase + totalGST - totalDiscount;
  
  return {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: feeStructure.admission_fee
    },
    semesters,
    oneShotPayment,
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
