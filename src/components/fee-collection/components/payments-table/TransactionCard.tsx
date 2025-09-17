import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPaymentMethodUppercase } from '@/utils/paymentMethodFormatter';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  CreditCard,
  Download,
} from 'lucide-react';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';
import {
  getPartialPaymentContext,
  PartialPaymentContext,
} from './utils/partialPaymentUtils';
import { useInvoiceManagement } from '@/components/fee-collection/components/student-details/hooks/useInvoiceManagement';

interface TransactionCardProps {
  transaction: PaymentTransactionRow;
  transactions: PaymentTransactionRow[];
  expectedAmount: number;
  verifyingId: string | null;
  rejectingId: string | null;
  onVerify: (transactionId: string, decision: 'approved' | 'rejected') => void;
  onRejectClick: (transaction: PaymentTransactionRow) => void;
  onResetClick: (transaction: PaymentTransactionRow) => void;
  onPartialApprovalClick: (transaction: PaymentTransactionRow) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  transactions,
  expectedAmount,
  verifyingId,
  rejectingId,
  onVerify,
  onRejectClick,
  onResetClick,
  onPartialApprovalClick,
}) => {
  const partialContext = getPartialPaymentContext(
    transaction,
    transactions,
    expectedAmount
  );

  // Invoice management hook
  const { invoice, downloading, downloadInvoice } = useInvoiceManagement({
    paymentTransactionId: transaction.id,
  });

  return (
    <div className='border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors'>
      {/* Card Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Badge variant='secondary' className='font-medium text-xs'>
            {formatPaymentMethodUppercase(transaction.payment_method)}
          </Badge>
          <Badge variant='outline' className='font-semibold text-sm'>
            ₹{Number(transaction.amount).toLocaleString('en-IN')}
          </Badge>
          <Badge
            variant={
              transaction.verification_status === 'approved'
                ? 'default'
                : transaction.verification_status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
            }
            className='font-medium'
          >
            {transaction.verification_status === 'verification_pending'
              ? 'Verification Pending'
              : transaction.verification_status === 'approved'
                ? '✅ Approved'
                : transaction.verification_status || 'Pending'}
          </Badge>

          {/* Partial Payment Indicator */}
          {partialContext.isPartialPayment && (
            <Badge
              variant='outline'
              className='font-medium text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50'
            >
              <CreditCard className='h-3 w-3 mr-1' />
              {partialContext.isPartialPayment
                ? partialContext.hasPartialSequence
                  ? `Partial Payment ${partialContext.partialSequence}`
                  : 'Related to Partial Payment'
                : 'Payment'}
            </Badge>
          )}
        </div>
      </div>

      {/* Partial Payment Context */}
      {partialContext.isPartialPayment && (
        <div className='mb-4 p-3 bg-orange-50/50 border border-orange-200/50 rounded-lg dark:bg-orange-950/20 dark:border-orange-800/50'>
          <div className='flex items-center gap-2 mb-2'>
            <CreditCard className='h-4 w-4 text-orange-600 dark:text-orange-400' />
            <p className='text-sm font-medium text-orange-800 dark:text-orange-200'>
              Partial Payment Context
            </p>
          </div>
          <div className='space-y-1 text-xs text-orange-700 dark:text-orange-300'>
            {partialContext.approvedPartialsCount > 0 && (
              <p>
                • {partialContext.approvedPartialsCount} partial payment(s)
                already approved (Total: ₹
                {partialContext.totalApprovedAmount.toLocaleString('en-IN')})
              </p>
            )}
            {partialContext.hasPartialSequence && (
              <p>
                • This is partial payment #{partialContext.partialSequence} for
                this installment
              </p>
            )}
            <p>
              • {partialContext.relatedTransactionCount} total transaction(s)
              for this installment
            </p>
          </div>
        </div>
      )}

      {/* Card Content - Flexible Layout */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>
        {/* Reference Info */}
        {transaction.reference_number && (
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              Reference
            </p>
            <p className='text-sm font-mono text-foreground'>
              {transaction.reference_number}
            </p>
          </div>
        )}

        {/* Bank Info */}
        {(transaction.bank_name ||
          transaction.bank_branch ||
          transaction.payer_upi_id) && (
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              Bank Info
            </p>
            <div className='text-sm space-y-1'>
              {transaction.bank_name && (
                <div className='font-medium text-foreground'>
                  {transaction.bank_name}
                </div>
              )}
              {transaction.bank_branch && (
                <div className='text-xs text-muted-foreground'>
                  {transaction.bank_branch}
                </div>
              )}
              {transaction.payer_upi_id && (
                <div className='text-xs text-muted-foreground font-mono'>
                  UPI: {transaction.payer_upi_id}
                </div>
              )}
            </div>
          </div>
        )}

        {/* UTR/Transaction ID */}
        {transaction.utr_number && (
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              UTR/Transaction ID
            </p>
            <p className='text-sm font-mono text-foreground'>
              {transaction.utr_number}
            </p>
          </div>
        )}

        {/* Payment Date */}
        {transaction.payment_date && (
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              Payment Date
            </p>
            <p className='text-sm text-foreground'>
              {transaction.payment_date}
            </p>
          </div>
        )}

        {/* Submitted Date */}
        <div className='space-y-1'>
          <p className='text-xs text-muted-foreground font-medium'>Submitted</p>
          <p className='text-sm text-foreground'>
            {new Date(transaction.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Razorpay ID */}
        {transaction.razorpay_order_id && (
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              Razorpay Order ID
            </p>
            <p className='text-sm font-mono text-foreground'>
              {transaction.razorpay_order_id}
            </p>
          </div>
        )}

        {/* Payment ID */}
        {transaction.razorpay_payment_id && (
          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              Payment ID
            </p>
            <p className='text-sm font-mono text-foreground'>
              {transaction.razorpay_payment_id}
            </p>
          </div>
        )}

        {/* Notes */}
        {transaction.notes && (
          <div className='space-y-1 md:col-span-2 lg:col-span-3'>
            <p className='text-xs text-muted-foreground font-medium'>Notes</p>
            <p className='text-sm text-foreground'>{transaction.notes}</p>
          </div>
        )}

        {/* Rejection Reason */}
        {transaction.rejection_reason && (
          <div className='space-y-1 md:col-span-2 lg:col-span-3'>
            <p className='text-xs text-red-600 font-medium'>Rejection Reason</p>
            <p className='text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800'>
              {transaction.rejection_reason}
            </p>
          </div>
        )}
      </div>

      {/* Proof Documents */}
      {(transaction.transaction_screenshot_url ||
        transaction.proof_of_payment_url ||
        transaction.receipt_url) && (
        <div className='mb-4'>
          <p className='text-xs text-muted-foreground font-medium mb-2'>
            Proof Documents
          </p>
          <div className='flex items-center gap-2 flex-wrap'>
            {transaction.transaction_screenshot_url && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open(transaction.transaction_screenshot_url, '_blank')
                }
                className='h-8 px-2 text-xs'
              >
                <ExternalLink className='h-3 w-3 mr-1' />
                Screenshot
              </Button>
            )}
            {transaction.proof_of_payment_url && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open(transaction.proof_of_payment_url, '_blank')
                }
                className='h-8 px-2 text-xs'
              >
                <ExternalLink className='h-3 w-3 mr-1' />
                Proof
              </Button>
            )}
            {transaction.receipt_url && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open(transaction.receipt_url, '_blank')}
                className='h-8 px-2 text-xs'
              >
                <FileText className='h-3 w-3 mr-1' />
                Receipt
              </Button>
            )}
            {invoice && (
              <Button
                variant='outline'
                size='sm'
                onClick={downloadInvoice}
                disabled={downloading}
                className='h-8 px-2 text-xs'
              >
                <Download className='h-3 w-3 mr-1' />
                {downloading ? 'Downloading...' : 'Invoice'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <Separator className='mb-4' />
      <div className='flex items-center justify-end gap-2 flex-wrap'>
        {transaction.verification_status === 'approved' ||
        transaction.verification_status === 'rejected' ? (
          <Button
            size='sm'
            variant='outline'
            onClick={() => onResetClick(transaction)}
            className='min-w-[80px] h-8 text-xs'
          >
            <XCircle className='h-3 w-3 mr-1' />
            Reset
          </Button>
        ) : (
          <>
            <Button
              size='sm'
              variant='default'
              disabled={verifyingId === transaction.id}
              onClick={() => onVerify(transaction.id, 'approved')}
              className='min-w-[80px] h-8 text-xs'
            >
              {verifyingId === transaction.id ? (
                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>
              ) : (
                <>
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  Approve
                </>
              )}
            </Button>

            <Button
              size='sm'
              variant='outline'
              disabled={verifyingId === transaction.id}
              onClick={() => onPartialApprovalClick(transaction)}
              className='min-w-[110px] h-8 text-xs'
            >
              {verifyingId === transaction.id ? (
                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-primary'></div>
              ) : (
                <>
                  <Clock className='h-3 w-3 mr-1' />
                  Partial Approve
                </>
              )}
            </Button>

            <Button
              size='sm'
              variant='destructive'
              disabled={
                verifyingId === transaction.id || rejectingId === transaction.id
              }
              onClick={() => onRejectClick(transaction)}
              className='min-w-[80px] h-8 text-xs'
            >
              {rejectingId === transaction.id ? (
                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>
              ) : (
                <>
                  <XCircle className='h-3 w-3 mr-1' />
                  Reject
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
