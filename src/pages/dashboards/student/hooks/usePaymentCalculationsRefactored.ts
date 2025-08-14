import { useMemo, useState, useEffect } from 'react';
import { CohortStudent } from '@/types/cohort';
import { extractBaseAmountFromTotal, extractGSTFromTotal } from '@/utils/fee-calculations/gst';
import { useStudentData } from './useStudentData';
import { usePaymentPlanManagement } from './usePaymentPlanManagement';
import { usePaymentScheduleFromDatabase } from './usePaymentScheduleFromDatabase';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
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
    cohortData,
    loading,
    error,
    refetch
  } = useStudentData();

  const [scholarshipAmount, setScholarshipAmount] = useState(0);
  const [loadingScholarship, setLoadingScholarship] = useState(false);

  // Calculate scholarship amount
  useEffect(() => {
    const calculateScholarship = async () => {
      if (!studentData?.id || !feeStructure?.total_program_fee) {
        setScholarshipAmount(0);
        return;
      }

      setLoadingScholarship(true);
      try {
        const amount = await calculateScholarshipAmount(studentData.id, Number(feeStructure.total_program_fee));
        setScholarshipAmount(amount);
      } catch (error) {
        console.error('Error calculating scholarship amount:', error);
        setScholarshipAmount(0);
      } finally {
        setLoadingScholarship(false);
      }
    };

    calculateScholarship();
  }, [studentData?.id, feeStructure?.total_program_fee]);

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
    setSelectedPaymentPlan: () => {
      // Trigger a refetch to update the UI
      refetch();
    },
    reloadStudentPayments: refetch // Pass the actual refetch function
  });

  // Try to get payment schedule from database first
  const dbPaymentBreakdown = usePaymentScheduleFromDatabase({
    studentPayments,
    feeStructure,
    scholarshipAmount: scholarshipAmount || 0,
    cohortStartDate: cohortData?.start_date || '2025-08-14' // Use dynamic cohort start date
  });
  const hasPaymentSchedule = !!dbPaymentBreakdown;

  // Generate payment breakdown using the exact logic from fee-calculations (fallback)
  const calculatedPaymentBreakdown = useMemo(() => {
    // If we don't have fee structure, return default breakdown
    if (!feeStructure) {
      return generateDefaultPaymentBreakdown();
    }

    // Use the calculated scholarship amount
    const totalProgramFee = Number(feeStructure.total_program_fee);

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
        totalScholarship: scholarshipAmount,
        totalAmountPayable: 0,
      },
    };

    if (selectedPaymentPlan === 'one_shot') {
      const oneShotResult = calculateOneShotBreakdown(feeStructure, scholarshipAmount, admissionFeeGST);
      breakdown.semesters = oneShotResult.semesters;
      breakdown.oneShotPayment = oneShotResult.oneShotPayment;
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
  }, [studentPayments, feeStructure, selectedPaymentPlan, scholarshipAmount]);

  // Use database payment schedule if available, otherwise use calculated breakdown
  const paymentBreakdown = hasPaymentSchedule ? dbPaymentBreakdown : calculatedPaymentBreakdown;

  return {
    paymentBreakdown,
    selectedPaymentPlan,
    handlePaymentPlanSelection,
    getPaymentMethods,
    loading: loading || loadingScholarship,
    studentPayments,
    scholarships,
    hasPaymentSchedule,
    refetch
  };
};
