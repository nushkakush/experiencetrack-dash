import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download, FileText, Trash2 } from 'lucide-react';
import { PartialPaymentToggle } from '@/components/common/payments/PartialPaymentToggle';
import { PartialPaymentHistory } from '@/components/common/payments/PartialPaymentHistory';
import {
  formatCurrency,
  formatDate,
  getStatusBadge,
} from './utils/paymentScheduleUtils';
import { InvoiceUploadDialog } from './InvoiceUploadDialog';
import { useInvoiceManagement } from './hooks/useInvoiceManagement';
import { useAuth } from '@/hooks/useAuth';

interface PaymentScheduleItemProps {
  item: {
    id: string;
    type: string;
    amount: number;
    dueDate: string;
    status: string;
    paymentDate?: string;
    // FIXED: Remove verificationStatus field - payment engine status is the single source of truth
    semesterNumber?: number;
    installmentNumber?: number;
  };
  student: {
    student_id: string;
    student?: {
      cohort_id: string;
    };
  };
  recordingPayment: string | null;
  canRecordPayment: (status: string, verificationStatus?: string) => boolean;
  onRecordPayment: (item: any) => void;
  getRelevantTransactions: (item: any) => any[];
}

export const PaymentScheduleItem: React.FC<PaymentScheduleItemProps> = ({
  item,
  student,
  recordingPayment,
  canRecordPayment,
  onRecordPayment,
  getRelevantTransactions,
}) => {
  const { profile } = useAuth();
  const [showInvoiceUpload, setShowInvoiceUpload] = useState(false);

  // Get the first approved transaction for this payment item
  const transactions = getRelevantTransactions(item);
  const approvedTransaction = transactions.find(
    t =>
      t.verification_status === 'approved' ||
      t.verification_status === 'partially_approved'
  );

  // Use invoice management hook if there's an approved transaction
  const {
    invoice,
    loading: invoiceLoading,
    downloading,
    downloadInvoice,
    deleteInvoice,
    refreshInvoice,
  } = useInvoiceManagement({
    paymentTransactionId: approvedTransaction?.id || '',
    studentId: student.student_id,
  });

  // Check if user can manage invoices (fee collector or admin)
  const canManageInvoices =
    profile?.role === 'fee_collector' || profile?.role === 'super_admin';

  // Check if payment is paid and has an approved transaction
  const isPaid = item.status === 'paid' || item.status === 'waived';
  const hasApprovedTransaction = !!approvedTransaction;

  // Debug logging
  console.log('🔍 [PaymentScheduleItem] Invoice Debug:', {
    userRole: profile?.role,
    canManageInvoices,
    isPaid,
    hasApprovedTransaction,
    paymentStatus: item.status,
    hasInvoice: !!invoice,
    approvedTransactionId: approvedTransaction?.id,
    studentId: student.student_id,
    cohortId: student.student?.cohort_id,
    transactions: transactions.map(t => ({
      id: t.id,
      status: t.verification_status,
      amount: t.amount,
    })),
    allTransactions: transactions,
  });

  return (
    <div className='border border-border rounded-lg p-4 bg-card'>
      <div className='flex items-center justify-between mb-3'>
        <span className='font-medium text-sm text-foreground'>{item.type}</span>
        <div className='flex items-center gap-2'>
          {getStatusBadge(item.status)}
          {canRecordPayment(item.status) && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => onRecordPayment(item)}
              disabled={recordingPayment === item.id}
              className='h-6 px-2 text-xs'
            >
              <Plus className='h-3 w-3 mr-1' />
              {recordingPayment === item.id ? 'Recording...' : 'Record Payment'}
            </Button>
          )}
        </div>
      </div>

      {/* Partial Payment Toggle - Only show for program fee installments, not admission fee or waived payments */}
      {item.type !== 'Admission Fee' &&
        item.status !== 'waived' &&
        item.status !== 'partially_waived' && (
          <div className='mb-2 flex items-center justify-end'>
            <PartialPaymentToggle
              studentId={student.student_id}
              installmentKey={`${item.semesterNumber || 1}-${item.installmentNumber || 0}`}
              onToggle={enabled => {
                // No need to refresh payment schedule - partial payment toggle doesn't affect payment amounts or dates
                console.log(
                  '🔧 [PaymentSchedule] Partial payment toggle changed:',
                  {
                    installmentKey: `${item.semesterNumber || 1}-${item.installmentNumber || 0}`,
                    enabled,
                  }
                );
              }}
            />
          </div>
        )}

      <div className='space-y-2 text-xs text-muted-foreground'>
        <div className='flex justify-between'>
          <span>Amount Payable:</span>
          <span className='text-foreground'>{formatCurrency(item.amount)}</span>
        </div>
        <div className='flex justify-between'>
          <span>Due:</span>
          <span className='text-foreground'>{formatDate(item.dueDate)}</span>
        </div>
        {item.paymentDate && (
          <div className='flex justify-between'>
            <span>Paid:</span>
            <span className='text-foreground'>
              {formatDate(item.paymentDate)}
            </span>
          </div>
        )}
        {/* FIXED: Remove verificationStatus display - payment engine status is the single source of truth */}
      </div>

      {/* Invoice Management - Only show for paid payments with approved transactions */}
      {isPaid && hasApprovedTransaction && (
        <div className='mt-3 pt-3 border-t'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-muted-foreground'>
              Invoice
            </span>
            <div className='flex items-center gap-2'>
              {canManageInvoices && !invoice && student.student?.cohort_id && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setShowInvoiceUpload(true)}
                  className='h-6 px-2 text-xs'
                >
                  <Upload className='h-3 w-3 mr-1' />
                  Upload Invoice
                </Button>
              )}
              {invoice && (
                <>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={downloadInvoice}
                    disabled={downloading}
                    className='h-6 px-2 text-xs'
                  >
                    <Download className='h-3 w-3 mr-1' />
                    {downloading ? 'Downloading...' : 'Download Invoice'}
                  </Button>
                  {canManageInvoices && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setShowInvoiceUpload(true)}
                      className='h-6 px-2 text-xs'
                    >
                      <Upload className='h-3 w-3 mr-1' />
                      Replace Invoice
                    </Button>
                  )}
                  {canManageInvoices && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={deleteInvoice}
                      disabled={invoiceLoading}
                      className='h-6 px-2 text-xs text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-3 w-3 mr-1' />
                      {invoiceLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          {invoice && (
            <div className='mt-2 text-xs text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <FileText className='h-3 w-3' />
                <span>{invoice.invoice_file_name}</span>
                {canManageInvoices && (
                  <span className='text-xs text-muted-foreground ml-2'>
                    • Uploaded by admin
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Transaction History - Only show if there are partial payments or multiple transactions */}
      {(() => {
        const transactions = getRelevantTransactions(item);
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
        // 4. There are transactions with invoices (to show download options)
        const hasMultipleTransactions = transactions.length > 1;
        const hasPartialPayment = totalPaid > 0 && totalPaid < item.amount;
        const hasRejectedTransactions = transactions.some(
          t => t.verification_status === 'rejected'
        );
        const hasTransactionsWithInvoices = transactions.some(
          t => t.lit_invoice_id
        );

        // For single transactions, check if it's a complete payment (regardless of status)
        const isSingleCompletePayment =
          transactions.length === 1 && transactions[0].amount >= item.amount;

        const shouldShowHistory =
          hasMultipleTransactions ||
          hasPartialPayment ||
          hasRejectedTransactions ||
          hasTransactionsWithInvoices;

        // DEBUG LOGGING
        console.log('🔍 [PaymentSchedule] Payment History Visibility Check:', {
          installmentKey: `${item.semesterNumber || 1}-${item.installmentNumber || 0}`,
          transactionsCount: transactions.length,
          totalPaid,
          expectedAmount: item.amount,
          hasMultipleTransactions,
          hasPartialPayment,
          hasRejectedTransactions,
          hasTransactionsWithInvoices,
          isSingleCompletePayment,
          shouldShowHistory,
          transactions: transactions.map(t => ({
            id: t.id,
            amount: t.amount,
            status: t.verification_status,
            partial_sequence: t.partial_payment_sequence,
            lit_invoice_id: t.lit_invoice_id,
          })),
        });

        if (!shouldShowHistory) {
          console.log(
            '✅ [PaymentSchedule] HIDING Payment History - Single complete payment'
          );
          return null;
        }

        console.log(
          '📋 [PaymentSchedule] SHOWING Payment History - Complex payment scenario'
        );
        return (
          <div className='mt-3 pt-3 border-t'>
            <PartialPaymentHistory
              transactions={transactions}
              totalExpectedAmount={item.amount}
              totalPaid={totalPaid}
              remainingAmount={item.amount - totalPaid}
              totalPending={transactions
                .filter(
                  t =>
                    t.verification_status === 'verification_pending' ||
                    t.verification_status === 'pending'
                )
                .reduce(
                  (sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0),
                  0
                )}
              studentId={student.student_id}
            />
          </div>
        );
      })()}

      {/* Invoice Upload Dialog */}
      {hasApprovedTransaction && student.student?.cohort_id && (
        <InvoiceUploadDialog
          open={showInvoiceUpload}
          onOpenChange={setShowInvoiceUpload}
          paymentTransactionId={approvedTransaction.id}
          studentId={student.student_id}
          cohortId={student.student.cohort_id}
          onInvoiceUploaded={refreshInvoice}
        />
      )}
    </div>
  );
};
