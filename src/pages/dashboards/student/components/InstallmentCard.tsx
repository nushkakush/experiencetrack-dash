import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, CheckCircle, Calendar } from 'lucide-react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import PaymentSubmissionForm from './PaymentSubmissionFormV2';
import { FeeBreakdown } from './FeeBreakdown';
import { PaymentSubmissionData, PaymentBreakdown } from '@/types/payments';
import { PaymentStatusBadge } from '@/components/fee-collection/PaymentStatusBadge';
import { CohortStudent, Cohort } from '@/types/cohort';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';
import { PartialPaymentHistory } from '@/components/common/payments/PartialPaymentHistory';

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
  cohortData?: Cohort;
  paymentBreakdown?: PaymentBreakdown;
  paymentTransactions?: PaymentTransactionRow[]; // Add payment transactions
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
  cohortData,
  paymentBreakdown,
  paymentTransactions,
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

  // Get relevant payment transactions for this installment (pending only)
  const getRelevantTransactions = () => {
    if (!paymentTransactions || !Array.isArray(paymentTransactions)) return [];
    const instKey = `${semesterNumber}-${installment.installmentNumber}`;
    // Filter transactions relevant to this installment only
    return paymentTransactions.filter(tx => {
      const statusOk =
        tx?.verification_status === 'verification_pending' ||
        tx?.verification_status === 'pending';
      if (!statusOk) return false;
      const txKey =
        typeof tx?.installment_id === 'string' ? String(tx.installment_id) : '';
      const matchesKey = txKey === instKey;
      const matchesSemester =
        Number(tx?.semester_number) === Number(semesterNumber);
      return matchesKey || (!!txKey === false && matchesSemester);
    });
  };

  // Get ALL relevant payment transactions for this installment (for history display)
  const getAllRelevantTransactions = () => {
    if (!paymentTransactions || !Array.isArray(paymentTransactions)) return [];
    const instKey = `${semesterNumber}-${installment.installmentNumber}`;

    const transactions = paymentTransactions
      .filter(tx => {
        const txKey =
          typeof tx?.installment_id === 'string'
            ? String(tx.installment_id)
            : '';
        const matchesKey = txKey === instKey;
        const matchesSemester =
          Number(tx?.semester_number) === Number(semesterNumber);

        // Debug logging for transaction matching
        console.log('🔍 [InstallmentCard] Transaction matching:', {
          transactionId: tx.id,
          transactionInstallmentId: txKey,
          transactionSemester: tx?.semester_number,
          currentInstKey: instKey,
          currentSemester: semesterNumber,
          matchesKey,
          matchesSemester,
          lit_invoice_id: tx.lit_invoice_id,
          // Special check for the specific transaction we know has an invoice
          isSpecificTransaction:
            tx.id === 'b66ca684-abf6-4bac-b293-277af106d3b4',
        });

        // For one-shot payments, be more inclusive - match by semester if installment_id doesn't match
        const isOneShotPayment = selectedPaymentPlan === 'one_shot';
        const shouldInclude =
          matchesKey || (isOneShotPayment && matchesSemester);

        // Special case: if this transaction has an invoice, always include it for this installment
        if (tx.lit_invoice_id) {
          console.log(
            '🔍 [InstallmentCard] Including transaction with invoice:',
            {
              transactionId: tx.id,
              lit_invoice_id: tx.lit_invoice_id,
              installmentKey: instKey,
              shouldInclude: true,
            }
          );
          return true;
        }

        return shouldInclude;
      })
      .map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        partial_payment_sequence: tx.partial_payment_sequence || 0,
        verification_status: tx.verification_status || 'pending',
        created_at: tx.created_at || new Date().toISOString(),
        payment_method: tx.payment_method,
        notes: tx.notes,
        verification_notes: tx.verification_notes,
        rejection_reason: tx.rejection_reason,
        lit_invoice_id: tx.lit_invoice_id, // Include this for invoice checking
      }));

    // Debug logging for this specific installment
    console.log(
      '🔍 [InstallmentCard] getAllRelevantTransactions for installment:',
      {
        installmentKey: instKey,
        semesterNumber,
        installmentNumber: installment.installmentNumber,
        selectedPaymentPlan,
        allPaymentTransactions: paymentTransactions?.length || 0,
        filteredTransactions: transactions.length,
        transactions: transactions.map(t => ({
          id: t.id,
          amount: t.amount,
          status: t.verification_status,
          lit_invoice_id: t.lit_invoice_id,
          installment_id: paymentTransactions?.find(pt => pt.id === t.id)
            ?.installment_id,
        })),
        // Special check for the specific transaction with invoice
        specificTransactionFound: transactions.find(
          t => t.id === 'b66ca684-abf6-4bac-b293-277af106d3b4'
        ),
        allPaymentTransactionsWithInvoices: paymentTransactions
          ?.filter(pt => pt.lit_invoice_id)
          .map(pt => ({
            id: pt.id,
            lit_invoice_id: pt.lit_invoice_id,
            installment_id: pt.installment_id,
            semester_number: pt.semester_number,
          })),
      }
    );

    return transactions;
  };

  const relevantTransactions = getRelevantTransactions();

  // Helper function to format payment method names
  const formatPaymentMethod = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'razorpay':
        return 'Online Payment';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'cheque':
        return 'Cheque';
      case 'upi':
        return 'UPI';
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      default:
        return method ? method.replace('_', ' ').toUpperCase() : 'Unknown';
    }
  };

  const currentKey = `${semesterNumber}-${installmentIndex}`;
  const isSelected = selectedInstallmentKey === currentKey;
  // Treat installment as paid only if engine says so. Avoid numeric fallbacks.
  const isPaid =
    installment.status === 'paid' || installment.status === 'waived';

  // Check if payment is in verification pending status
  const isVerificationPending =
    installment.status === 'verification_pending' ||
    installment.status === 'partially_paid_verification_pending';

  // Check if payment is fully verified and complete
  const isFullyVerified =
    installment.status === 'paid' || installment.status === 'waived';

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
    // - waived (scholarship covers the amount)
    const BLOCKED: string[] = [
      'verification_pending',
      'partially_paid_verification_pending',
      'awaiting_bank_approval_e_nach',
      'awaiting_bank_approval_physical_mandate',
      'paid',
      'complete',
      'on_time',
      'dropped',
      'waived',
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
    semesterNumber: semesterNumber,
    amount: installment.amount,
    dueDate: installment.dueDate,
    status: (() => {
      // Map PaymentStatus to the expected Installment status format
      if (
        installment.status === 'paid' ||
        installment.status === 'complete' ||
        installment.status === 'on_time' ||
        installment.status === 'waived'
      ) {
        return 'paid' as const;
      } else if (
        installment.status === 'overdue' ||
        installment.status === 'partially_paid_overdue'
      ) {
        return 'overdue' as const;
      } else if (
        installment.status === 'partially_paid_days_left' ||
        installment.status === 'partially_paid_verification_pending' ||
        installment.status === 'partially_waived'
      ) {
        return 'partial' as const;
      } else {
        return 'pending' as const;
      }
    })(),
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
          isFullyVerified
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800/50'
            : isVerificationPending
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-950/30 dark:to-amber-950/30 dark:border-yellow-800/50'
              : 'bg-card'
        }`}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div
              className={`text-sm ${
                isFullyVerified
                  ? 'text-green-700 dark:text-green-300'
                  : isVerificationPending
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-muted-foreground'
              }`}
            >
              {getInstallmentLabel()} • {formatCurrency(installment.amount)} •{' '}
              {formatDate(installment.dueDate)}
            </div>
            {isFullyVerified && (
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
            )}
            {isVerificationPending && (
              <div className='h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-pulse'>
                ⏳
              </div>
            )}
          </div>
          <PaymentStatusBadge status={installment.status} />
        </div>

        <div
          className={`grid grid-cols-2 gap-4 mb-3 p-3 rounded-lg ${
            isFullyVerified
              ? 'bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
              : isVerificationPending
                ? 'bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50'
                : 'bg-muted/50'
          }`}
        >
          <div>
            <p
              className={`text-xs ${
                isFullyVerified
                  ? 'text-green-700 dark:text-green-300'
                  : isVerificationPending
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-muted-foreground'
              }`}
            >
              Amount Paid
            </p>
            <p
              className={`text-sm font-semibold ${
                isFullyVerified
                  ? 'text-green-700 dark:text-green-300'
                  : isVerificationPending
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-green-600'
              }`}
            >
              {formatCurrency(installment.amountPaid)}
            </p>
          </div>
          <div>
            <p
              className={`text-xs ${
                isFullyVerified
                  ? 'text-green-700 dark:text-green-300'
                  : isVerificationPending
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-muted-foreground'
              }`}
            >
              Amount Pending
            </p>
            <p
              className={`text-sm font-semibold ${
                isFullyVerified
                  ? 'text-green-600 dark:text-green-400'
                  : isVerificationPending
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-orange-600'
              }`}
            >
              {formatCurrency(installment.amountPending)}
            </p>
          </div>
        </div>

        {/* Completion Message - Show when paid */}
        {isPaid && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              isFullyVerified
                ? 'bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                : isVerificationPending
                  ? 'bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50'
                  : 'bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
            }`}
          >
            <div className='flex items-center gap-3'>
              {isFullyVerified ? (
                <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0' />
              ) : isVerificationPending ? (
                <div className='h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 animate-pulse'>
                  ⏳
                </div>
              ) : (
                <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0' />
              )}
              <div>
                <h4
                  className={`font-semibold ${
                    isFullyVerified
                      ? 'text-green-800 dark:text-green-200'
                      : isVerificationPending
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-green-800 dark:text-green-200'
                  }`}
                >
                  {isFullyVerified
                    ? installment.status === 'waived'
                      ? 'Scholarship Waived'
                      : 'Payment Completed'
                    : isVerificationPending
                      ? 'Payment Submitted - Verification Pending'
                      : installment.status === 'waived'
                        ? 'Scholarship Waived'
                        : 'Payment Completed'}
                </h4>
                <p
                  className={`text-sm ${
                    isFullyVerified
                      ? 'text-green-700 dark:text-green-300'
                      : isVerificationPending
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-green-700 dark:text-green-300'
                  }`}
                >
                  {isFullyVerified
                    ? installment.status === 'waived'
                      ? 'This installment has been fully covered by your scholarship. No payment required!'
                      : 'This installment has been fully paid. Thank you for your payment!'
                    : isVerificationPending
                      ? 'Your payment has been submitted and is awaiting verification. You will be notified once it is approved.'
                      : installment.status === 'waived'
                        ? 'This installment has been fully covered by your scholarship. No payment required!'
                        : 'This installment has been fully paid. Thank you for your payment!'}
                </p>

                {/* Payment Method and Proof Details for Verification Pending */}
                {isVerificationPending && relevantTransactions.length > 0 && (
                  <div className='mt-3 space-y-2'>
                    {relevantTransactions.map((tx, index) => (
                      <div
                        key={tx.id || index}
                        className='bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3'
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-yellow-800 dark:text-yellow-200'>
                              Payment Method:{' '}
                              {formatPaymentMethod(tx.payment_method)}
                            </span>
                            <span className='text-xs text-yellow-600 dark:text-yellow-400 font-medium'>
                              ₹{formatCurrency(tx.amount || 0)}
                            </span>
                          </div>
                          {tx.reference_number && (
                            <span className='text-xs text-yellow-700 dark:text-yellow-300'>
                              Ref: {tx.reference_number}
                            </span>
                          )}
                        </div>

                        {/* Proof Upload Status */}
                        <div className='flex items-center gap-2 text-xs'>
                          <span className='text-yellow-700 dark:text-yellow-300'>
                            Proof:
                          </span>
                          {tx.receipt_url ||
                          tx.proof_of_payment_url ||
                          tx.transaction_screenshot_url ? (
                            <span className='text-green-600 dark:text-green-400 flex items-center gap-1'>
                              ✅ Uploaded
                            </span>
                          ) : (
                            <span className='text-red-600 dark:text-red-400 flex items-center gap-1'>
                              ❌ Not uploaded
                            </span>
                          )}
                        </div>

                        {/* Additional Payment Details */}
                        {tx.razorpay_order_id && (
                          <div className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                            Order ID: {tx.razorpay_order_id}
                          </div>
                        )}
                        {tx.utr_number && (
                          <div className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                            UTR: {tx.utr_number}
                          </div>
                        )}
                        {tx.bank_name && (
                          <div className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                            Bank: {tx.bank_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {installment.paymentDate && (
                  <p
                    className={`text-xs mt-1 ${
                      isFullyVerified
                        ? 'text-green-600 dark:text-green-400'
                        : isVerificationPending
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                    }`}
                  >
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
            scholarshipAmount={installment.scholarshipAmount}
            amountPayable={convertedInstallment.amountPayable}
          />
        </div>

        {/* Payment Transaction History - Only show if there are partial payments or multiple transactions */}
        {(() => {
          const transactions = getAllRelevantTransactions();
          const totalPaid = transactions
            .filter(
              t =>
                t.verification_status === 'approved' ||
                t.verification_status === 'partially_approved'
            )
            .reduce(
              (sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0),
              0
            );

          // Only show payment history if:
          // 1. There are multiple transactions, OR
          // 2. There's a partial payment (amount paid < expected amount), OR
          // 3. There are rejected transactions (to show rejection reasons), OR
          // 4. There are transactions with invoices (to show download options), OR
          // 5. There's a single complete payment with an invoice (to show download option)
          const hasMultipleTransactions = transactions.length > 1;
          const hasPartialPayment =
            totalPaid > 0 && totalPaid < convertedInstallment.amountPayable;
          const hasRejectedTransactions = transactions.some(
            t => t.verification_status === 'rejected'
          );

          // Debug logging for rejected transactions check
          console.log('🔍 [InstallmentCard] Rejected transactions check:', {
            transactionsCount: transactions.length,
            hasRejectedTransactions,
            rejectedTransactions: transactions
              .filter(t => t.verification_status === 'rejected')
              .map(t => ({
                id: t.id,
                amount: t.amount,
                status: t.verification_status,
                rejection_reason: t.rejection_reason,
              })),
            allTransactionStatuses: transactions.map(t => ({
              id: t.id,
              status: t.verification_status,
            })),
          });
          const hasTransactionsWithInvoices = transactions.some(
            t => t.lit_invoice_id
          );

          // For single transactions, check if it's a complete payment (regardless of status)
          const isSingleCompletePayment =
            transactions.length === 1 &&
            transactions[0].amount >= convertedInstallment.amountPayable;

          // Show history for single complete payments that have invoices
          const hasSingleCompletePaymentWithInvoice =
            isSingleCompletePayment && transactions[0].lit_invoice_id;

          // Show history if any transaction has an invoice (this is the key condition)
          const shouldShowHistory =
            hasMultipleTransactions ||
            hasPartialPayment ||
            hasRejectedTransactions ||
            hasTransactionsWithInvoices;

          // DEBUG LOGGING
          console.log(
            '🔍 [InstallmentCard] Payment History Visibility Check:',
            {
              installmentId: `${semesterNumber}-${installment.installmentNumber}`,
              transactionsCount: transactions.length,
              totalPaid,
              expectedAmount: convertedInstallment.amountPayable,
              hasMultipleTransactions,
              hasPartialPayment,
              hasRejectedTransactions,
              hasTransactionsWithInvoices,
              isSingleCompletePayment,
              hasSingleCompletePaymentWithInvoice,
              shouldShowHistory,
              transactions: transactions.map(t => ({
                id: t.id,
                amount: t.amount,
                status: t.verification_status,
                partial_sequence: t.partial_payment_sequence,
                lit_invoice_id: t.lit_invoice_id,
                rejection_reason: t.rejection_reason,
              })),
              // Add more detailed logging for the specific transaction we know has an invoice
              specificTransactionCheck: transactions.find(
                t => t.id === 'b66ca684-abf6-4bac-b293-277af106d3b4'
              ),
              allPaymentTransactions: paymentTransactions?.map(t => ({
                id: t.id,
                lit_invoice_id: t.lit_invoice_id,
                installment_id: t.installment_id,
                semester_number: t.semester_number,
              })),
            }
          );

          if (!shouldShowHistory) {
            console.log(
              '✅ [InstallmentCard] HIDING Payment History - No special conditions met'
            );
            return null;
          }

          console.log(
            '📋 [InstallmentCard] SHOWING Payment History - Complex payment scenario or invoice available'
          );
          return (
            <div className='mt-4'>
              <PartialPaymentHistory
                transactions={transactions}
                totalExpectedAmount={convertedInstallment.amountPayable}
                totalPaid={totalPaid}
                remainingAmount={convertedInstallment.amountPayable - totalPaid}
                totalPending={transactions
                  .filter(
                    t =>
                      t.verification_status === 'verification_pending' ||
                      t.verification_status === 'pending'
                  )
                  .reduce(
                    (sum, t) =>
                      sum + (Number.isFinite(t.amount) ? t.amount : 0),
                    0
                  )}
                studentId={studentData?.id}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
};
