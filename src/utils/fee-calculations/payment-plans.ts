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
  baseAmount: number,
  discountPercentage: number
): number => {
  return Math.round(baseAmount * (discountPercentage / 100) * 100) / 100;
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
 * Implements 40-40-20 rule for 3 installments, 30-30-30-10 for 4, and even distribution for others
 */
export const getInstalmentDistribution = (instalmentsPerSemester: number): number[] => {
  switch (instalmentsPerSemester) {
    case 2:
      return [60, 40];
    case 3:
      return [40, 40, 20]; // 40-40-20 rule
    case 4:
      return [30, 30, 30, 10]; // 30-30-30-10 rule
    default:
      // Even distribution for other numbers
      const percentage = 100 / instalmentsPerSemester;
      return Array(instalmentsPerSemester).fill(percentage);
  }
};

/**
 * Distribute scholarship amount backwards from the last installments
 * This ensures the bulk of the fee is collected initially
 */
export const distributeScholarshipBackwards = (
  installmentAmounts: number[],
  totalScholarshipAmount: number
): number[] => {
  const scholarshipDistribution = new Array(installmentAmounts.length).fill(0);
  let remainingScholarship = totalScholarshipAmount;
  
  // Start from the last installment and work backwards
  for (let i = installmentAmounts.length - 1; i >= 0 && remainingScholarship > 0; i--) {
    const installmentAmount = installmentAmounts[i];
    const scholarshipForThisInstallment = Math.min(remainingScholarship, installmentAmount);
    
    scholarshipDistribution[i] = scholarshipForThisInstallment;
    remainingScholarship -= scholarshipForThisInstallment;
  }
  
  return scholarshipDistribution;
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
  
  // Apply scholarship to program fee first
  const programFeeAfterScholarship = programFeeOnly - scholarshipAmount;
  
  // Calculate GST on the final payable amount (after scholarship)
  const programFeeGST = calculateGST(programFeeAfterScholarship);
  
  // Total base amount and GST
  const totalBaseAmount = programFeeAfterScholarship + admissionFeeBase;
  const totalGSTAmount = programFeeGST + admissionFeeGST;
  const totalWithGST = totalBaseAmount + totalGSTAmount;
  
  // Calculate one-shot discount on base amount
  const oneShotDiscount = calculateOneShotDiscount(totalBaseAmount, discountPercentage);
  
  // Calculate final payable amount
  const finalAmount = totalWithGST - oneShotDiscount;
  
  return {
    paymentDate: cohortStartDate,
    baseAmount: totalBaseAmount,
    gstAmount: totalGSTAmount,
    scholarshipAmount,
    discountAmount: oneShotDiscount,
    amountPayable: Math.max(0, finalAmount),
  };
};

/**
 * Calculate semester-wise payment breakdown with proper installment distribution
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
): PaymentBreakdown[] => {
  // Calculate semester fee
  const programFeeOnly = totalProgramFee - admissionFee;
  const semesterFee = programFeeOnly / numberOfSemesters;
  
  // Get installment distribution (40-40-20 rule for 3 installments)
  const installmentPercentages = getInstalmentDistribution(instalmentsPerSemester);
  
  // Calculate installment amounts
  const installmentAmounts = installmentPercentages.map(percentage => 
    Math.round(semesterFee * (percentage / 100) * 100) / 100
  );
  
  // Distribute scholarship backwards from last installments
  const semesterScholarship = scholarshipAmount / numberOfSemesters;
  const scholarshipDistribution = distributeScholarshipBackwards(installmentAmounts, semesterScholarship);
  
  // Distribute one-shot discount proportionally (if applicable)
  const semesterDiscount = oneShotDiscount / numberOfSemesters;
  const discountPerInstallment = semesterDiscount / instalmentsPerSemester;
  
  // Calculate semester payment date
  const startDate = new Date(cohortStartDate);
  const semesterStartDate = new Date(startDate);
  semesterStartDate.setMonth(startDate.getMonth() + (semesterNumber - 1) * 6);
  
  // Generate installments
  const installments: PaymentBreakdown[] = [];
  
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const installmentAmount = installmentAmounts[i];
    const installmentScholarship = scholarshipDistribution[i];
    const installmentDiscount = discountPerInstallment;
    
    // Calculate GST on the final payable amount (after scholarship)
    const installmentAfterScholarship = installmentAmount - installmentScholarship;
    const installmentGST = calculateGST(installmentAfterScholarship);
    
    // Calculate final payable amount
    const finalAmount = installmentAfterScholarship + installmentGST - installmentDiscount;
    
    installments.push({
      paymentDate: semesterStartDate.toISOString().split('T')[0],
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      amountPayable: Math.max(0, finalAmount),
    });
  }
  
  return installments;
};
