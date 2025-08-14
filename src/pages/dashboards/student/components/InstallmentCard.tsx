import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, CheckCircle, Calendar } from 'lucide-react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import PaymentSubmissionForm from './PaymentSubmissionFormV2';
import { FeeBreakdown } from './FeeBreakdown';
import { PaymentSubmissionData, PaymentBreakdown } from '@/types/payments';
import { PaymentStatusBadge } from '@/components/fee-collection/PaymentStatusBadge';
import { CohortStudent } from '@/types/cohort';

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

export interface InstallmentCardProps {
  installment: DatabaseInstallment;
  semesterNumber: number;
  installmentIndex: number;
  selectedPaymentPlan: PaymentPlan;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: CohortStudent;
  paymentBreakdown?: PaymentBreakdown;
  onInstallmentClick: (
    installment: DatabaseInstallment,
    semesterNumber: number,
    installmentIndex: number
  ) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

export const InstallmentCard: React.FC<InstallmentCardProps> = ({
  installment,
  semesterNumber,
  installmentIndex,
  selectedPaymentPlan,
  selectedInstallmentKey,
  showPaymentForm,
  paymentSubmissions,
  submittingPayments,
  studentData,
  paymentBreakdown,
  onInstallmentClick,
  onPaymentSubmission,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const currentKey = `${semesterNumber}-${installmentIndex}`;
  const isSelected = selectedInstallmentKey === currentKey;
  const isPaid =
    installment.status === 'paid' ||
    installment.amountPaid >= installment.amount;

  // Determine if payment form should be shown automatically
  const shouldShowPaymentForm = () => {
    // Never show if fully paid
    if (isPaid || (installment.amountPending ?? 0) <= 0) return false;

    // Allowed statuses for user submission
    // - pending variants and upcoming
    // - overdue variants
    // - setup failed states (retry allowed)
    const ALLOWED: string[] = [
      'pending',
      // 'pending_10_plus_days' treated as Upcoming in UI; do not allow
      // 'upcoming' not allowed
      'overdue',
      'partially_paid_days_left',
      'partially_paid_overdue',
      'setup_request_failed_e_nach',
      'setup_request_failed_physical_mandate',
    ];

    // Disallowed statuses (form should not appear)
    // - verification in progress
    // - awaiting bank approval flows
    // - complete/paid/on_time/dropped
    const BLOCKED: string[] = [
      'verification_pending',
      'partially_paid_verification_pending',
      'awaiting_bank_approval_e_nach',
      'awaiting_bank_approval_physical_mandate',
      'paid',
      'complete',
      'on_time',
      'dropped',
    ];

    if (BLOCKED.includes(installment.status)) return false;
    if (ALLOWED.includes(installment.status)) return true;
    if (
      installment.status === 'pending_10_plus_days' ||
      installment.status === 'upcoming'
    )
      return false;

    // Fallback: if unknown status but there is pending amount, allow submission
    return true;
  };

  const getInstallmentLabel = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'Full Payment';
      case 'sem_wise':
        return `Semester ${semesterNumber} Payment`;
      case 'instalment_wise':
        return `Installment ${installment.installmentNumber}`;
      default:
        return `Installment ${installment.installmentNumber}`;
    }
  };

  // Convert database installment to the format expected by PaymentSubmissionForm
  const convertedInstallment = {
    id: `${semesterNumber}-${installment.installmentNumber}`,
    installmentNumber: installment.installmentNumber,
    amount: installment.amount,
    dueDate: installment.dueDate,
    status: installment.status,
    amountPaid: installment.amountPaid,
    amountRemaining: installment.amountPending,
    isOverdue: new Date(installment.dueDate) < new Date(),
    originalAmount: installment.amount,
    // Use the actual calculated values from admin logic
    baseAmount: installment.baseAmount,
    gstAmount: installment.gstAmount,
    discountAmount: installment.discountAmount,
    amountPayable: installment.amountPayable,
    paymentDate: installment.dueDate,
  };

  return (
    <div className='space-y-4'>
      {/* Installment Header */}
      <div
        className={`p-4 border rounded-lg transition-all duration-300 ${
          isPaid
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800/50'
            : 'bg-card'
        }`}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div
              className={`text-sm ${
                isPaid
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-muted-foreground'
              }`}
            >
              {getInstallmentLabel()} • {formatCurrency(installment.amount)} •{' '}
              {formatDate(installment.dueDate)}
            </div>
            {isPaid && (
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
            )}
          </div>
          <PaymentStatusBadge status={installment.status} />
        </div>

        <div
          className={`grid grid-cols-2 gap-4 mb-3 p-3 rounded-lg ${
            isPaid
              ? 'bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
              : 'bg-muted/50'
          }`}
        >
          <div>
            <p
              className={`text-xs ${
                isPaid
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-muted-foreground'
              }`}
            >
              Amount Paid
            </p>
            <p
              className={`text-sm font-semibold ${
                isPaid ? 'text-green-700 dark:text-green-300' : 'text-green-600'
              }`}
            >
              {formatCurrency(installment.amountPaid)}
            </p>
          </div>
          <div>
            <p
              className={`text-xs ${
                isPaid
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-muted-foreground'
              }`}
            >
              Amount Pending
            </p>
            <p
              className={`text-sm font-semibold ${
                isPaid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600'
              }`}
            >
              {formatCurrency(installment.amountPending)}
            </p>
          </div>
        </div>

        {/* Completion Message - Show when paid */}
        {isPaid && (
          <div className='mt-4 p-4 bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0' />
              <div>
                <h4 className='font-semibold text-green-800 dark:text-green-200'>
                  Payment Completed
                </h4>
                <p className='text-sm text-green-700 dark:text-green-300'>
                  This installment has been fully paid. Thank you for your
                  payment!
                </p>
                {installment.paymentDate && (
                  <p className='text-xs text-green-600 dark:text-green-400 mt-1'>
                    Paid on {formatDate(installment.paymentDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Form - Automatically show if payment is needed */}
        {shouldShowPaymentForm() && (
          <div className='mt-4 p-4 border rounded-lg bg-muted/50'>
            <PaymentSubmissionForm
              paymentSubmissions={paymentSubmissions || new Map()}
              submittingPayments={submittingPayments || new Set()}
              onPaymentSubmission={onPaymentSubmission}
              studentData={studentData}
              selectedPaymentPlan={selectedPaymentPlan}
              paymentBreakdown={paymentBreakdown}
              selectedInstallment={convertedInstallment}
            />
          </div>
        )}

        {/* Fee Breakdown - Show for all installments */}
        <div className='mt-4'>
          <FeeBreakdown
            baseAmount={convertedInstallment.baseAmount}
            gstAmount={convertedInstallment.gstAmount}
            discountAmount={convertedInstallment.discountAmount}
            amountPayable={convertedInstallment.amountPayable}
          />
        </div>
      </div>
    </div>
  );
};
