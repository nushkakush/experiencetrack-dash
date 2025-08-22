/**
 * Shared payment plan descriptions
 * Centralized descriptions to avoid duplication across components
 */

export type PaymentPlan = 'one_shot' | 'sem_wise' | 'instalment_wise' | 'not_selected';

/**
 * Get the description for a payment plan
 * @param plan - The payment plan type
 * @returns The description string for the plan
 */
export const getPaymentPlanDescription = (plan: PaymentPlan): string => {
  switch (plan) {
    case 'one_shot':
      return 'One-time payment for the entire program with maximum discount';
    case 'sem_wise':
      return 'Payments divided by semesters with clear payment schedule';
    case 'instalment_wise':
      return 'Payments divided into monthly installments for maximum flexibility';
    case 'not_selected':
    default:
      return 'Select the payment plan that works best for you. Each plan offers different payment methods and flexibility.';
  }
};

/**
 * Get the title for a payment plan
 * @param plan - The payment plan type
 * @returns The title string for the plan
 */
export const getPaymentPlanTitle = (plan: PaymentPlan): string => {
  switch (plan) {
    case 'one_shot':
      return 'One Shot Payment';
    case 'sem_wise':
      return 'Semester Wise';
    case 'instalment_wise':
      return 'Installment Wise';
    case 'not_selected':
    default:
      return 'Payment Plan';
  }
};
