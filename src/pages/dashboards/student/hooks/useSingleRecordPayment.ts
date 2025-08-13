import { useState, useEffect } from 'react';
import { SingleRecordPaymentService, StudentPaymentRecord, PaymentSchedule } from '@/services/studentPayments/SingleRecordPaymentService';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { Logger } from '@/lib/logging/Logger';

interface UseSingleRecordPaymentProps {
  studentId: string;
  cohortId: string;
  feeStructure?: FeeStructure;
}

export const useSingleRecordPayment = ({ studentId, cohortId, feeStructure }: UseSingleRecordPaymentProps) => {
  const [paymentRecord, setPaymentRecord] = useState<StudentPaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = new SingleRecordPaymentService();

  // Load payment record
  const loadPaymentRecord = async () => {
    if (!studentId || !cohortId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await service.getStudentPayment(studentId, cohortId);
      
      if (result.success && result.data) {
        setPaymentRecord(result.data);
      } else if (result.error && result.error.includes('not found')) {
        // No payment record exists yet - this is normal for new students
        setPaymentRecord(null);
      } else {
        setError(result.error || 'Failed to load payment record');
      }
    } catch (err) {
      Logger.getInstance().error('Error loading payment record', { error: err, studentId, cohortId });
      setError('Failed to load payment record');
    } finally {
      setLoading(false);
    }
  };

  // Setup payment plan
  const setupPaymentPlan = async (
    paymentPlan: PaymentPlan,
    scholarshipId?: string,
    additionalDiscountPercentage: number = 0
  ) => {
    if (!studentId || !cohortId || !feeStructure) {
      throw new Error('Missing required data for payment plan setup');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await service.setupStudentPayment(
        studentId,
        cohortId,
        paymentPlan,
        feeStructure,
        scholarshipId,
        additionalDiscountPercentage
      );

      if (result.success && result.data) {
        setPaymentRecord(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to setup payment plan');
      }
    } catch (err) {
      Logger.getInstance().error('Error setting up payment plan', { error: err, studentId, cohortId, paymentPlan });
      setError(err instanceof Error ? err.message : 'Failed to setup payment plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Record a payment
  const recordPayment = async (
    amount: number,
    paymentMethod: string,
    referenceNumber?: string,
    notes?: string
  ) => {
    if (!studentId || !cohortId) {
      throw new Error('Missing student or cohort information');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await service.recordPayment(
        studentId,
        cohortId,
        amount,
        paymentMethod,
        referenceNumber,
        notes
      );

      if (result.success && result.data) {
        setPaymentRecord(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to record payment');
      }
    } catch (err) {
      Logger.getInstance().error('Error recording payment', { error: err, studentId, cohortId, amount });
      setError(err instanceof Error ? err.message : 'Failed to record payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get payment breakdown for UI
  const getPaymentBreakdown = () => {
    if (!paymentRecord) return null;

    const schedule = paymentRecord.payment_schedule;
    const totalPaid = paymentRecord.total_amount_paid;
    const totalPayable = paymentRecord.total_amount_payable;
    const completionPercentage = totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;

    // Calculate which installments are paid/partially paid
    let cumulativePaid = 0;
    const updatedInstallments = schedule.installments.map(installment => {
      const installmentPaid = Math.min(installment.amount, Math.max(0, totalPaid - cumulativePaid));
      cumulativePaid += installment.amount;
      
      let status: 'pending' | 'paid' | 'overdue' | 'partially_paid' = 'pending';
      if (installmentPaid >= installment.amount) {
        status = 'paid';
      } else if (installmentPaid > 0) {
        status = 'partially_paid';
      } else {
        // Check if overdue
        const dueDate = new Date(installment.due_date);
        const today = new Date();
        if (today > dueDate) {
          status = 'overdue';
        }
      }

      return {
        ...installment,
        amount_paid: installmentPaid,
        amount_pending: installment.amount - installmentPaid,
        status
      };
    });

    return {
      paymentPlan: paymentRecord.payment_plan,
      totalAmount: totalPayable,
      totalPaid,
      totalPending: totalPayable - totalPaid,
      completionPercentage,
      installments: updatedInstallments,
      nextDueDate: paymentRecord.next_due_date,
      nextDueAmount: updatedInstallments.find(i => i.status !== 'paid')?.amount_pending || 0,
      paymentStatus: paymentRecord.payment_status,
      scholarshipId: paymentRecord.scholarship_id
    };
  };

  // Load payment record on mount
  useEffect(() => {
    loadPaymentRecord();
  }, [studentId, cohortId]);

  return {
    paymentRecord,
    loading,
    error,
    setupPaymentPlan,
    recordPayment,
    getPaymentBreakdown,
    refresh: loadPaymentRecord
  };
};
