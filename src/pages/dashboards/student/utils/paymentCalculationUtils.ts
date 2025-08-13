import { 
  calculateOneShotPayment, 
  calculateSemesterPayment 
} from '@/utils/fee-calculations/payment-plans';
import { extractBaseAmountFromTotal, extractGSTFromTotal, calculateGST } from '@/utils/fee-calculations/gst';
import { FeeStructure, Installment, ScholarshipData } from '@/types/payments';

// Function to distribute scholarship backwards across installments
export const distributeScholarshipBackwards = (installments: Installment[], totalScholarship: number) => {
  if (totalScholarship <= 0) {
    return installments;
  }
  
  const installmentsCopy = [...installments];
  let remainingScholarship = totalScholarship;
  
  // Start from the last installment and work backwards
  for (let i = installmentsCopy.length - 1; i >= 0 && remainingScholarship > 0; i--) {
    const installment = installmentsCopy[i];
    const installmentAmount = installment.amountPayable || installment.baseAmount + installment.gstAmount;
    
    // Apply scholarship to this installment (up to the installment amount)
    const scholarshipToApply = Math.min(remainingScholarship, installmentAmount);
    
    installment.scholarshipAmount = scholarshipToApply;
    installment.discountAmount = scholarshipToApply;
    installment.amountPayable = installmentAmount - scholarshipToApply;
    
    remainingScholarship -= scholarshipToApply;
  }
  
  return installmentsCopy;
};

// Calculate scholarship amount from admin dashboard data
export const calculateScholarshipAmount = async (studentId: string, totalProgramFee: number) => {
  try {
    const { calculateTotalScholarshipAmount } = await import('@/utils/scholarshipUtils');
    const scholarshipInfo = await calculateTotalScholarshipAmount(studentId, totalProgramFee);
    return scholarshipInfo.totalScholarshipAmount;
  } catch (error) {
    console.error('Error calculating scholarship amount:', error);
    return 0;
  }
};

// Legacy function for backward compatibility
export const calculateScholarshipAmountLegacy = (studentScholarship: ScholarshipData, totalProgramFee: number) => {
  if (!studentScholarship || !studentScholarship.scholarship) {
    return 0;
  }
  
  const scholarshipPercentage = Number(studentScholarship.scholarship.amount_percentage) || 0;
  return (totalProgramFee * scholarshipPercentage) / 100;
};

// Generate default payment breakdown
export const generateDefaultPaymentBreakdown = () => {
  return {
    admissionFee: {
      baseAmount: 50000,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: 9000,
      totalPayable: 59000,
    },
    semesters: [
      {
        semesterNumber: 1,
        instalments: [
          {
            paymentDate: '2024-01-15',
            baseAmount: 25000,
            scholarshipAmount: 0,
            discountAmount: 0,
            gstAmount: 4500,
            amountPayable: 29500,
          },
        ],
        total: {
          baseAmount: 25000,
          scholarshipAmount: 0,
          discountAmount: 0,
          gstAmount: 4500,
          totalPayable: 29500,
        },
      },
    ],
    overallSummary: {
      totalProgramFee: 200000,
      admissionFee: 50000,
      totalGST: 36000,
      totalDiscount: 0,
      totalAmountPayable: 236000,
    },
  };
};

// Calculate one-shot payment breakdown
export const calculateOneShotBreakdown = (
  feeStructure: FeeStructure,
  scholarshipAmount: number,
  admissionFeeGST: number
) => {
  const totalProgramFee = Number(feeStructure.total_program_fee);
  const admissionFee = Number(feeStructure.admission_fee);
  const oneShotDiscount = Number(feeStructure.one_shot_discount_percentage);

  const oneShotPayment = calculateOneShotPayment(
    totalProgramFee,
    admissionFee,
    oneShotDiscount,
    scholarshipAmount,
    new Date().toISOString().split('T')[0]
  );

  return {
    semesters: [{
      semesterNumber: 1,
      instalments: [oneShotPayment],
      total: {
        baseAmount: oneShotPayment.baseAmount,
        scholarshipAmount: oneShotPayment.scholarshipAmount,
        discountAmount: oneShotPayment.discountAmount,
        gstAmount: oneShotPayment.gstAmount,
        totalPayable: oneShotPayment.amountPayable,
      },
    }],
    overallSummary: {
      totalGST: admissionFeeGST + oneShotPayment.gstAmount,
      totalDiscount: oneShotPayment.discountAmount,
      totalAmountPayable: admissionFee + oneShotPayment.amountPayable,
    },
  };
};

// Calculate semester-wise payment breakdown
export const calculateSemesterWiseBreakdown = (
  feeStructure: FeeStructure,
  scholarshipAmount: number,
  admissionFeeGST: number,
  admissionFee: number
) => {
  const totalProgramFee = Number(feeStructure.total_program_fee);
  const numberOfSemesters = Number(feeStructure.number_of_semesters);
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);

  const semesterPayments = [];
  let totalGST = admissionFeeGST;
  let totalAmountPayable = admissionFee;

  for (let semesterNumber = 1; semesterNumber <= numberOfSemesters; semesterNumber++) {
    // For semester-wise, we want ONE payment per semester, not multiple installments
    const semesterAmount = (totalProgramFee - admissionFeeBase) / numberOfSemesters;
    const semesterGST = calculateGST(semesterAmount);
    
    // Create a single payment for this semester
    const semesterPayment = {
      paymentDate: new Date(Date.now() + (semesterNumber - 1) * 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      baseAmount: semesterAmount,
      gstAmount: semesterGST,
      scholarshipAmount: 0,
      discountAmount: 0,
      amountPayable: semesterAmount + semesterGST,
    };

    semesterPayments.push({
      semesterNumber,
      instalments: [semesterPayment], // Only ONE installment per semester
      total: {
        baseAmount: semesterAmount,
        scholarshipAmount: 0,
        discountAmount: 0,
        gstAmount: semesterGST,
        totalPayable: semesterAmount + semesterGST,
      },
    });

    totalGST += semesterGST;
    totalAmountPayable += semesterPayment.amountPayable;
  }

  // Distribute scholarship backwards across semesters
  const allInstallments = semesterPayments.flatMap(semester => semester.instalments);
  const updatedInstallments = distributeScholarshipBackwards(allInstallments, scholarshipAmount);
  
  // Update the semester payments with the distributed scholarship
  let installmentIndex = 0;
  semesterPayments.forEach(semester => {
    semester.instalments[0] = updatedInstallments[installmentIndex];
    semester.total = {
      baseAmount: semester.instalments[0].baseAmount,
      scholarshipAmount: semester.instalments[0].scholarshipAmount,
      discountAmount: semester.instalments[0].discountAmount,
      gstAmount: semester.instalments[0].gstAmount,
      totalPayable: semester.instalments[0].amountPayable,
    };
    installmentIndex++;
  });

  // Recalculate totals
  totalAmountPayable = admissionFee + semesterPayments.reduce((sum, semester) => sum + semester.total.totalPayable, 0);

  return {
    semesters: semesterPayments,
    overallSummary: {
      totalGST,
      totalAmountPayable,
    },
  };
};

// Calculate installment-wise payment breakdown
export const calculateInstallmentWiseBreakdown = (
  feeStructure: FeeStructure,
  scholarshipAmount: number,
  admissionFeeGST: number,
  admissionFee: number
) => {
  const totalProgramFee = Number(feeStructure.total_program_fee);
  const numberOfSemesters = Number(feeStructure.number_of_semesters);
  const installmentsPerSemester = Number(feeStructure.instalments_per_semester);

  const semesterPayments = [];
  let totalGST = admissionFeeGST;
  let totalAmountPayable = admissionFee;

  for (let semesterNumber = 1; semesterNumber <= numberOfSemesters; semesterNumber++) {
    const semesterInstallments = calculateSemesterPayment(
      semesterNumber,
      totalProgramFee,
      admissionFee,
      numberOfSemesters,
      installmentsPerSemester,
      new Date().toISOString().split('T')[0],
      0, // scholarship amount (will be distributed manually)
      0  // one-shot discount
    );

    const semesterTotal = {
      baseAmount: semesterInstallments.reduce((sum, inst) => sum + inst.baseAmount, 0),
      scholarshipAmount: semesterInstallments.reduce((sum, inst) => sum + inst.scholarshipAmount, 0),
      discountAmount: semesterInstallments.reduce((sum, inst) => sum + inst.discountAmount, 0),
      gstAmount: semesterInstallments.reduce((sum, inst) => sum + inst.gstAmount, 0),
      totalPayable: semesterInstallments.reduce((sum, inst) => sum + inst.amountPayable, 0),
    };

    semesterPayments.push({
      semesterNumber,
      instalments: semesterInstallments,
      total: semesterTotal,
    });

    totalGST += semesterTotal.gstAmount;
    totalAmountPayable += semesterTotal.totalPayable;
  }

  // Distribute scholarship backwards across all installments
  const allInstallments = semesterPayments.flatMap(semester => semester.instalments);
  const updatedInstallments = distributeScholarshipBackwards(allInstallments, scholarshipAmount);
  
  // Update the semester payments with the distributed scholarship
  let installmentIndex = 0;
  semesterPayments.forEach(semester => {
    semester.instalments.forEach((installment, instIndex) => {
      semester.instalments[instIndex] = updatedInstallments[installmentIndex];
      installmentIndex++;
    });
    
    // Recalculate semester totals
    semester.total = {
      baseAmount: semester.instalments.reduce((sum, inst) => sum + inst.baseAmount, 0),
      scholarshipAmount: semester.instalments.reduce((sum, inst) => sum + inst.scholarshipAmount, 0),
      discountAmount: semester.instalments.reduce((sum, inst) => sum + inst.discountAmount, 0),
      gstAmount: semester.instalments.reduce((sum, inst) => sum + inst.gstAmount, 0),
      totalPayable: semester.instalments.reduce((sum, inst) => sum + inst.amountPayable, 0),
    };
  });

  // Recalculate overall totals
  totalAmountPayable = admissionFee + semesterPayments.reduce((sum, semester) => sum + semester.total.totalPayable, 0);

  return {
    semesters: semesterPayments,
    overallSummary: {
      totalGST,
      totalAmountPayable,
    },
  };
};
