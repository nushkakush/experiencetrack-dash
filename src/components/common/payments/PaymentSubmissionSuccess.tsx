import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Mail, Download } from 'lucide-react';
import { formatPaymentMethodSimple } from '@/utils/paymentMethodFormatter';

interface PaymentSubmissionSuccessProps {
  paymentAmount: number;
  paymentMethod: string;
  referenceNumber: string;
  receiptUrl?: string;
}

export const PaymentSubmissionSuccess: React.FC<
  PaymentSubmissionSuccessProps
> = ({ paymentAmount, paymentMethod, referenceNumber, receiptUrl }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className='border-green-200 bg-green-50 dark:bg-green-950/20'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-green-700 dark:text-green-300'>
          <CheckCircle className='h-5 w-5' />
          Payment Submitted Successfully!
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Payment Details */}
        <div className='space-y-2'>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Amount:</span>
            <span className='font-semibold'>
              {formatCurrency(paymentAmount)}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>
              Payment Method:
            </span>
            <span className='capitalize'>
              {formatPaymentMethodSimple(paymentMethod)}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>
              Reference Number:
            </span>
            <span className='font-mono text-sm'>{referenceNumber}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className='flex items-center gap-2'>
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-800 border-yellow-300'
          >
            <Clock className='h-3 w-3 mr-1' />
            Pending Verification
          </Badge>
        </div>

        {/* What Happens Next */}
        <div className='space-y-3'>
          <h4 className='font-medium text-sm'>What happens next?</h4>
          <div className='space-y-2 text-sm text-muted-foreground'>
            <div className='flex items-start gap-2'>
              <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0'></div>
              <span>
                Your payment has been submitted and is awaiting admin
                verification
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0'></div>
              <span>
                You will receive an email confirmation once verified (usually
                within 24 hours)
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <div className='w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0'></div>
              <span>
                The payment status will update automatically once verified
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-2 pt-2'>
          {receiptUrl && (
            <button
              onClick={() => window.open(receiptUrl, '_blank')}
              className='flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
            >
              <Download className='h-3 w-3' />
              Download Receipt
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className='flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            <Mail className='h-3 w-3' />
            Refresh Dashboard
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
