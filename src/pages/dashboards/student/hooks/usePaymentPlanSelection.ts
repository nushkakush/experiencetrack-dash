import { useMemo } from 'react';
import { StudentPayment, PaymentPlan } from '@/types/payments/PaymentCalculationTypes';

interface UsePaymentPlanSelectionProps {
  studentPayments: StudentPayment[];
}

export const usePaymentPlanSelection = ({ studentPayments }: UsePaymentPlanSelectionProps) => {
  // Get selected payment plan from student payments
  const selectedPaymentPlan = useMemo((): PaymentPlan => {
    if (studentPayments && studentPayments.length > 0) {
      // Find the first payment with a payment plan
      const paymentWithPlan = studentPayments.find(payment => payment.payment_plan);
      return (paymentWithPlan?.payment_plan as PaymentPlan) || 'not_selected';
    }
    return 'not_selected';
  }, [studentPayments]);

  return {
    selectedPaymentPlan
  };
};
