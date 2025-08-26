import React from 'react';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentSummary } from '@/types/fee';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { useAuth } from '@/hooks/useAuth';
import { useStudentPendingVerifications } from '@/pages/fee-payment-dashboard/hooks/useStudentPendingVerifications';

interface UseActionsCellProps {
  student: StudentPaymentSummary;
  onPendingCountUpdate?: () => void;
  onVerificationUpdate?: () => void; // Add this parameter
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    program_fee_includes_gst?: boolean;
    equal_scholarship_distribution?: boolean;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, unknown>;
    instalment_wise_dates?: Record<string, unknown>;
  };
}

export const useActionsCell = ({
  student,
  onPendingCountUpdate,
  onVerificationUpdate, // Add this parameter
  feeStructure,
}: UseActionsCellProps) => {
  const { profile } = useAuth();
  const [studentDetailsOpen, setStudentDetailsOpen] = React.useState(false);
  const [transactionsOpen, setTransactionsOpen] = React.useState(false);
  const [transactions, setTransactions] = React.useState<
    PaymentTransactionRow[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [currentTransaction, setCurrentTransaction] =
    React.useState<PaymentTransactionRow | null>(null);
  const [showPartialApprovalDialog, setShowPartialApprovalDialog] =
    React.useState(false);
  const [partialApprovalTransaction, setPartialApprovalTransaction] =
    React.useState<PaymentTransactionRow | null>(null);
  const [expectedAmount, setExpectedAmount] = React.useState(0);
  const [showResetConfirmation, setShowResetConfirmation] =
    React.useState(false);
  const [resetTransaction, setResetTransaction] =
    React.useState<PaymentTransactionRow | null>(null);

  // Get student-specific pending verification count
  const studentPaymentId = (
    student as StudentPaymentSummary & { student_payment_id?: string }
  )?.student_payment_id;
  const { pendingCount: studentPendingCount } =
    useStudentPendingVerifications(studentPaymentId);

  const fetchTransactions = async () => {
    if (!student || !student.student_id) return;
    if (
      !(student as StudentPaymentSummary & { student_payment_id?: string })
        ?.student_payment_id
    )
      return;
    setLoading(true);
    try {
      const res = await paymentTransactionService.getByPaymentId(
        (student as StudentPaymentSummary & { student_payment_id?: string })
          .student_payment_id!
      );
      if (res.success) setTransactions(res.data || []);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const calculateExpectedAmount = async (
    transaction: PaymentTransactionRow
  ): Promise<number> => {
    try {
      // Try to get the expected amount from the payment engine for accuracy
      if (
        student.student_id &&
        student.student?.cohort_id &&
        student.payment_plan &&
        feeStructure
      ) {
        try {
          // Import the payment engine client
          const { getFullPaymentView } = await import(
            '@/services/payments/paymentEngineClient'
          );

          // Get payment breakdown from payment engine
          const { breakdown } = await getFullPaymentView({
            studentId: String(student.student_id),
            cohortId: String(student.student?.cohort_id),
            paymentPlan: student.payment_plan as
              | 'one_shot'
              | 'sem_wise'
              | 'instalment_wise',
            feeStructureData: {
              total_program_fee: feeStructure.total_program_fee,
              admission_fee: feeStructure.admission_fee,
              number_of_semesters: feeStructure.number_of_semesters,
              instalments_per_semester: feeStructure.instalments_per_semester,
              one_shot_discount_percentage:
                feeStructure.one_shot_discount_percentage,
              program_fee_includes_gst:
                feeStructure.program_fee_includes_gst ?? true,
              equal_scholarship_distribution:
                feeStructure.equal_scholarship_distribution ?? false,
              one_shot_dates: feeStructure.one_shot_dates,
              sem_wise_dates: feeStructure.sem_wise_dates,
              instalment_wise_dates: feeStructure.instalment_wise_dates,
            },
          });

          // Extract the expected amount based on payment plan
          if (student.payment_plan === 'one_shot' && breakdown.oneShotPayment) {
            return breakdown.oneShotPayment.amountPayable;
          } else if (
            student.payment_plan === 'sem_wise' &&
            breakdown.semesters?.length > 0
          ) {
            // For semester-wise, get the first semester's amount as they're typically equal
            return breakdown.semesters[0].total.totalPayable;
          } else if (
            student.payment_plan === 'instalment_wise' &&
            breakdown.semesters?.length > 0
          ) {
            // For installment-wise, get the first installment amount
            const firstInstallment = breakdown.semesters[0]?.instalments?.[0];
            if (firstInstallment) {
              return firstInstallment.amountPayable;
            }
          }
        } catch (paymentEngineError) {
          console.warn(
            'Failed to get amount from payment engine, falling back to calculation:',
            paymentEngineError
          );
        }
      }

      // Fallback: Simple calculation if payment engine fails
      if (feeStructure && student.payment_plan) {
        if (student.payment_plan === 'one_shot') {
          return (
            (feeStructure.total_program_fee - feeStructure.admission_fee) *
            (1 - feeStructure.one_shot_discount_percentage / 100)
          );
        } else if (student.payment_plan === 'sem_wise') {
          return (
            (feeStructure.total_program_fee - feeStructure.admission_fee) /
            feeStructure.number_of_semesters
          );
        } else if (student.payment_plan === 'instalment_wise') {
          const totalInstallments =
            feeStructure.number_of_semesters *
            feeStructure.instalments_per_semester;
          return (
            (feeStructure.total_program_fee - feeStructure.admission_fee) /
            totalInstallments
          );
        }
      }

      // Final fallback: use transaction amount
      return Number(transaction.amount);
    } catch (error) {
      console.error('Error calculating expected amount:', error);
      return Number(transaction.amount);
    }
  };

  const handleVerify = async (
    transactionId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      setVerifyingId(transactionId);
      const adminId = profile?.user_id;
      if (!adminId) {
        toast.error('User not authenticated');
        return;
      }
      const res = await paymentTransactionService.verifyPayment(
        transactionId,
        adminId,
        decision,
        notes,
        decision === 'rejected' ? notes : undefined
      );
      if (res.success) {
        toast.success(
          decision === 'approved' ? 'Payment approved' : 'Payment rejected'
        );
        await fetchTransactions();
        setShowRejectDialog(false);
        setRejectionReason('');
        setCurrentTransaction(null);
        onPendingCountUpdate?.();
        onVerificationUpdate?.(); // Call onVerificationUpdate here
      } else {
        toast.error('Verification failed');
      }
    } catch (e) {
      toast.error('Verification failed');
    } finally {
      setVerifyingId(null);
      setRejectingId(null);
    }
  };

  const handleRejectClick = (transaction: PaymentTransactionRow) => {
    setCurrentTransaction(transaction);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (currentTransaction) {
      handleVerify(currentTransaction.id, 'rejected', rejectionReason);
    }
  };

  const handleResetClick = (transaction: PaymentTransactionRow) => {
    setResetTransaction(transaction);
    setShowResetConfirmation(true);
  };

  const handleResetConfirm = async () => {
    if (resetTransaction) {
      try {
        setVerifyingId(resetTransaction.id);
        const response =
          await paymentTransactionService.resetPaymentTransaction(
            resetTransaction.id,
            profile?.id || 'unknown'
          );

        if (response.error) {
          toast.error('Failed to reset payment: ' + response.error);
        } else {
          toast.success('Payment reset to pending status successfully');
          await fetchTransactions();
          onPendingCountUpdate?.();
          onVerificationUpdate?.(); // Call onVerificationUpdate here
        }
      } catch (error) {
        console.error('Error resetting payment:', error);
        toast.error('Failed to reset payment');
      } finally {
        setVerifyingId(null);
        setShowResetConfirmation(false);
        setResetTransaction(null);
      }
    }
  };

  const handlePartialApprovalClick = async (
    transaction: PaymentTransactionRow
  ) => {
    setPartialApprovalTransaction(transaction);

    // Calculate the correct expected amount
    const calculatedExpectedAmount = await calculateExpectedAmount(transaction);
    setExpectedAmount(calculatedExpectedAmount);

    console.log('🎯 [PartialApproval] Calculated expected amount:', {
      transactionId: transaction.id,
      studentSubmitted: transaction.amount,
      calculatedExpected: calculatedExpectedAmount,
      paymentPlan: student.payment_plan,
      feeStructure: feeStructure ? 'Available' : 'Not available',
    });

    setShowPartialApprovalDialog(true);
  };

  const handlePartialApprovalSubmit = async (
    transactionId: string,
    actualAmount: number
  ) => {
    try {
      setVerifyingId(transactionId);
      const adminId = profile?.user_id;
      if (!adminId) {
        toast.error('User not authenticated');
        return;
      }

      // Determine if this is a partial or full payment based on actual amount vs expected
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      // Use the calculated expected amount (not student's submitted amount)
      const isPartial = actualAmount < expectedAmount;

      console.log('🎯 [PartialApproval] Payment calculation:', {
        transactionId,
        studentSubmitted: Number(transaction.amount),
        actualExpected: expectedAmount,
        adminVerified: actualAmount,
        isPartial,
        remainingAmount: expectedAmount - actualAmount,
      });

      const result = await paymentTransactionService.partialApproval(
        transactionId,
        adminId,
        isPartial ? 'partial' : 'full',
        actualAmount,
        `Actual amount received: ₹${actualAmount.toLocaleString('en-IN')}`,
        undefined
      );

      if (result.success && result.data) {
        const message = isPartial
          ? `Partial payment of ₹${actualAmount.toLocaleString('en-IN')} approved`
          : `Full payment of ₹${actualAmount.toLocaleString('en-IN')} approved`;
        toast.success(message);
        await fetchTransactions();
        setShowPartialApprovalDialog(false);
        setPartialApprovalTransaction(null);
        onPendingCountUpdate?.();
        onVerificationUpdate?.(); // Call onVerificationUpdate here
      } else {
        toast.error('Processing failed');
      }
    } catch (error) {
      console.error('Partial approval error:', error);
      toast.error('Processing failed');
    } finally {
      setVerifyingId(null);
    }
  };

  // Wrapper function for SimplePartialApprovalDialog
  const handlePartialApprovalWrapper = async (approvedAmount: number) => {
    if (partialApprovalTransaction) {
      await handlePartialApprovalSubmit(
        partialApprovalTransaction.id,
        approvedAmount
      );
    }
  };

  return {
    // State
    studentDetailsOpen,
    setStudentDetailsOpen,
    transactionsOpen,
    setTransactionsOpen,
    transactions,
    loading,
    verifyingId,
    rejectingId,
    rejectionReason,
    setRejectionReason,
    showRejectDialog,
    setShowRejectDialog,
    currentTransaction,
    setCurrentTransaction,
    showPartialApprovalDialog,
    setShowPartialApprovalDialog,
    partialApprovalTransaction,
    setPartialApprovalTransaction,
    expectedAmount,
    showResetConfirmation,
    setShowResetConfirmation,
    resetTransaction,
    setResetTransaction,
    studentPendingCount,

    // Actions
    fetchTransactions,
    handleVerify,
    handleRejectClick,
    handleRejectSubmit,
    handleResetClick,
    handleResetConfirm,
    handlePartialApprovalClick,
    handlePartialApprovalWrapper,
  };
};
