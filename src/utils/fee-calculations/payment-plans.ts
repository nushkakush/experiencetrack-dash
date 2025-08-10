import { PaymentPlan, PaymentBreakdown } from '@/types/fee';
import { calculateGST, extractGSTFromTotal, extractBaseAmountFromTotal } from './gst';

/**
 * Payment plan calculation utilities
 * Handles all payment plan-related calculations for fee structures
 */

/**
 * Calculate one-shot payment discount
 */
export const calculateOneShotDiscount = (
  totalWithGST: number,
  discountPercentage: number
): number => {
  return Math.round(totalWithGST * (discountPercentage / 100) * 100) / 100;
};

/**
 * Calculate total payable amount
 */
export const calculateTotalPayable = (
  baseAmount: number,
  gstAmount: number,
  oneShotDiscount: number,
  scholarshipAmount: number
): number => {
  const totalWithGST = baseAmount + gstAmount;
  const finalAmount = totalWithGST - oneShotDiscount - scholarshipAmount;
  return Math.max(0, Math.round(finalAmount * 100) / 100);
};

/**
 * Get instalment percentage distribution based on number of instalments
 */
export const getInstalmentDistribution = (instalmentsPerSemester: number): number[] => {
  switch (instalmentsPerSemester) {
    case 2:
      return [60, 40];
    case 3:
      return [40, 40, 20];
    case 4:
      return [30, 30, 30, 10];
    default:
      // Even distribution for other numbers
      const percentage = 100 / instalmentsPerSemester;
      return Array(instalmentsPerSemester).fill(percentage);
  }
};

/**
 * Calculate one-shot payment breakdown
 */
export const calculateOneShotPayment = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number = 0,
  cohortStartDate: string
): PaymentBreakdown => {
  // Calculate admission fee breakdown
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);
  
  // Program fee (excluding admission fee)
  const programFeeOnly = totalProgramFee - admissionFee;
  const programFeeGST = calculateGST(programFeeOnly);
  
  // Total base amount and GST
  const totalBaseAmount = programFeeOnly + admissionFeeBase;
  const totalGSTAmount = programFeeGST + admissionFeeGST;
  const totalWithGST = totalBaseAmount + totalGSTAmount;
  
  // Calculate one-shot discount
  const oneShotDiscount = calculateOneShotDiscount(totalWithGST, discountPercentage);
  
  // Calculate final payable amount
  const finalAmount = calculateTotalPayable(totalBaseAmount, totalGSTAmount, oneShotDiscount, scholarshipAmount);
  
  return {
    paymentDate: cohortStartDate,
    baseAmount: totalBaseAmount,
    gstAmount: totalGSTAmount,
    scholarshipAmount,
    discountAmount: oneShotDiscount,
    amountPayable: finalAmount,
  };
};

/**
 * Calculate semester-wise payment breakdown
 */
export const calculateSemesterPayment = (
  semesterNumber: number,
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  instalmentsPerSemester: number,
  cohortStartDate: string,
  scholarshipAmount: number = 0,
  oneShotDiscount: number = 0
): PaymentBreakdown => {
  // Calculate semester fee
  const programFeeOnly = totalProgramFee - admissionFee;
  const semesterFee = programFeeOnly / numberOfSemesters;
  
  // Calculate semester payment date
  const startDate = new Date(cohortStartDate);
  const semesterStartDate = new Date(startDate);
  semesterStartDate.setMonth(startDate.getMonth() + (semesterNumber - 1) * 6);
  
  // Calculate GST for this semester
  const semesterGST = calculateGST(semesterFee);
  
  // Apply scholarship proportionally
  const semesterScholarship = scholarshipAmount / numberOfSemesters;
  
  // Apply one-shot discount proportionally
  const semesterDiscount = oneShotDiscount / numberOfSemesters;
  
  // Calculate final payable amount
  const finalAmount = calculateTotalPayable(semesterFee, semesterGST, semesterDiscount, semesterScholarship);
  
  return {
    paymentDate: semesterStartDate.toISOString().split('T')[0],
    baseAmount: semesterFee,
    gstAmount: semesterGST,
    scholarshipAmount: semesterScholarship,
    discountAmount: semesterDiscount,
    amountPayable: finalAmount,
  };
};
