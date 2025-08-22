/**
 * Payment Plan Hook
 * Custom hook for payment plan data management
 */

import { useState, useCallback } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/useApiQuery';
import { PaymentPlanData } from './PaymentPlanDisplay';
import { PaymentPlanFormData } from './PaymentPlanForm';
import { studentPaymentPlanService } from '@/services/studentPaymentPlan.service';
import { Logger } from '@/lib/logging/Logger';

export function usePaymentPlan(studentId: string) {
  const [error, setError] = useState<string | null>(null);
  const logger = Logger.getInstance();

  // Fetch current payment plan
  const {
    data: paymentPlan,
    isLoading: loading,
    error: queryError,
    refetch: loadPaymentPlan,
  } = useApiQuery({
    queryKey: ['paymentPlan', studentId],
    queryFn: async () => {
      try {
        const plan = await studentPaymentPlanService.getStudentPaymentPlan(studentId);
        return plan as PaymentPlanData;
      } catch (err) {
        logger.error('Failed to load payment plan', { error: err, studentId });
        throw err;
      }
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update payment plan mutation
  const updatePaymentPlanMutation = useApiMutation({
    mutationFn: async (formData: PaymentPlanFormData) => {
      try {
        const result = await studentPaymentPlanService.setStudentPaymentPlan(
          formData.studentId,
          formData.paymentPlan
        );
        return result;
      } catch (err) {
        logger.error('Failed to update payment plan', { error: err, formData });
        throw err;
      }
    },
    onSuccess: () => {
      setError(null);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment plan';
      setError(errorMessage);
    },
    invalidateQueries: [['paymentPlan', studentId]],
  });

  const updatePaymentPlan = useCallback(async (formData: PaymentPlanFormData) => {
    setError(null);
    return updatePaymentPlanMutation.mutateAsync(formData);
  }, [updatePaymentPlanMutation]);

  const hasCustomPlan = paymentPlan?.is_custom || false;

  return {
    paymentPlan,
    loading,
    error: error || queryError?.message || null,
    loadPaymentPlan,
    updatePaymentPlan,
    isUpdating: updatePaymentPlanMutation.isPending,
    hasCustomPlan,
  };
}
