import type { InstallmentView, PaymentPlan } from './types.ts';

// Constants
export const GST_RATE = 18;

// Basic calculation helpers
export const calculateGST = (baseAmount: number): number => {
  return Math.round(baseAmount * (GST_RATE / 100) * 100) / 100;
};

export const extractGSTFromTotal = (totalAmount: number): number => {
  const baseAmount = totalAmount / (1 + GST_RATE / 100);
  const gstAmount = totalAmount - baseAmount;
  return Math.round(gstAmount * 100) / 100;
};

export const extractBaseAmountFromTotal = (totalAmount: number): number => {
  return Math.round((totalAmount / (1 + GST_RATE / 100)) * 100) / 100;
};

export const calculateOneShotDiscount = (
  baseAmount: number,
  discountPercentage: number
): number => {
  return Math.round(baseAmount * (discountPercentage / 100) * 100) / 100;
};

export const getInstalmentDistribution = (
  instalmentsPerSemester: number
): number[] => {
  switch (instalmentsPerSemester) {
    case 2:
      return [60, 40];
    case 3:
      return [40, 40, 20];
    case 4:
      return [30, 30, 30, 10];
    default: {
      const percentage = 100 / instalmentsPerSemester;
      return Array(instalmentsPerSemester).fill(percentage);
    }
  }
};

export const distributeScholarshipBackwards = (
  installmentAmounts: number[],
  totalScholarshipAmount: number
): number[] => {
  const scholarshipDistribution = new Array(installmentAmounts.length).fill(0);
  let remainingScholarship = totalScholarshipAmount;
  
  for (
    let i = installmentAmounts.length - 1;
    i >= 0 && remainingScholarship > 0;
    i--
  ) {
    const installmentAmount = installmentAmounts[i];
    const scholarshipForThisInstallment = Math.min(
      remainingScholarship,
      installmentAmount
    );
    scholarshipDistribution[i] = scholarshipForThisInstallment;
    remainingScholarship -= scholarshipForThisInstallment;
  }
  return scholarshipDistribution;
};

export const distributeScholarshipAcrossSemesters = (
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  scholarshipAmount: number
): number[] => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;
  
  const scholarshipDistribution = new Array(numberOfSemesters).fill(0);
  let remainingScholarship = scholarshipAmount;
  
  // Distribute scholarship from last semester to first
  for (let sem = numberOfSemesters; sem >= 1 && remainingScholarship > 0; sem--) {
    const scholarshipForThisSemester = Math.min(
      remainingScholarship,
      semesterFee
    );
    scholarshipDistribution[sem - 1] = scholarshipForThisSemester;
    remainingScholarship -= scholarshipForThisSemester;
  }
  
  return scholarshipDistribution;
};

// Core payment calculations
export const calculateOneShotPayment = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number
): InstallmentView => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const baseAmount = remainingBaseFee;
  
  // Calculate discount on the total program fee (as per business requirement)
  const oneShotDiscount = calculateOneShotDiscount(
    totalProgramFee,
    discountPercentage
  );
  const amountAfterDiscount = baseAmount - oneShotDiscount;
  const amountAfterScholarship = amountAfterDiscount - scholarshipAmount;
  const baseFeeGST = calculateGST(amountAfterScholarship);
  const finalAmount = amountAfterScholarship + baseFeeGST;
  
  return {
    paymentDate: '', // Will be set from database dates only
    baseAmount,
    gstAmount: baseFeeGST,
    scholarshipAmount,
    discountAmount: oneShotDiscount,
    amountPayable: Math.max(0, finalAmount),
  };
};

export const calculateSemesterPayment = (
  semesterNumber: number,
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  instalmentsPerSemester: number,
  scholarshipAmount: number,
  oneShotDiscount: number,
  scholarshipDistribution?: number[]
): InstallmentView[] => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;
  const installmentPercentages = getInstalmentDistribution(
    instalmentsPerSemester
  );
  const installmentAmounts = installmentPercentages.map(
    percentage => Math.round(semesterFee * (percentage / 100) * 100) / 100
  );
  
  // Use provided scholarship distribution or calculate for this semester only
  let semesterScholarship = 0;
  if (scholarshipDistribution && scholarshipDistribution[semesterNumber - 1] !== undefined) {
    semesterScholarship = scholarshipDistribution[semesterNumber - 1];
  } else if (scholarshipAmount > 0) {
    // Fallback to old logic if no distribution provided
    const isLastSemester = semesterNumber === numberOfSemesters;
    semesterScholarship = isLastSemester ? scholarshipAmount : 0;
  }
  
  const installmentScholarshipDistribution = distributeScholarshipBackwards(installmentAmounts, semesterScholarship);
  const semesterDiscount = oneShotDiscount / numberOfSemesters;
  const discountPerInstallment = semesterDiscount / instalmentsPerSemester;
  const installments: InstallmentView[] = [];
  
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const installmentAmount = installmentAmounts[i];
    const installmentScholarship = installmentScholarshipDistribution[i];
    const installmentDiscount = discountPerInstallment;
    const installmentAfterDiscount = installmentAmount - installmentDiscount;
    const installmentAfterScholarship =
      installmentAfterDiscount - installmentScholarship;
    const installmentGST = calculateGST(installmentAfterScholarship);
    const finalAmount = installmentAfterScholarship + installmentGST;
    
    installments.push({
      paymentDate: '', // Will be set from database dates only
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      amountPayable: Math.max(0, finalAmount),
      installmentNumber: i + 1,
    });
  }
  return installments;
};
