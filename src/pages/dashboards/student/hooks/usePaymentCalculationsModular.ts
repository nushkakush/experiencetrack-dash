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
    error
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
    setSelectedPaymentPlan: () => {}, // We'll handle this differently
    reloadStudentPayments: () => {} // We'll handle this differently
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
