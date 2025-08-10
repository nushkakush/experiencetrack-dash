import { SemesterBreakdown, PaymentBreakdown } from '@/types/fee';
import { calculateGST } from './gst';
import { getInstalmentDistribution } from './payment-plans';

/**
 * Semester calculation utilities
 * Handles all semester-related calculations for fee structures
 */

/**
 * Generate payment dates for a semester
 */
export const generateSemesterPaymentDates = (
  semesterNumber: number,
  instalmentsPerSemester: number,
  cohortStartDate: string
): string[] => {
  const startDate = new Date(cohortStartDate);
  
  let semesterStartDate: Date;
  if (semesterNumber === 1) {
    semesterStartDate = new Date(startDate);
  } else {
    semesterStartDate = new Date(startDate);
    semesterStartDate.setMonth(startDate.getMonth() + (semesterNumber - 1) * 6);
  }
  
  const paymentDates: string[] = [];
  const distribution = getInstalmentDistribution(instalmentsPerSemester);
  
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const paymentDate = new Date(semesterStartDate);
    paymentDate.setMonth(semesterStartDate.getMonth() + i * 2); // 2 months apart
    paymentDates.push(paymentDate.toISOString().split('T')[0]);
  }
  
  return paymentDates;
};

/**
 * Calculate admission fee breakdown
 */
export const calculateAdmissionFee = (
  admissionFee: number
): PaymentBreakdown => {
  const baseAmount = admissionFee / 1.18; // Remove GST
  const gstAmount = admissionFee - baseAmount;
  
  return {
    paymentDate: new Date().toISOString().split('T')[0],
    baseAmount: Math.round(baseAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    scholarshipAmount: 0,
    discountAmount: 0,
    amountPayable: admissionFee,
  };
};

/**
 * Calculate semester fee breakdown
 */
export const calculateSemesterFee = (
  semesterNumber: number,
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  instalmentsPerSemester: number,
  cohortStartDate: string,
  scholarshipAmount: number = 0,
  oneShotDiscount: number = 0,
  paymentPlan: 'sem_wise' | 'instalment_wise'
): SemesterBreakdown => {
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
  
  // Generate instalments
  const distribution = getInstalmentDistribution(instalmentsPerSemester);
  const paymentDates = generateSemesterPaymentDates(semesterNumber, instalmentsPerSemester, cohortStartDate);
  
  const instalments: PaymentBreakdown[] = distribution.map((percentage, index) => {
    const instalmentBaseAmount = (semesterFee * percentage) / 100;
    const instalmentGST = calculateGST(instalmentBaseAmount);
    const instalmentScholarship = (semesterScholarship * percentage) / 100;
    const instalmentDiscount = (semesterDiscount * percentage) / 100;
    
    const finalAmount = Math.max(0, 
      instalmentBaseAmount + instalmentGST - instalmentDiscount - instalmentScholarship
    );
    
    return {
      paymentDate: paymentDates[index],
      baseAmount: Math.round(instalmentBaseAmount * 100) / 100,
      gstAmount: Math.round(instalmentGST * 100) / 100,
      scholarshipAmount: Math.round(instalmentScholarship * 100) / 100,
      discountAmount: Math.round(instalmentDiscount * 100) / 100,
      amountPayable: Math.round(finalAmount * 100) / 100,
    };
  });
  
  return {
    semesterNumber,
    semesterStartDate: semesterStartDate.toISOString().split('T')[0],
    totalSemesterFee: semesterFee,
    totalSemesterGST: semesterGST,
    totalSemesterScholarship: semesterScholarship,
    totalSemesterDiscount: semesterDiscount,
    totalSemesterPayable: Math.max(0, semesterFee + semesterGST - semesterDiscount - semesterScholarship),
    instalments,
  };
};
