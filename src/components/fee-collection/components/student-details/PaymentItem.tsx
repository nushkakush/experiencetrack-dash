import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { Eye, Download, FileText } from 'lucide-react';
import { useInvoiceManagement } from './hooks/useInvoiceManagement';
import { toast } from 'sonner';

interface PaymentData {
  payment_type: 'admission_fee' | 'program_fee' | 'scholarship';
  payment_plan?: string;
  installment_number?: number;
  semester_number?: number;
  status: string;
  amount_payable: number;
  scholarship_amount: number;
  due_date: string;
  payment_date?: string;
}

interface PaymentItemProps {
  payment: PaymentData;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  paymentTransactionId?: string;
  studentId?: string;
}

export const PaymentItem: React.FC<PaymentItemProps> = ({
  payment,
  formatCurrency,
  formatDate,
  paymentTransactionId,
  studentId,
}) => {
  // Use invoice management hook if payment transaction ID is provided
  const {
    invoice,
    loading: invoiceLoading,
    downloading,
    downloadInvoice,
  } = useInvoiceManagement({
    paymentTransactionId: paymentTransactionId || '',
    studentId: studentId || '',
  });

  const isPaid = payment.status === 'paid' || payment.status === 'waived';
  const hasInvoice = !!invoice;
  const getPaymentTypeDisplay = () => {
    switch (payment.payment_type) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'program_fee':
        // Use payment_plan to determine the display text
        if (payment.payment_plan === 'one_shot') {
          return 'Program Fee (One-Shot)';
        } else if (payment.payment_plan === 'sem_wise') {
          return `Program Fee (Semester ${payment.semester_number || 1})`;
        } else if (payment.payment_plan === 'instalment_wise') {
          return `Program Fee (Instalment ${payment.installment_number || 1})`;
        } else {
          return 'Program Fee';
        }
      case 'scholarship':
        return 'Scholarship';
      default:
        return 'Payment';
    }
  };

  return (
    <div className='border border-border rounded-lg p-4 bg-card'>
      <div className='flex items-center justify-between mb-3'>
        <span className='font-medium text-sm text-foreground'>
          {getPaymentTypeDisplay()}
        </span>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className='space-y-2 text-xs text-muted-foreground mb-3'>
        <div className='flex justify-between'>
          <span>Amount Payable:</span>
          <span className='text-foreground'>
            {formatCurrency(payment.amount_payable)}
          </span>
        </div>
        {payment.scholarship_amount > 0 && (
          <div className='flex justify-between'>
            <span>Scholarship Waiver:</span>
            <span className='text-blue-400'>
              -{formatCurrency(payment.scholarship_amount)}
            </span>
          </div>
        )}
        <div className='flex justify-between'>
          <span>Due:</span>
          <span className='text-foreground'>
            {formatDate(payment.due_date)}
          </span>
        </div>
        {payment.payment_date && (
          <div className='flex justify-between'>
            <span>Paid:</span>
            <span className='text-foreground'>
              {formatDate(payment.payment_date)}
            </span>
          </div>
        )}
      </div>

      <div className='flex gap-2'>
        {isPaid ? (
          <>
            <Button
              variant='outline'
              size='sm'
              className='text-xs h-8 bg-background border-border hover:bg-muted'
            >
              <Download className='h-3 w-3 mr-1' />
              Download Receipt
            </Button>
            {hasInvoice && (
              <Button
                variant='outline'
                size='sm'
                className='text-xs h-8 bg-background border-border hover:bg-muted'
                onClick={downloadInvoice}
                disabled={downloading}
              >
                <FileText className='h-3 w-3 mr-1' />
                {downloading ? 'Downloading...' : 'Download Invoice'}
              </Button>
            )}
          </>
        ) : (
          <Button
            variant='outline'
            size='sm'
            className='text-xs h-8 bg-background border-border hover:bg-muted'
          >
            <Eye className='h-3 w-3 mr-1' />
            Upload Receipt
          </Button>
        )}
      </div>
    </div>
  );
};
