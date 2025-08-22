/**
 * Admin Payment Recording Hook
 * Custom hook for admin payment recording operations
 */

import { useState, useCallback } from 'react';
import { useApiMutation } from '@/shared/hooks/useApiQuery';
import { PaymentRecordingData } from './PaymentRecordingForm';
import { Logger } from '@/lib/logging/Logger';

export interface AdminPaymentData extends PaymentRecordingData {
  studentId: string;
}

export function useAdminPaymentRecording() {
  const [error, setError] = useState<string | null>(null);
  const logger = Logger.getInstance();

  // Record payment mutation
  const recordPaymentMutation = useApiMutation({
    mutationFn: async (data: AdminPaymentData) => {
      try {
        // Mock API call - replace with actual service
        const formData = new FormData();
        formData.append('studentId', data.studentId);
        formData.append('amount', data.amount.toString());
        formData.append('paymentMethod', data.paymentMethod);
        formData.append('paymentDate', data.paymentDate);
        
        if (data.transactionId) {
          formData.append('transactionId', data.transactionId);
        }
        
        if (data.notes) {
          formData.append('notes', data.notes);
        }
        
        if (data.receipt) {
          formData.append('receipt', data.receipt);
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock response
        return {
          id: `payment_${Date.now()}`,
          studentId: data.studentId,
          amount: data.amount,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        logger.error('Payment recording failed', { error: err, data });
        throw err;
      }
    },
    onSuccess: (result, variables) => {
      setError(null);
      logger.info('Payment recorded successfully', { 
        paymentId: result.id,
        studentId: variables.studentId,
        amount: variables.amount 
      });
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      setError(errorMessage);
    },
    invalidateQueries: [['payments'], ['studentPayments'], ['paymentStats']],
  });

  const recordPayment = useCallback(async (data: AdminPaymentData) => {
    setError(null);
    return recordPaymentMutation.mutateAsync(data);
  }, [recordPaymentMutation]);

  return {
    recordPayment,
    isRecording: recordPaymentMutation.isPending,
    error,
  };
}
