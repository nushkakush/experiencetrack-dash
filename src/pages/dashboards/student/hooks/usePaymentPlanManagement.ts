import { studentPaymentsService } from '@/services/studentPayments.service';
import { CohortStudent } from '@/types/cohort';
import { PaymentPlan } from '@/types/fee';
import { logger } from '@/lib/logging/Logger';

interface UsePaymentPlanManagementProps {
  studentData: CohortStudent;
  selectedPaymentPlan: string;
  setSelectedPaymentPlan: (plan: string) => void;
  reloadStudentPayments: () => Promise<void>;
}

export const usePaymentPlanManagement = ({
  studentData,
  selectedPaymentPlan,
  setSelectedPaymentPlan,
  reloadStudentPayments,
}: UsePaymentPlanManagementProps) => {
  const handlePaymentPlanSelection = async (plan: string) => {
    if (!studentData?.cohort_id) return;

    try {
      logger.info('Updating payment plan:', {
        studentId: studentData.id,
        plan,
      });

      const result = await studentPaymentsService.updateStudentPaymentPlan(
        studentData.id,
        studentData.cohort_id,
        plan as PaymentPlan
      );

      if (result.success) {
        // Note: setSelectedPaymentPlan is now called by the parent component immediately
        logger.info('Payment plan updated successfully');

        // Add a small delay to ensure database changes are processed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload student payments
        await reloadStudentPayments();
      } else {
        logger.error('Failed to update payment plan:', result);
      }
    } catch (error) {
      logger.error('Error updating payment plan:', error);
    }
  };

  const getPaymentMethods = (): string[] => {
    if (selectedPaymentPlan === 'one_shot') {
      return ['cash', 'bank_transfer', 'cheque', 'razorpay'];
    }
    return ['cash', 'bank_transfer', 'cheque'];
  };

  return {
    handlePaymentPlanSelection,
    getPaymentMethods,
  };
};
