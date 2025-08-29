import { useState, useEffect, useCallback } from 'react';
import { PaymentTransaction, CommunicationHistory } from '@/types/fee';
import { studentPaymentsService } from '@/services/studentPayments.service';
import { toast } from 'sonner';

interface UseStudentDetailsProps {
  student: unknown;
}

export const useStudentDetails = ({ student }: UseStudentDetailsProps) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    try {
      // Load transactions for all payments
      const allTransactions: PaymentTransaction[] = [];
      for (const payment of student.payments || []) {
        const result = await studentPaymentsService.getPaymentTransactions(
          payment.id
        );
        if (result.success && result.data) {
          allTransactions.push(...result.data);
        }
      }
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    if (student) {
      loadStudentData();
    }
  }, [loadStudentData]);

  return {
    transactions,
    loading,
  };
};
