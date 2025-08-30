import type { InstallmentView, PaymentPlan } from './types.ts';

// Constants
export const GST_RATE = 18;

// Rounding utility function for final payable amounts
export const roundToRupee = (amount: number): number => {
  const rupees = Math.floor(amount);
  const paisa = amount - rupees;

  if (paisa >= 0.5) {
    return rupees + 1;
  } else {
    return rupees;
  }
};

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

export const distributeScholarshipByInstallmentPattern = (
  installmentPercentages: number[],
  totalScholarshipAmount: number
): number[] => {
  const scholarshipDistribution = new Array(installmentPercentages.length).fill(
    0
  );

  if (installmentPercentages.length === 0) return scholarshipDistribution;

  // Distribute scholarship according to the installment pattern percentages
  for (let i = 0; i < installmentPercentages.length; i++) {
    scholarshipDistribution[i] =
      Math.round(
        totalScholarshipAmount * (installmentPercentages[i] / 100) * 100
      ) / 100;
  }

  // Handle rounding differences by adding remainder to last installment
  const totalDistributed = scholarshipDistribution.reduce(
    (sum, amount) => sum + amount,
    0
  );
  const remainder = totalScholarshipAmount - totalDistributed;
  if (remainder !== 0 && installmentPercentages.length > 0) {
    scholarshipDistribution[installmentPercentages.length - 1] += remainder;
  }

  return scholarshipDistribution;
};

export const distributeScholarshipAcrossSemesters = (
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  scholarshipAmount: number,
  equalDistribution: boolean,
  programFeeIncludesGST: boolean = true
): number[] => {
  // Extract base amounts properly
  // Program fee base depends on whether it includes GST
  const programFeeBase = programFeeIncludesGST
    ? extractBaseAmountFromTotal(totalProgramFee)
    : totalProgramFee;
  // Admission fee ALWAYS includes GST
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

  console.log('🔍 One-Shot Payment GST Debug:', {
    programFeeIncludesGST,
    totalProgramFee,
    admissionFee,
    programFeeBaseAmount,
  });

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
  const roundedAmountPayable = roundToRupee(Math.max(0, finalAmount));

  console.log(`🔍 [ROUNDING] One-shot payment amount:`, {
    originalAmount: finalAmount,
    roundedAmount: roundedAmountPayable,
    difference: roundedAmountPayable - finalAmount,
  });

  return {
    paymentDate: '', // Will be set from database dates only
    baseAmount: programFeeBaseAmount, // Return the original base amount before discounts for display
    gstAmount: programFeeGST,
    scholarshipAmount: scholarshipAmount + additionalDiscount, // Combine scholarship + additional discount
    discountAmount: baseDiscount, // Only base discount (additional discount moved to scholarship)
    baseDiscountAmount: baseDiscount, // Base one-shot discount only
    additionalDiscountAmount: 0, // No longer separate (combined with scholarship)
    amountPayable: roundedAmountPayable,
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
  equalScholarshipDistribution?: boolean,
  additionalDiscountPercentage: number = 0
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
    // Admission fee ALWAYS includes GST, regardless of program fee setting
    admissionFeeBaseAmount = extractBaseAmountFromTotal(admissionFee);
    admissionFeeGST = extractGSTFromTotal(admissionFee);
  }

  console.log('🔍 Semester Payment GST Debug:', {
    semesterNumber,
    programFeeIncludesGST,
    totalProgramFee,
    admissionFee,
    programFeeBaseAmount,
    programFeeGST,
    admissionFeeBaseAmount,
    admissionFeeGST,
  });

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

  // Distribute scholarship: follow installment pattern OR backwards distribution
  const installmentScholarshipDistribution = equalScholarshipDistribution
    ? distributeScholarshipByInstallmentPattern(
        installmentPercentages,
        semesterScholarship
      )
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
      // For inclusive GST, calculate GST on the remaining base amount after scholarship
      // Since the original amount includes GST, we need to calculate GST on the base portion
      const baseAmountAfterScholarship = installmentAfterScholarship;
      installmentGST = calculateGST(baseAmountAfterScholarship);

      console.log('🔍 Installment GST Debug (Inclusive):', {
        installmentNumber: i + 1,
        baseAmountAfterScholarship,
        installmentGST,
      });
    } else {
      // Calculate GST on the installment amount
      installmentGST = calculateGST(installmentAfterScholarship);

      console.log('🔍 Installment GST Debug (Exclusive):', {
        installmentNumber: i + 1,
        installmentAfterScholarship,
        installmentGST,
      });
    }

    const finalAmount = installmentAfterScholarship + installmentGST;

    const roundedAmountPayable = roundToRupee(Math.max(0, finalAmount));
    console.log(`🔍 [ROUNDING] Installment ${i + 1} amount:`, {
      originalAmount: finalAmount,
      roundedAmount: roundedAmountPayable,
      difference: roundedAmountPayable - finalAmount,
    });

    installments.push({
      paymentDate: '', // Will be set from database dates only
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      baseDiscountAmount: installmentDiscount, // Base discount only
      additionalDiscountAmount: 0, // No additional discount on installments
      amountPayable: roundedAmountPayable,
      installmentNumber: i + 1,
    });
  }
  return installments;
};
