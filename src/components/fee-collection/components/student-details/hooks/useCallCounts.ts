import { useState, useEffect } from 'react';
import { PaymentCallLogsService } from '@/services/paymentCallLogs.service';

interface CallCounts {
  [key: string]: number;
}

export const useCallCounts = (studentId: string) => {
  const [callCounts, setCallCounts] = useState<CallCounts>({});
  const [loading, setLoading] = useState(false);

  const getCallCount = (
    semesterNumber: number,
    installmentNumber: number
  ): number => {
    const key = `${semesterNumber}-${installmentNumber}`;
    return callCounts[key] || 0;
  };

  const fetchCallCounts = async () => {
    setLoading(true);
    try {
      // Fetch all call logs for the student
      const allCallLogs = await PaymentCallLogsService.getCallLogs({
        student_id: studentId,
      });

      // Group by semester and installment
      const counts: CallCounts = {};
      allCallLogs.forEach(call => {
        const key = `${call.semester_number}-${call.installment_number}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      setCallCounts(counts);
    } catch (error) {
      console.error('Failed to fetch call counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCallCounts = () => {
    fetchCallCounts();
  };

  useEffect(() => {
    if (studentId) {
      fetchCallCounts();
    }
  }, [studentId]);

  return {
    callCounts,
    getCallCount,
    refreshCallCounts,
    loading,
  };
};
