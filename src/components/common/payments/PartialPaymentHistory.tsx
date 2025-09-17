import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatPaymentMethodSimple } from '@/utils/paymentMethodFormatter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Download,
  FileText,
  Image,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useInvoiceManagement } from '@/components/fee-collection/components/student-details/hooks/useInvoiceManagement';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface PaymentTransaction {
  id: string;
  amount: number;
  verification_status:
    | 'pending'
    | 'verification_pending'
    | 'approved'
    | 'rejected'
    | 'partially_approved';
  created_at: string;
  verified_at?: string;
  notes?: string;
  rejection_reason?: string;
  partial_payment_sequence: number;
  payment_method?: string;
  lit_invoice_id?: string | null;

  // Verification fields and uploaded files
  receipt_url?: string | null;
  proof_of_payment_url?: string | null;
  transaction_screenshot_url?: string | null;

  // Bank and payment details
  bank_name?: string | null;
  bank_branch?: string | null;
  utr_number?: string | null;
  account_number?: string | null;
  cheque_number?: string | null;
  payer_upi_id?: string | null;
  qr_code_url?: string | null;
  receiver_bank_name?: string | null;
  receiver_bank_logo_url?: string | null;

  // DD-specific fields
  dd_number?: string | null;
  dd_bank_name?: string | null;
  dd_branch?: string | null;

  // Payment dates
  payment_date?: string | null;
  transfer_date?: string | null;

  // Verification tracking
  verified_by?: string | null;
  verified_at?: string | null;

  // Reference number
  reference_number?: string | null;
}

interface PartialPaymentHistoryProps {
  transactions: PaymentTransaction[];
  totalExpectedAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalPending: number;
  studentId?: string;
}

// Helper functions (moved outside to be accessible by TransactionItem)
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className='h-3 w-3 text-green-600' />;
    case 'rejected':
      return <XCircle className='h-3 w-3 text-red-600' />;
    case 'verification_pending':
      return <Clock className='h-3 w-3 text-yellow-600' />;
    case 'pending':
      return <HelpCircle className='h-3 w-3 text-gray-600' />;
    case 'partially_approved':
      return <AlertCircle className='h-3 w-3 text-orange-600' />;
    default:
      return <HelpCircle className='h-3 w-3 text-gray-600' />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50';
    case 'rejected':
      return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50';
    case 'verification_pending':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/50';
    case 'pending':
      return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/30 dark:border-gray-800/50';
    case 'partially_approved':
      return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800/50';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/30 dark:border-gray-800/50';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'verification_pending':
      return 'Under Review';
    case 'pending':
      return 'Pending';
    case 'partially_approved':
      return 'Partially Approved';
    default:
      return 'Unknown';
  }
};

// Helper function to determine if a payment is actually partial
const isPaymentPartial = (
  transaction: PaymentTransaction,
  allTransactions: PaymentTransaction[],
  totalExpected: number
) => {
  // Safety check for allTransactions
  if (!allTransactions || !Array.isArray(allTransactions)) {
    console.warn(
      'isPaymentPartial: allTransactions is not a valid array:',
      allTransactions
    );
    return false;
  }

  // Ensure totalExpected is a valid number
  const safeTotalExpected = Number.isFinite(totalExpected) ? totalExpected : 0;

  // If this is the only transaction and it covers the full amount, it's not partial
  if (allTransactions.length === 1 && transaction.amount >= safeTotalExpected) {
    return false;
  }

  // If there are multiple transactions, check if this specific transaction covers the full amount
  if (transaction.amount >= safeTotalExpected) {
    return false;
  }

  // If the total paid across all transactions equals or exceeds the expected amount,
  // and this transaction is the last one, it might be completing the payment
  const totalPaidSoFar = allTransactions
    .filter(
      t =>
        t.verification_status === 'approved' ||
        t.verification_status === 'partially_approved'
    )
    .reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0);

  if (
    totalPaidSoFar >= safeTotalExpected &&
    transaction.verification_status === 'approved'
  ) {
    return false;
  }

  // Otherwise, it's a partial payment
  return true;
};

// Get the appropriate label for each transaction
const getPaymentLabel = (
  transaction: PaymentTransaction,
  allTransactions: PaymentTransaction[],
  totalExpected: number
) => {
  // Safety check for allTransactions
  if (!allTransactions || !Array.isArray(allTransactions)) {
    console.warn(
      'getPaymentLabel: allTransactions is not a valid array:',
      allTransactions
    );
    return transaction.payment_method ? formatPaymentMethodSimple(transaction.payment_method) : 'Payment';
  }

  const isPartial = isPaymentPartial(
    transaction,
    allTransactions,
    totalExpected
  );

  // Get the payment method (with masking for students)
  const paymentMethod = transaction.payment_method ? formatPaymentMethodSimple(transaction.payment_method) : 'Payment';

  if (isPartial) {
    return `Partial ${paymentMethod} ${transaction.partial_payment_sequence || 'N/A'}`;
  } else {
    return paymentMethod;
  }
};

// Image Viewer Component
const ImageViewer: React.FC<{
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ src, alt, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <div className='flex justify-center'>
          <img
            src={src}
            alt={alt}
            className='max-w-full max-h-[70vh] object-contain rounded-lg'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Verification Photos Component
const VerificationPhotos: React.FC<{
  transaction: PaymentTransaction;
}> = ({ transaction }) => {
  const [viewingImage, setViewingImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const photos = [
    {
      url: transaction.receipt_url,
      label: 'Receipt',
      icon: <FileText className='h-4 w-4' />,
    },
    {
      url: transaction.proof_of_payment_url,
      label: 'Proof of Payment',
      icon: <Image className='h-4 w-4' />,
    },
    {
      url: transaction.transaction_screenshot_url,
      label: 'Transaction Screenshot',
      icon: <Image className='h-4 w-4' />,
    },
  ].filter(photo => photo.url);

  if (photos.length === 0) return null;

  return (
    <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
      <div className='flex items-center gap-2 mb-2'>
        <Image className='h-4 w-4 text-blue-600' />
        <span className='text-sm font-medium text-blue-600'>
          Verification Photos
        </span>
      </div>
      <div className='flex flex-wrap gap-2'>
        {photos.map((photo, index) => (
          <Button
            key={index}
            size='sm'
            variant='outline'
            onClick={() =>
              setViewingImage({ src: photo.url!, alt: photo.label })
            }
            className='h-8 px-3 text-xs'
          >
            {photo.icon}
            <span className='ml-1'>{photo.label}</span>
            <Eye className='h-3 w-3 ml-1' />
          </Button>
        ))}
      </div>

      {viewingImage && (
        <ImageViewer
          src={viewingImage.src}
          alt={viewingImage.alt}
          open={!!viewingImage}
          onOpenChange={open => !open && setViewingImage(null)}
        />
      )}
    </div>
  );
};

// Transaction Item Component with Invoice Download
const TransactionItem: React.FC<{
  transaction: PaymentTransaction;
  studentId: string;
  allTransactions: PaymentTransaction[];
  totalExpected: number;
}> = ({ transaction, studentId, allTransactions, totalExpected }) => {
  const { invoice, downloading, downloadInvoice } = useInvoiceManagement({
    paymentTransactionId: transaction.id,
    studentId: studentId,
  });

  const isApproved =
    transaction.verification_status === 'approved' ||
    transaction.verification_status === 'partially_approved';
  const hasInvoice = !!invoice;

  // Debug logging for invoice management
  console.log(
    '🔍 [PartialPaymentHistory] Invoice management for transaction:',
    {
      transactionId: transaction.id,
      studentId,
      lit_invoice_id: transaction.lit_invoice_id,
      invoice,
      hasInvoice,
      isApproved,
      verification_status: transaction.verification_status,
    }
  );

  return (
    <div className='p-3 border rounded-lg bg-white/50 dark:bg-gray-900/50'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          {getStatusIcon(transaction.verification_status)}
          <span className='font-medium'>
            {getPaymentLabel(transaction, allTransactions, totalExpected)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant='outline'
            className={getStatusColor(transaction.verification_status)}
          >
            {getStatusLabel(transaction.verification_status)}
          </Badge>
          {hasInvoice && (
            <Button
              size='sm'
              variant='outline'
              onClick={downloadInvoice}
              disabled={downloading}
              className='h-6 px-2 text-xs'
            >
              <Download className='h-3 w-3 mr-1' />
              {downloading ? 'Downloading...' : 'Invoice'}
            </Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 gap-2 text-sm'>
        <div>
          <span className='text-muted-foreground'>Amount:</span>
          <span className='ml-1 font-semibold'>
            {formatCurrency(transaction.amount)}
          </span>
        </div>
        <div>
          <span className='text-muted-foreground'>Date:</span>
          <span className='ml-1'>{formatDate(transaction.created_at)}</span>
        </div>
        {transaction.reference_number && (
          <div>
            <span className='text-muted-foreground'>Reference:</span>
            <span className='ml-1 font-mono text-xs'>
              {transaction.reference_number}
            </span>
          </div>
        )}
        {transaction.utr_number && (
          <div>
            <span className='text-muted-foreground'>UTR:</span>
            <span className='ml-1 font-mono text-xs'>
              {transaction.utr_number}
            </span>
          </div>
        )}
        {transaction.bank_name && (
          <div>
            <span className='text-muted-foreground'>Bank:</span>
            <span className='ml-1'>{transaction.bank_name}</span>
          </div>
        )}
        {transaction.payer_upi_id && (
          <div>
            <span className='text-muted-foreground'>UPI ID:</span>
            <span className='ml-1 font-mono text-xs'>
              {transaction.payer_upi_id}
            </span>
          </div>
        )}
        {transaction.cheque_number && (
          <div>
            <span className='text-muted-foreground'>Cheque #:</span>
            <span className='ml-1 font-mono text-xs'>
              {transaction.cheque_number}
            </span>
          </div>
        )}
        {transaction.dd_number && (
          <div>
            <span className='text-muted-foreground'>DD #:</span>
            <span className='ml-1 font-mono text-xs'>
              {transaction.dd_number}
            </span>
          </div>
        )}
        {transaction.payment_date && (
          <div>
            <span className='text-muted-foreground'>Payment Date:</span>
            <span className='ml-1'>{formatDate(transaction.payment_date)}</span>
          </div>
        )}
        {transaction.transfer_date && (
          <div>
            <span className='text-muted-foreground'>Transfer Date:</span>
            <span className='ml-1'>
              {formatDate(transaction.transfer_date)}
            </span>
          </div>
        )}
        {transaction.verified_at && (
          <div>
            <span className='text-muted-foreground'>Verified:</span>
            <span className='ml-1'>{formatDate(transaction.verified_at)}</span>
          </div>
        )}
      </div>

      {transaction.notes && (
        <div className='mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs'>
          <span className='text-muted-foreground'>Notes:</span>
          <span className='ml-1'>{transaction.notes}</span>
        </div>
      )}

      {transaction.verification_notes && (
        <div className='mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs'>
          <span className='text-green-600 font-medium'>
            Verification Notes:
          </span>
          <span className='ml-1 text-green-600'>
            {transaction.verification_notes}
          </span>
        </div>
      )}

      {transaction.rejection_reason && (
        <div className='mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs'>
          <span className='text-red-600 font-medium'>Rejection Reason:</span>
          <span className='ml-1 text-red-600'>
            {transaction.rejection_reason}
          </span>
        </div>
      )}

      {/* Verification Photos */}
      <VerificationPhotos transaction={transaction} />

      {hasInvoice && (
        <div className='mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs'>
          <div className='flex items-center gap-1'>
            <FileText className='h-3 w-3 text-blue-600' />
            <span className='text-blue-600 font-medium'>
              Admin Invoice Available:
            </span>
            <span className='ml-1 text-blue-600'>
              {invoice.invoice_file_name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const PartialPaymentHistory: React.FC<PartialPaymentHistoryProps> = ({
  transactions,
  totalExpectedAmount,
  totalPaid,
  remainingAmount,
  totalPending,
  studentId,
}) => {
  // Debug logging for invoice functionality
  console.log('🔍 [PartialPaymentHistory] Component props:', {
    transactionsCount: transactions.length,
    studentId,
    transactions: transactions.map(t => ({
      id: t.id,
      status: t.verification_status,
      lit_invoice_id: t.lit_invoice_id,
      amount: t.amount,
    })),
  });
  // DEBUG LOGGING
  console.log('🔍 [PartialPaymentHistory] Component Data:', {
    transactionsCount: transactions.length,
    totalExpectedAmount,
    totalPaid,
    remainingAmount,
    totalPending,
    transactions: transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      status: t.verification_status,
      payment_method: t.payment_method,
      partial_sequence: t.partial_payment_sequence,
    })),
  });

  // Defensive programming: ensure all values are valid numbers
  const safeTotalExpectedAmount = Number.isFinite(totalExpectedAmount)
    ? totalExpectedAmount
    : 0;
  const safeTotalPaid = Number.isFinite(totalPaid) ? totalPaid : 0;
  const safeRemainingAmount = Number.isFinite(remainingAmount)
    ? remainingAmount
    : 0;
  const safeTotalPending = Number.isFinite(totalPending) ? totalPending : 0;

  // Sort transactions by partial_payment_sequence and created_at
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a.partial_payment_sequence !== b.partial_payment_sequence) {
      return (
        (a.partial_payment_sequence || 0) - (b.partial_payment_sequence || 0)
      );
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Add invoice management for single transaction (moved before any early returns)
  const singleTransaction =
    sortedTransactions.length === 1 ? sortedTransactions[0] : null;
  const paymentTransactionId = singleTransaction?.id || '';
  const { invoice, downloading, downloadInvoice } = useInvoiceManagement({
    paymentTransactionId,
    studentId: studentId,
  });

  if (sortedTransactions.length === 0) {
    return (
      <Card className='border-gray-200 bg-gray-50/30 dark:border-gray-800/50 dark:bg-gray-950/20'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <CreditCard className='h-5 w-5 text-gray-600' />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            No payment transactions found.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Simplified view for single transaction
  if (sortedTransactions.length === 1) {
    const transaction = sortedTransactions[0];
    const isPartial = isPaymentPartial(
      transaction,
      sortedTransactions,
      safeTotalExpectedAmount
    );
    const safeTransactionAmount = Number.isFinite(transaction.amount)
      ? transaction.amount
      : 0;

    const hasInvoice = !!invoice;

    // Debug logging for single transaction invoice
    console.log(
      '🔍 [PartialPaymentHistory] Single transaction invoice check:',
      {
        transactionId: transaction.id,
        studentId,
        lit_invoice_id: transaction.lit_invoice_id,
        invoice,
        hasInvoice,
        verification_status: transaction.verification_status,
        rejection_reason: transaction.rejection_reason,
        hasRejectionReason: !!transaction.rejection_reason,
      }
    );

    return (
      <Card className='border-orange-200 bg-orange-50/30 dark:border-orange-800/50 dark:bg-orange-950/20'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <CreditCard className='h-5 w-5 text-orange-600' />
            Payment History
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-3'>
          {/* Single transaction display */}
          <div className='flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg'>
            <div className='flex items-center gap-3'>
              {getStatusIcon(transaction.verification_status)}
              <div>
                <div className='font-medium'>
                  {getPaymentLabel(
                    transaction,
                    [transaction],
                    safeTotalExpectedAmount
                  )}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {formatDate(transaction.created_at)}
                </div>
              </div>
            </div>
            <div className='text-right'>
              <div className='font-semibold'>
                {formatCurrency(safeTransactionAmount)}
              </div>
              <div className='flex items-center gap-2 mt-1'>
                <Badge
                  variant='outline'
                  className={`text-xs ${getStatusColor(transaction.verification_status)}`}
                >
                  {getStatusLabel(transaction.verification_status)}
                </Badge>
                {hasInvoice && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={downloadInvoice}
                    disabled={downloading}
                    className='h-6 px-2 text-xs'
                  >
                    <Download className='h-3 w-3 mr-1' />
                    {downloading ? 'Downloading...' : 'Invoice'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Verification Notes */}
          {transaction.verification_notes && (
            <div className='mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs'>
              <span className='text-green-600 font-medium'>
                Verification Notes:
              </span>
              <span className='ml-1 text-green-600'>
                {transaction.verification_notes}
              </span>
            </div>
          )}

          {/* Rejection Reason - Show for rejected transactions */}
          {transaction.rejection_reason && (
            <div className='mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs'>
              <span className='text-red-600 font-medium'>
                Rejection Reason:
              </span>
              <span className='ml-1 text-red-600'>
                {transaction.rejection_reason}
              </span>
            </div>
          )}

          {/* Verification Photos */}
          <VerificationPhotos transaction={transaction} />

          {/* Summary - only show if there's a meaningful difference */}
          {(safeTotalPaid > 0 || safeRemainingAmount > 0) && (
            <div className='grid grid-cols-2 gap-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg'>
              <div>
                <p className='text-xs text-muted-foreground'>Total Paid</p>
                <p className='font-semibold text-green-600'>
                  {formatCurrency(safeTotalPaid)}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Remaining</p>
                <p className='font-semibold text-orange-600'>
                  {formatCurrency(safeRemainingAmount)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Multiple transactions view
  return (
    <Card className='border-orange-200 bg-orange-50/30 dark:border-orange-800/50 dark:bg-orange-950/20'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <CreditCard className='h-5 w-5 text-orange-600' />
          Payment Transaction History
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Summary - only show meaningful totals */}
        {(safeTotalPaid > 0 ||
          safeRemainingAmount > 0 ||
          safeTotalPending > 0) && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg'>
            {safeTotalPaid > 0 && (
              <div>
                <p className='text-xs text-muted-foreground'>Total Paid</p>
                <p className='font-semibold text-green-600'>
                  {formatCurrency(safeTotalPaid)}
                </p>
              </div>
            )}
            {safeTotalPending > 0 && (
              <div>
                <p className='text-xs text-muted-foreground'>Pending Review</p>
                <p className='font-semibold text-yellow-600'>
                  {formatCurrency(safeTotalPending)}
                </p>
              </div>
            )}
            {safeRemainingAmount > 0 && (
              <div>
                <p className='text-xs text-muted-foreground'>Remaining</p>
                <p className='font-semibold text-orange-600'>
                  {formatCurrency(safeRemainingAmount)}
                </p>
              </div>
            )}
            <div>
              <p className='text-xs text-muted-foreground'>Expected Total</p>
              <p className='font-semibold'>
                {formatCurrency(safeTotalExpectedAmount)}
              </p>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className='space-y-3'>
          <h4 className='text-sm font-medium'>Transaction Details</h4>

          {sortedTransactions.map(transaction => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              studentId={studentId || ''}
              allTransactions={sortedTransactions}
              totalExpected={safeTotalExpectedAmount}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
