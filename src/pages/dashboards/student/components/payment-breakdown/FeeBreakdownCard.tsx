import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface FeeBreakdownCardProps {
  title: string;
  baseAmount: number;
  gstAmount: number;
  discountAmount?: number;
  totalPayable: number;
  status?: string;
  statusVariant?: 'outline' | 'secondary' | 'default';
  showDiscount?: boolean;
  paymentDate?: string;
}

export const FeeBreakdownCard: React.FC<FeeBreakdownCardProps> = ({
  title,
  baseAmount,
  gstAmount,
  discountAmount = 0,
  totalPayable,
  status = 'Pending',
  statusVariant = 'outline',
  showDiscount = true,
  paymentDate,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IndianRupee className='h-5 w-5' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Base Amount</p>
            <p className='text-lg font-semibold'>
              {formatCurrency(baseAmount)}
            </p>
          </div>
          {showDiscount && discountAmount > 0 && (
            <div>
              <p className='text-sm text-muted-foreground'>Discount</p>
              <p className='text-lg font-semibold text-green-600'>
                -{formatCurrency(discountAmount)}
              </p>
            </div>
          )}
          <div>
            <p className='text-sm text-muted-foreground'>GST</p>
            <p className='text-lg font-semibold'>{formatCurrency(gstAmount)}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Total Payable</p>
            <p className='text-lg font-semibold text-green-600'>
              {formatCurrency(totalPayable)}
            </p>
          </div>
        </div>

        <div className='mt-4 flex items-center justify-between'>
          {status && (
            <Badge variant={statusVariant} className='w-fit'>
              {status}
            </Badge>
          )}
          {paymentDate && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4' />
              <span>Due: {formatDate(paymentDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
