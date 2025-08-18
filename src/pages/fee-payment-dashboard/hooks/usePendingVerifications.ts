import { useState, useEffect } from 'react';
import { paymentTransactionService } from '@/services/paymentTransaction.service';

export const usePendingVerifications = (cohortId: string | undefined) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingCount = async () => {
    if (!cohortId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await paymentTransactionService.getPendingVerificationCount(cohortId);

      if (response.success) {
        setPendingCount(response.data || 0);
      } else {
        setError('Failed to fetch pending verifications');
      }
    } catch (err) {
      setError('Failed to fetch pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [cohortId]);

  return {
    pendingCount,
    loading,
    error,
    refetch: fetchPendingCount,
  };
};
