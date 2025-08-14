import { useMemo } from 'react';
import { extractBaseAmountFromTotal, extractGSTFromTotal } from '@/utils/fee-calculations/gst';
import {
  calculateScholarshipAmount,
  generateDefaultPaymentBreakdown,
  calculateOneShotBreakdown,
  calculateSemesterWiseBreakdown,
  calculateInstallmentWiseBreakdown
} from '../utils/paymentCalculationUtils';
import {
  FeeStructure,
  StudentPayment,
  Scholarship,
  PaymentPlan,
  PaymentBreakdown
} from '@/types/payments/PaymentCalculationTypes';

interface UsePaymentBreakdownProps {
  feeStructure: FeeStructure | null;
  studentPayments: StudentPayment[];
  selectedPaymentPlan: PaymentPlan;
  scholarships: Scholarship[];
}

export const usePaymentBreakdown = ({
  feeStructure,
  studentPayments,
  selectedPaymentPlan,
  scholarships
}: UsePaymentBreakdownProps): PaymentBreakdown => {
  return useMemo(() => {
    // If we don't have fee structure, return default breakdown
    if (!feeStructure) {
      return generateDefaultPaymentBreakdown();
    }

    // Calculate scholarship amount from admin dashboard data
    const totalProgramFee = Number(feeStructure.total_program_fee);
    const scholarshipAmount = calculateScholarshipAmount(scholarships, totalProgramFee);

    // If we have fee structure but no student payments, still generate breakdown for plan selection
    if (!studentPayments || studentPayments.length === 0) {
      return generateDefaultBreakdownForPlanSelection(feeStructure, totalProgramFee, scholarshipAmount);
    }

    return generatePaymentBreakdown(feeStructure, selectedPaymentPlan, scholarshipAmount);
  }, [feeStructure, studentPayments, selectedPaymentPlan, scholarships]);
};

// Helper function to generate default breakdown for plan selection
const generateDefaultBreakdownForPlanSelection = (
  feeStructure: FeeStructure,
  totalProgramFee: number,
  scholarshipAmount: number
): PaymentBreakdown => {
  const admissionFee = Number(feeStructure.admission_fee);
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);

  return {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: admissionFee,
    },
    semesters: [],
    overallSummary: {
      totalProgramFee: totalProgramFee,
      admissionFee: admissionFee,
      totalGST: admissionFeeGST,
      totalDiscount: scholarshipAmount,
      totalAmountPayable: admissionFee,
    },
  };
};

// Helper function to generate payment breakdown based on selected plan
const generatePaymentBreakdown = (
  feeStructure: FeeStructure,
  selectedPaymentPlan: PaymentPlan,
  scholarshipAmount: number
): PaymentBreakdown => {
  const admissionFee = Number(feeStructure.admission_fee);
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);
  const totalProgramFee = Number(feeStructure.total_program_fee);

  let breakdown: PaymentBreakdown = {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: admissionFee,
    },
    semesters: [],
    overallSummary: {
      totalProgramFee: totalProgramFee,
      admissionFee: admissionFee,
      totalGST: 0,
      totalDiscount: 0,
      totalAmountPayable: 0,
    },
  };

  // Generate breakdown based on payment plan
  switch (selectedPaymentPlan) {
    case 'one_shot':
      const oneShotResult = calculateOneShotBreakdown(feeStructure, scholarshipAmount, admissionFeeGST);
      breakdown.semesters = oneShotResult.semesters;
      breakdown.oneShotPayment = oneShotResult.oneShotPayment;
      breakdown.overallSummary.totalGST = oneShotResult.overallSummary.totalGST;
      breakdown.overallSummary.totalDiscount = oneShotResult.overallSummary.totalDiscount;
      breakdown.overallSummary.totalAmountPayable = oneShotResult.overallSummary.totalAmountPayable;
      break;

    case 'sem_wise':
      const semesterResult = calculateSemesterWiseBreakdown(feeStructure, scholarshipAmount, admissionFeeGST, admissionFee);
      breakdown.semesters = semesterResult.semesters;
      breakdown.overallSummary.totalGST = semesterResult.overallSummary.totalGST;
      breakdown.overallSummary.totalAmountPayable = semesterResult.overallSummary.totalAmountPayable;
      break;

    case 'instalment_wise':
      const installmentResult = calculateInstallmentWiseBreakdown(feeStructure, scholarshipAmount, admissionFeeGST, admissionFee);
      breakdown.semesters = installmentResult.semesters;
      breakdown.overallSummary.totalGST = installmentResult.overallSummary.totalGST;
      breakdown.overallSummary.totalAmountPayable = installmentResult.overallSummary.totalAmountPayable;
      break;

    default:
      // No plan selected, return basic breakdown
      break;
  }

  return breakdown;
};
