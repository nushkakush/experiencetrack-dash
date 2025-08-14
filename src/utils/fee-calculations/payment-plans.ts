import { PaymentPlan, PaymentBreakdown } from '@/types/fee';
import { calculateGST, extractGSTFromTotal, extractBaseAmountFromTotal } from './gst';
import { generateSemesterPaymentDates } from './dateUtils';

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
  // Admission fee is GST inclusive, so extract base and GST
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);
  
  // Calculate remaining base fee: total program fee minus admission fee base (not admission fee total)
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  
  // Base amount is the remaining base fee (GST exclusive)
  const baseAmount = remainingBaseFee;
  
  // Step 1: Calculate one-shot discount on base amount (GST exclusive)
  const oneShotDiscount = calculateOneShotDiscount(baseAmount, discountPercentage);
  
  // Step 2: Calculate amount after one-shot discount
  const amountAfterDiscount = baseAmount - oneShotDiscount;
  
  // Step 3: Apply scholarship to the amount after discount
  const amountAfterScholarship = amountAfterDiscount - scholarshipAmount;
  
  // Step 4: Calculate GST on the amount after scholarship and discount
  const baseFeeGST = calculateGST(amountAfterScholarship);
  
  // Step 5: Calculate final payable amount
  const finalAmount = amountAfterScholarship + baseFeeGST;
  
  return {
    paymentDate: cohortStartDate,
    baseAmount: baseAmount,
    gstAmount: baseFeeGST,
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
  // Admission fee is GST inclusive, so extract base and GST
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  
  // Calculate remaining base fee: total program fee minus admission fee base (not admission fee total)
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;
  
  // Get installment distribution (40-40-20 rule for 3 installments)
  const installmentPercentages = getInstalmentDistribution(instalmentsPerSemester);
  
  // Calculate installment amounts (GST exclusive)
  const installmentAmounts = installmentPercentages.map(percentage => 
    Math.round(semesterFee * (percentage / 100) * 100) / 100
  );
  
  // Scholarship should only be applied to the LAST semester
  const isLastSemester = semesterNumber === numberOfSemesters;
  const semesterScholarship = isLastSemester ? scholarshipAmount : 0;
  const scholarshipDistribution = isLastSemester 
    ? distributeScholarshipBackwards(installmentAmounts, semesterScholarship)
    : new Array(installmentAmounts.length).fill(0);

  // Remove debug log to clean up console
  // console.log('calculateSemesterPayment - Scholarship distribution:', {
  //   semesterNumber,
  //   numberOfSemesters,
  //   isLastSemester,
  //   scholarshipAmount,
  //   semesterScholarship,
  //   installmentAmounts,
  //   scholarshipDistribution
  // });
  
  // Distribute one-shot discount proportionally (if applicable)
  const semesterDiscount = oneShotDiscount / numberOfSemesters;
  const discountPerInstallment = semesterDiscount / instalmentsPerSemester;
  
  // Generate proper payment dates for each installment in this semester using unified date utilities
  const paymentDates = generateSemesterPaymentDates(semesterNumber, instalmentsPerSemester, cohortStartDate);
  
  // Generate installments
  const installments: PaymentBreakdown[] = [];
  
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const installmentAmount = installmentAmounts[i];
    const installmentScholarship = scholarshipDistribution[i];
    const installmentDiscount = discountPerInstallment;
    
    // Step 1: Calculate amount after discount
    const installmentAfterDiscount = installmentAmount - installmentDiscount;
    
    // Step 2: Apply scholarship to the amount after discount
    const installmentAfterScholarship = installmentAfterDiscount - installmentScholarship;
    
    // Step 3: Calculate GST on the amount after scholarship and discount
    const installmentGST = calculateGST(installmentAfterScholarship);
    
    // Step 4: Calculate final payable amount
    const finalAmount = installmentAfterScholarship + installmentGST;
    
    installments.push({
      paymentDate: paymentDates[i], // Use the unified date calculation
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      amountPayable: Math.max(0, finalAmount),
    });
  }
  
  return installments;
};
