import { useMemo } from 'react';
import { StudentPayment, PaymentPlan } from '@/types/payments/PaymentCalculationTypes';

interface UsePaymentPlanSelectionProps {
  studentPayments: StudentPayment[];
}

export const usePaymentPlanSelection = ({ studentPayments }: UsePaymentPlanSelectionProps) => {
  // Get selected payment plan from student payments
  const selectedPaymentPlan = useMemo((): PaymentPlan => {
    if (studentPayments && studentPayments.length > 0) {
      // With single record approach, we only have one payment record per student
      const payment = studentPayments[0];
      return (payment?.payment_plan as PaymentPlan) || 'not_selected';
    }
    return 'not_selected';
  }, [studentPayments]);

  return {
    selectedPaymentPlan
  };
};
