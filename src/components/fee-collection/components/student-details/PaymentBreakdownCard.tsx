import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from './utils/adminPaymentUtils';

interface AdminPaymentBreakdown {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
}

interface PaymentBreakdownCardProps {
  loading: boolean;
  adminPaymentBreakdown: AdminPaymentBreakdown | null;
  paymentItem: {
    type: string;
    semesterNumber?: number;
    installmentNumber?: number;
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
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='h-4 bg-muted rounded animate-pulse'></div>
            <div className='h-4 bg-muted rounded animate-pulse w-3/4'></div>
            <div className='h-4 bg-muted rounded animate-pulse w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!adminPaymentBreakdown) {
    return null;
  }

  return (
    <Card className='border-border'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg flex items-center gap-2'>
          <DollarSign className='h-5 w-5' />
          {paymentItem?.type} - Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Base Fee:</span>
              <span>
                ₹{adminPaymentBreakdown.baseAmount.toLocaleString()}
              </span>
            </div>

            <div className='flex justify-between'>
              <span className='text-muted-foreground'>GST:</span>
              <span>
                ₹{adminPaymentBreakdown.gstAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            {adminPaymentBreakdown.discountAmount > 0 && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Discount:</span>
                <span className='text-green-600'>
                  -₹{adminPaymentBreakdown.discountAmount.toLocaleString()}
                </span>
              </div>
            )}

            {adminPaymentBreakdown.scholarshipAmount > 0 && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Scholarship:</span>
                <span className='text-green-600'>
                  -₹{adminPaymentBreakdown.scholarshipAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Show partial payments if any */}
        {pendingAmount > 0 && pendingAmount < adminPaymentBreakdown.totalAmount && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Original Amount:</span>
              <span>₹{adminPaymentBreakdown.totalAmount.toLocaleString()}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Partial Payments:</span>
              <span className='text-green-600'>
                -₹{(adminPaymentBreakdown.totalAmount - pendingAmount).toLocaleString()}
              </span>
            </div>
            <Separator />
          </div>
        )}

        <div className='flex justify-between text-lg font-semibold'>
          <span>Amount to Pay:</span>
          <span>
            ₹{pendingAmount > 0 ? pendingAmount.toLocaleString() : adminPaymentBreakdown.totalAmount.toLocaleString()}
          </span>
        </div>

        <div className='text-xs text-muted-foreground'>
          {paymentItem?.semesterNumber && paymentItem?.installmentNumber && (
            <>
              Semester {paymentItem.semesterNumber} • Installment{' '}
              {paymentItem.installmentNumber}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
