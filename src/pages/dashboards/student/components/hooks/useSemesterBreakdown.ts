import React, { useMemo } from 'react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { CohortStudent, Cohort } from '@/types/cohort';
import { PaymentSubmissionData } from '@/types/payments';
import { Logger } from '@/lib/logging/Logger';
import {
  StudentPaymentRow,
  PaymentTransactionRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { PaymentBreakdown as PaymentBreakdownType } from '@/types/payments';

// Define the installment type that includes scholarship amounts
interface DatabaseInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  amountPaid: number;
  amountPending: number;
  semesterNumber?: number;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
  totalPayable: number;
  paymentDate: string | null;
}

// Define the semester type close to engine output
type EngineSemester = {
  semesterNumber: number;
  total?: {
    totalPayable?: number;
    totalPaid?: number;
    totalPending?: number;
  };
  totalPayable?: number;
  instalments?: DatabaseInstallment[];
};

// Minimal engine breakdown shape consumed here
type EnginePaymentBreakdown = {
  admissionFee?: { totalPayable?: number } | null;
  oneShotPayment?: {
    amountPayable?: number;
    baseAmount?: number;
    discountAmount?: number;
    scholarshipAmount?: number;
    gstAmount?: number;
    paymentDate?: string;
  } | null;
  semesters?: EngineSemester[];
  overallSummary?: { totalAmountPayable?: number } | null;
};

interface UseSemesterBreakdownProps {
  paymentBreakdown: EnginePaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
  paymentTransactions?: PaymentTransactionRow[];
}

export const useSemesterBreakdown = ({
  paymentBreakdown,
  selectedPaymentPlan,
  paymentTransactions,
}: UseSemesterBreakdownProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Check if all installments in a semester are completed
  const isSemesterCompleted = (semester: EngineSemester) => {
    if (!semester.instalments || semester.instalments.length === 0) {
      return false;
    }

    return semester.instalments.every((installment: DatabaseInstallment) => {
      return installment.status === 'paid' || installment.status === 'waived';
    });
  };

  // Compute status for one-shot payments
  const computeOneShotStatus = (totalPayable: number, amountPaid: number, due: string) => {
    // Check verification status from payment_transactions table (primary source)
    const hasVerificationPendingByTx = Array.isArray(paymentTransactions)
      ? paymentTransactions.some(
          t => t.verification_status === 'verification_pending'
        )
      : false;

    const hasApprovedTransactions = Array.isArray(paymentTransactions)
      ? paymentTransactions.some(t => t.verification_status === 'approved')
      : false;

    // If no transactions exist, this is a pending payment
    if (
      !Array.isArray(paymentTransactions) ||
      paymentTransactions.length === 0
    ) {
      return 'pending';
    }

    // If there are approved transactions and amount is fully paid, it's paid
    if (hasApprovedTransactions && amountPaid >= totalPayable) {
      return 'paid';
    }

    // If there are verification pending transactions
    if (hasVerificationPendingByTx && amountPaid > 0) {
      // Check if amount is fully paid first
      if (amountPaid >= totalPayable) {
        return 'verification_pending';
      }
      return 'partially_paid_verification_pending';
    }

    // No fallback - rely purely on payment_transactions table
    if (!due) return 'pending';
    const dueDate = new Date(due);
    const today = new Date();
    const d0 = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const d1 = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    ).getTime();
    const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));

    // Only return 'paid' if there's no verification_pending status and amount is fully paid
    if (amountPaid >= totalPayable && !hasVerificationPendingByTx)
      return 'paid';
    if (daysUntilDue < 0) {
      return amountPaid > 0 ? 'partially_paid_overdue' : 'overdue';
    }
    if (daysUntilDue >= 10) return 'pending_10_plus_days';
    return 'pending';
  };

  // Compute status for installment payments
  const computeInstallmentStatus = (
    inst: DatabaseInstallment,
    txForInstall: PaymentTransactionRow[],
    totalPayable: number,
    allocatedPaid: number,
    due: string
  ): PaymentStatus => {
    const hasProvided =
      typeof inst.status === 'string' && inst.status.length > 0;
    if (hasProvided) return String(inst.status) as PaymentStatus;

    // Check verification status from payment_transactions table (primary source)
    const hasVerificationPendingByTx = txForInstall.some(
      t => t.verification_status === 'verification_pending'
    );
    const hasApprovedTransactions = txForInstall.some(
      t => t.verification_status === 'approved'
    );

    // If no transactions exist, this is a pending payment
    if (
      !Array.isArray(paymentTransactions) ||
      paymentTransactions.length === 0
    ) {
      return 'pending';
    }

    // If there are approved transactions and amount is fully paid, it's paid
    if (hasApprovedTransactions && allocatedPaid >= totalPayable) {
      return 'paid';
    }

    // If there are verification pending transactions
    if (hasVerificationPendingByTx && allocatedPaid > 0) {
      // Check if amount is fully paid first
      if (allocatedPaid >= totalPayable) {
        return 'verification_pending';
      }
      return 'partially_paid_verification_pending';
    }

    if (!due) return 'pending';
    const dueDate = new Date(due);
    const today = new Date();
    // normalize to date only
    const d0 = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const d1 = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    ).getTime();
    const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));

    // No fallback - rely purely on payment_transactions table
    const hasVerificationPending = hasVerificationPendingByTx;

    // Only return 'paid' if there's no verification_pending status and amount is fully paid
    if (allocatedPaid >= totalPayable && !hasVerificationPending)
      return 'paid';
    if (daysUntilDue < 0) {
      // Past due
      return allocatedPaid > 0 ? 'partially_paid_overdue' : 'overdue';
    }

    if (hasVerificationPending && allocatedPaid > 0) {
      // Check if amount is fully paid first
      if (allocatedPaid >= totalPayable) {
        return 'verification_pending';
      }
      return 'partially_paid_verification_pending';
    }
    if (allocatedPaid > 0) return 'partially_paid_days_left';
    if (daysUntilDue >= 10) return 'pending_10_plus_days';
    return 'pending';
  };

  // Create one-shot payment installment
  const createOneShotInstallment = useMemo(() => {
    if (
      selectedPaymentPlan !== 'one_shot' ||
      !paymentBreakdown?.oneShotPayment
    ) {
      return null;
    }

    const totalPayable = Number(
      paymentBreakdown.oneShotPayment.amountPayable || 0
    );
    // Support both DB row shape (total_amount_paid) and converted shape (amountPaid)
    // Calculate amount paid from payment_transactions table (pure source of truth)
    const amountPaidRaw = Array.isArray(paymentTransactions)
      ? paymentTransactions.reduce((total, tx) => {
          // Only count approved transactions or pending verification transactions
          if (
            tx.verification_status === 'approved' ||
            tx.verification_status === 'verification_pending'
          ) {
            return total + (tx.amount || 0);
          }
          return total;
        }, 0)
      : 0;

    // Clamp paid shown for this installment to not exceed its payable
    const amountPaid = Math.min(amountPaidRaw, totalPayable);
    const due = String(paymentBreakdown.oneShotPayment.paymentDate || '');

    const status = computeOneShotStatus(totalPayable, amountPaid, due);

    return {
      installmentNumber: 1,
      dueDate: due,
      amount: totalPayable,
      status,
      amountPaid,
      amountPending: Math.max(0, totalPayable - amountPaid),
      semesterNumber: 1,
      baseAmount: Number(paymentBreakdown.oneShotPayment.baseAmount || 0),
      scholarshipAmount: Number(
        paymentBreakdown.oneShotPayment.scholarshipAmount || 0
      ),
      discountAmount: Number(
        paymentBreakdown.oneShotPayment.discountAmount || 0
      ),
      gstAmount: Number(paymentBreakdown.oneShotPayment.gstAmount || 0),
      amountPayable: totalPayable,
      totalPayable: totalPayable,
      paymentDate: null,
    } as DatabaseInstallment;
  }, [paymentBreakdown, selectedPaymentPlan, paymentTransactions]);

  // Check if has semesters
  const hasSemesters = useMemo(() => {
    return paymentBreakdown?.semesters && paymentBreakdown.semesters.length > 0;
  }, [paymentBreakdown]);

  // Check if should show one-shot payment
  const shouldShowOneShot = useMemo(() => {
    return (
      selectedPaymentPlan === 'one_shot' &&
      paymentBreakdown?.oneShotPayment &&
      !hasSemesters
    );
  }, [selectedPaymentPlan, paymentBreakdown, hasSemesters]);

  Logger.getInstance().debug('SemesterBreakdown render', {
    hasPaymentBreakdown: !!paymentBreakdown,
    semestersCount: paymentBreakdown?.semesters?.length || 0,
    selectedPaymentPlan,
    hasSemesters,
    shouldShowOneShot,
  });

  return {
    formatCurrency,
    isSemesterCompleted,
    computeInstallmentStatus,
    createOneShotInstallment,
    hasSemesters,
    shouldShowOneShot,
  };
};
