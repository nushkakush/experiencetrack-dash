/**
 * Unified Date Calculation Utilities
 * 
 * This module provides a single source of truth for all payment date calculations
 * to ensure consistency between admin and student sides.
 */

/**
 * Generate payment dates for a semester with proper spacing
 * @param semesterNumber - The semester number (1, 2, 3, etc.)
 * @param instalmentsPerSemester - Number of installments in this semester
 * @param cohortStartDate - The cohort start date (YYYY-MM-DD format)
 * @returns Array of payment dates for each installment in the semester
 */
export const generateSemesterPaymentDates = (
  semesterNumber: number,
  instalmentsPerSemester: number,
  cohortStartDate: string
): string[] => {
  const startDate = new Date(cohortStartDate);
  
  // Calculate semester start date
  let semesterStartDate: Date;
  if (semesterNumber === 1) {
    semesterStartDate = new Date(startDate);
  } else {
    semesterStartDate = new Date(startDate);
    semesterStartDate.setMonth(startDate.getMonth() + (semesterNumber - 1) * 6);
  }
  
  const paymentDates: string[] = [];
  
  // Generate dates for each installment in the semester
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const paymentDate = new Date(semesterStartDate);
    paymentDate.setMonth(semesterStartDate.getMonth() + i * 2); // 2 months apart
    paymentDates.push(paymentDate.toISOString().split('T')[0]);
  }
  
  return paymentDates;
};

/**
 * Generate payment dates for semester-wise payments (1 payment per semester)
 * @param numberOfSemesters - Total number of semesters
 * @param cohortStartDate - The cohort start date (YYYY-MM-DD format)
 * @returns Array of payment dates for each semester
 */
export const generateSemesterWisePaymentDates = (
  numberOfSemesters: number,
  cohortStartDate: string
): string[] => {
  const startDate = new Date(cohortStartDate);
  const paymentDates: string[] = [];
  
  for (let i = 0; i < numberOfSemesters; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i * 6); // 6 months per semester
    paymentDates.push(paymentDate.toISOString().split('T')[0]);
  }
  
  return paymentDates;
};

/**
 * Generate payment dates for installment-wise payments (monthly installments)
 * @param totalInstallments - Total number of installments across all semesters
 * @param cohortStartDate - The cohort start date (YYYY-MM-DD format)
 * @returns Array of payment dates for each installment
 */
export const generateInstallmentWisePaymentDates = (
  totalInstallments: number,
  cohortStartDate: string
): string[] => {
  const startDate = new Date(cohortStartDate);
  const paymentDates: string[] = [];
  
  for (let i = 0; i < totalInstallments; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i); // Monthly installments
    paymentDates.push(paymentDate.toISOString().split('T')[0]);
  }
  
  return paymentDates;
};

/**
 * Get the payment date for a specific installment
 * @param semesterNumber - The semester number
 * @param installmentNumber - The installment number within the semester
 * @param instalmentsPerSemester - Number of installments per semester
 * @param cohortStartDate - The cohort start date
 * @returns The payment date for the specific installment
 */
export const getInstallmentPaymentDate = (
  semesterNumber: number,
  installmentNumber: number,
  instalmentsPerSemester: number,
  cohortStartDate: string
): string => {
  const semesterDates = generateSemesterPaymentDates(semesterNumber, instalmentsPerSemester, cohortStartDate);
  return semesterDates[installmentNumber - 1]; // installmentNumber is 1-based
};

/**
 * Format date for display
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
export const formatPaymentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Validate if a date string is in correct format
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};
