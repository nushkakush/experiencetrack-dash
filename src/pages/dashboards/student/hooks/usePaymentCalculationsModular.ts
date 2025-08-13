import { CohortStudent } from '@/types/cohort';
import { useStudentData } from './useStudentData';
import { usePaymentPlanManagement } from './usePaymentPlanManagement';
import { usePaymentPlanSelection } from './usePaymentPlanSelection';
import { usePaymentBreakdown } from './usePaymentBreakdown';

interface UsePaymentCalculationsProps {
  studentData: CohortStudent;
}

export const usePaymentCalculations = ({ studentData }: UsePaymentCalculationsProps) => {
  const {
    studentPayments,
    feeStructure,
    scholarships,
    loading,
    error,
    refetch
  } = useStudentData();

  // Get selected payment plan using focused hook
  const { selectedPaymentPlan } = usePaymentPlanSelection({ studentPayments });

  // Get payment plan management functions
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

  // Generate payment breakdown using focused hook
  const paymentBreakdown = usePaymentBreakdown({
    feeStructure,
    studentPayments,
    selectedPaymentPlan,
    scholarships
  });

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
