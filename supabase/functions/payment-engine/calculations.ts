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

export const distributeScholarshipEqually = (
  installmentAmounts: number[],
  totalScholarshipAmount: number
): number[] => {
  const scholarshipDistribution = new Array(installmentAmounts.length).fill(0);

  if (installmentAmounts.length === 0) return scholarshipDistribution;

  // Distribute scholarship equally across all installments
  const scholarshipPerInstallment =
    totalScholarshipAmount / installmentAmounts.length;
  for (let i = 0; i < installmentAmounts.length; i++) {
    scholarshipDistribution[i] =
      Math.round(scholarshipPerInstallment * 100) / 100;
  }

  // Handle rounding differences by adding remainder to last installment
  const totalDistributed = scholarshipDistribution.reduce(
    (sum, amount) => sum + amount,
    0
  );
  const remainder = totalScholarshipAmount - totalDistributed;
  if (remainder !== 0 && installmentAmounts.length > 0) {
    scholarshipDistribution[installmentAmounts.length - 1] += remainder;
  }

  return scholarshipDistribution;
};

export const distributeScholarshipAcrossSemesters = (
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  scholarshipAmount: number,
  equalDistribution: boolean
): number[] => {
  // Extract base amounts properly
  const programFeeBase = extractBaseAmountFromTotal(totalProgramFee);
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = programFeeBase - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;

  const scholarshipDistribution = new Array(numberOfSemesters).fill(0);

  if (equalDistribution) {
    // Distribute scholarship equally across all semesters
    const scholarshipPerSemester = scholarshipAmount / numberOfSemesters;
    for (let sem = 0; sem < numberOfSemesters; sem++) {
      scholarshipDistribution[sem] =
        Math.round(scholarshipPerSemester * 100) / 100;
    }
    // Handle rounding differences by adding remainder to last semester
    const totalDistributed = scholarshipDistribution.reduce(
      (sum, amount) => sum + amount,
      0
    );
    const remainder = scholarshipAmount - totalDistributed;
    if (remainder !== 0 && numberOfSemesters > 0) {
      scholarshipDistribution[numberOfSemesters - 1] += remainder;
    }
  } else {
    // Default: Distribute scholarship from last semester to first
    let remainingScholarship = scholarshipAmount;
    for (
      let sem = numberOfSemesters;
      sem >= 1 && remainingScholarship > 0;
      sem--
    ) {
      const scholarshipForThisSemester = Math.min(
        remainingScholarship,
        semesterFee
      );
      scholarshipDistribution[sem - 1] = scholarshipForThisSemester;
      remainingScholarship -= scholarshipForThisSemester;
    }
  }

  return scholarshipDistribution;
};

// Core payment calculations
export const calculateOneShotPayment = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number,
  programFeeIncludesGST: boolean,
  additionalDiscountPercentage: number = 0
): InstallmentView => {
  let programFeeBaseAmount: number;

  if (programFeeIncludesGST) {
    // totalProgramFee includes GST, so extract base amount
    programFeeBaseAmount = extractBaseAmountFromTotal(totalProgramFee);
  } else {
    // totalProgramFee is exclusive of GST, so use as-is
    programFeeBaseAmount = totalProgramFee;
  }

  // Calculate base discount on the BASE amount
  const baseDiscount = calculateOneShotDiscount(
    programFeeBaseAmount,
    discountPercentage
  );

  // Calculate additional discount on the BASE amount
  const additionalDiscount = calculateOneShotDiscount(
    programFeeBaseAmount,
    additionalDiscountPercentage
  );

  // Calculate scholarship on the BASE amount (including additional discount)
  const scholarshipOnBase = scholarshipAmount + additionalDiscount;

  // Total deductions from base amount
  const totalDeductions = baseDiscount + scholarshipOnBase;

  // Apply deductions to the program fee base amount
  const remainingProgramFee = programFeeBaseAmount - totalDeductions;

  // Calculate GST on the remaining amount after all deductions
  const programFeeGST = calculateGST(remainingProgramFee);

  // Calculate final amount with GST (admission fee is handled separately in overall summary)
  const finalAmount = remainingProgramFee + programFeeGST;

  return {
    paymentDate: '', // Will be set from database dates only
    baseAmount: programFeeBaseAmount, // Return the original base amount before discounts for display
    gstAmount: programFeeGST,
    scholarshipAmount: scholarshipAmount + additionalDiscount, // Combine scholarship + additional discount
    discountAmount: baseDiscount, // Only base discount (additional discount moved to scholarship)
    baseDiscountAmount: baseDiscount, // Base one-shot discount only
    additionalDiscountAmount: 0, // No longer separate (combined with scholarship)
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
  scholarshipDistribution?: number[],
  programFeeIncludesGST?: boolean,
  equalScholarshipDistribution?: boolean
): InstallmentView[] => {
  let programFeeBaseAmount: number;
  let programFeeGST: number;
  let admissionFeeBaseAmount: number;
  let admissionFeeGST: number;

  if (programFeeIncludesGST) {
    // totalProgramFee includes GST, so extract base amount and GST
    programFeeBaseAmount = extractBaseAmountFromTotal(totalProgramFee);
    programFeeGST = extractGSTFromTotal(totalProgramFee);

    // Extract admission fee base and GST
    admissionFeeBaseAmount = extractBaseAmountFromTotal(admissionFee);
    admissionFeeGST = extractGSTFromTotal(admissionFee);
  } else {
    // totalProgramFee is exclusive of GST, so use as-is and calculate GST
    programFeeBaseAmount = totalProgramFee;
    programFeeGST = 0; // Will be calculated per installment
    admissionFeeBaseAmount = admissionFee;
    admissionFeeGST = 0; // Will be calculated per installment
  }

  // Calculate discount on the BASE amount (not total amount)
  const totalDiscount = oneShotDiscount;

  // Apply discount to the program fee base amount (no admission fee subtraction)
  const programFeeAfterDiscount = programFeeBaseAmount - totalDiscount;

  // SUBTRACT ADMISSION FEE from the remaining base fee for installments
  const remainingBaseFee = programFeeAfterDiscount - admissionFeeBaseAmount;

  const semesterFee = remainingBaseFee / numberOfSemesters;
  const installmentPercentages = getInstalmentDistribution(
    instalmentsPerSemester
  );
  const installmentAmounts = installmentPercentages.map(
    percentage => Math.round(semesterFee * (percentage / 100) * 100) / 100
  );

  // Use provided scholarship distribution or calculate for this semester only
  let semesterScholarship = 0;

  console.log('🔍 Scholarship distribution debug:', {
    semesterNumber,
    scholarshipDistribution,
    scholarshipAmount,
    hasDistribution: !!scholarshipDistribution,
    distributionLength: scholarshipDistribution?.length,
    distributionForThisSemester: scholarshipDistribution?.[semesterNumber - 1],
  });

  if (
    scholarshipDistribution &&
    scholarshipDistribution[semesterNumber - 1] !== undefined
  ) {
    semesterScholarship = scholarshipDistribution[semesterNumber - 1];
    console.log(
      `✅ Using scholarship distribution for semester ${semesterNumber}: ${semesterScholarship}`
    );
  } else if (scholarshipAmount > 0) {
    // Fallback to old logic if no distribution provided
    const isLastSemester = semesterNumber === numberOfSemesters;
    semesterScholarship = isLastSemester ? scholarshipAmount : 0;
    console.log(
      `⚠️ Using fallback logic for semester ${semesterNumber}: ${semesterScholarship} (isLastSemester: ${isLastSemester})`
    );
  }

  console.log(
    `🎯 Final semester scholarship for semester ${semesterNumber}: ${semesterScholarship}`
  );

  const installmentScholarshipDistribution = equalScholarshipDistribution
    ? distributeScholarshipEqually(installmentAmounts, semesterScholarship)
    : distributeScholarshipBackwards(installmentAmounts, semesterScholarship);
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

    let installmentGST: number;
    if (programFeeIncludesGST) {
      // Calculate GST proportionally on the remaining GST (total GST minus admission fee GST)
      const remainingGST = programFeeGST - admissionFeeGST;
      const remainingBase = programFeeBaseAmount - admissionFeeBaseAmount;
      const gstRatio = remainingGST / remainingBase;
      installmentGST =
        Math.round(installmentAfterScholarship * gstRatio * 100) / 100;
    } else {
      // Calculate GST on the installment amount
      installmentGST = calculateGST(installmentAfterScholarship);
    }

    const finalAmount = installmentAfterScholarship + installmentGST;

    installments.push({
      paymentDate: '', // Will be set from database dates only
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      baseDiscountAmount: installmentDiscount, // Base discount only
      additionalDiscountAmount: 0, // No additional discount on installments
      amountPayable: Math.max(0, finalAmount),
      installmentNumber: i + 1,
    });
  }
  return installments;
};
