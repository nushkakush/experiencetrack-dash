import { useMemo } from 'react';
import { CohortStudent } from '@/types/cohort';
import { extractBaseAmountFromTotal, extractGSTFromTotal } from '@/utils/fee-calculations/gst';
import { useStudentData } from './useStudentData';
import { usePaymentPlanManagement } from './usePaymentPlanManagement';
import { PaymentBreakdown } from '@/types/payments';
import {
  calculateScholarshipAmount,
  generateDefaultPaymentBreakdown,
  calculateOneShotBreakdown,
  calculateSemesterWiseBreakdown,
  calculateInstallmentWiseBreakdown
} from '../utils/paymentCalculationUtils';

interface UsePaymentCalculationsProps {
  studentData: CohortStudent;
}

export const usePaymentCalculations = ({ studentData }: UsePaymentCalculationsProps) => {
  const {
    studentPayments,
    feeStructure,
    scholarships,
    loading,
    error
  } = useStudentData();

  // Get selected payment plan from student payments
  const selectedPaymentPlan = useMemo(() => {
    if (studentPayments && studentPayments.length > 0) {
      // Find the first payment with a payment plan
      const paymentWithPlan = studentPayments.find(payment => payment.payment_plan);
      return paymentWithPlan?.payment_plan || 'not_selected';
    }
    return 'not_selected';
  }, [studentPayments]);

  const {
    handlePaymentPlanSelection,
    getPaymentMethods
  } = usePaymentPlanManagement({
    studentData,
    selectedPaymentPlan,
    setSelectedPaymentPlan: () => {}, // We'll handle this differently
    reloadStudentPayments: () => {} // We'll handle this differently
  });

  // Generate payment breakdown using the exact logic from fee-calculations
  const paymentBreakdown = useMemo(() => {
    // If we don't have fee structure, return default breakdown
    if (!feeStructure) {
      return generateDefaultPaymentBreakdown();
    }

    // Calculate scholarship amount from admin dashboard data
    const totalProgramFee = Number(feeStructure.total_program_fee);
    const scholarshipAmount = calculateScholarshipAmount(scholarships, totalProgramFee);

    // If we have fee structure but no student payments, still generate breakdown for plan selection
    if (!studentPayments || studentPayments.length === 0) {
      // Generate a default breakdown that can be used for plan selection
      const admissionFee = Number(feeStructure.admission_fee);

      // Extract admission fee breakdown (GST inclusive)
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
    }

    const admissionFee = Number(feeStructure.admission_fee);

    // Extract admission fee breakdown (GST inclusive)
    const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
    const admissionFeeGST = extractGSTFromTotal(admissionFee);

    let breakdown: PaymentBreakdown = {
      admissionFee: {
        baseAmount: admissionFeeBase,
        scholarshipAmount: 0,
        discountAmount: 0,
        gstAmount: admissionFeeGST,
        totalPayable: admissionFee, // Total is the original admission fee (GST inclusive)
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

    if (selectedPaymentPlan === 'one_shot') {
      const oneShotResult = calculateOneShotBreakdown(feeStructure, scholarshipAmount, admissionFeeGST);
      breakdown.semesters = oneShotResult.semesters;
      breakdown.overallSummary.totalGST = oneShotResult.overallSummary.totalGST;
      breakdown.overallSummary.totalDiscount = oneShotResult.overallSummary.totalDiscount;
      breakdown.overallSummary.totalAmountPayable = oneShotResult.overallSummary.totalAmountPayable;

    } else if (selectedPaymentPlan === 'sem_wise') {
      const semesterResult = calculateSemesterWiseBreakdown(feeStructure, scholarshipAmount, admissionFeeGST, admissionFee);
      breakdown.semesters = semesterResult.semesters;
      breakdown.overallSummary.totalGST = semesterResult.overallSummary.totalGST;
      breakdown.overallSummary.totalAmountPayable = semesterResult.overallSummary.totalAmountPayable;

    } else if (selectedPaymentPlan === 'instalment_wise') {
      const installmentResult = calculateInstallmentWiseBreakdown(feeStructure, scholarshipAmount, admissionFeeGST, admissionFee);
      breakdown.semesters = installmentResult.semesters;
      breakdown.overallSummary.totalGST = installmentResult.overallSummary.totalGST;
      breakdown.overallSummary.totalAmountPayable = installmentResult.overallSummary.totalAmountPayable;
    }

    return breakdown;
  }, [studentPayments, feeStructure, selectedPaymentPlan, scholarships]);

  return {
    paymentBreakdown,
    selectedPaymentPlan,
    handlePaymentPlanSelection,
    getPaymentMethods,
    loading,
    studentPayments,
    scholarships
  };
};
