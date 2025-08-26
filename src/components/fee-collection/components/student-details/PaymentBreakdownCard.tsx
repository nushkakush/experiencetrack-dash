import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { SharedPaymentBreakdown } from '@/components/common/payments/SharedPaymentBreakdown';

interface AdminPaymentBreakdown {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
  paymentDate?: string;
}

interface PaymentBreakdownCardProps {
  loading: boolean;
  adminPaymentBreakdown: AdminPaymentBreakdown | null;
  paymentItem: {
    type: string;
    semesterNumber?: number;
    installmentNumber?: number;
    dueDate?: string;
  } | null;
  pendingAmount: number;
}

export const PaymentBreakdownCard: React.FC<PaymentBreakdownCardProps> = ({
  loading,
  adminPaymentBreakdown,
  paymentItem,
  pendingAmount,
}) => {
  if (loading) {
    return (
      <div className='space-y-2'>
        <div className='h-4 bg-muted rounded animate-pulse'></div>
        <div className='h-4 bg-muted rounded animate-pulse w-3/4'></div>
        <div className='h-4 bg-muted rounded animate-pulse w-1/2'></div>
      </div>
    );
  }

  if (!adminPaymentBreakdown) {
    return null;
  }

  return (
    <div className='space-y-4'>
      {/* Use shared payment breakdown component */}
      <SharedPaymentBreakdown
        baseAmount={adminPaymentBreakdown.baseAmount}
        gstAmount={adminPaymentBreakdown.gstAmount}
        discountAmount={adminPaymentBreakdown.discountAmount}
        scholarshipAmount={adminPaymentBreakdown.scholarshipAmount}
        totalAmount={adminPaymentBreakdown.totalAmount}
        title='Fee Breakup'
        showTitle={true}
        variant='detailed'
      />

      {/* Show partial payments if any */}
      {pendingAmount > 0 &&
        pendingAmount < adminPaymentBreakdown.totalAmount && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Original Amount:</span>
              <span>₹{adminPaymentBreakdown.totalAmount.toLocaleString()}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Partial Payments:</span>
              <span className='text-green-600'>
                -₹
                {(
                  adminPaymentBreakdown.totalAmount - pendingAmount
                ).toLocaleString()}
              </span>
            </div>
            <Separator />
          </div>
        )}

      <div className='flex justify-between text-lg font-semibold'>
        <span>Amount to Pay:</span>
        <span>
          ₹
          {pendingAmount > 0
            ? pendingAmount.toLocaleString()
            : adminPaymentBreakdown.totalAmount.toLocaleString()}
        </span>
      </div>

      {/* Payment Date Information */}
      {(adminPaymentBreakdown.paymentDate || paymentItem?.dueDate) && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Calendar className='h-4 w-4' />
          <span>
            Due:{' '}
            {format(
              new Date(
                adminPaymentBreakdown.paymentDate || paymentItem?.dueDate || ''
              ),
              'MMM dd, yyyy'
            )}
          </span>
        </div>
      )}

      <div className='text-xs text-muted-foreground'>
        {paymentItem?.semesterNumber && paymentItem?.installmentNumber && (
          <>
            Semester {paymentItem.semesterNumber} • Installment{' '}
            {paymentItem.installmentNumber}
          </>
        )}
      </div>
    </div>
  );
};
