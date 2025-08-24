import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface AdmissionFeeCardProps {
  admissionFeeAmount: number;
  formatCurrency: (amount: number) => string;
}

export const AdmissionFeeCard: React.FC<AdmissionFeeCardProps> = ({
  admissionFeeAmount,
  formatCurrency,
}) => {
  return (
    <Card className='border-green-200 bg-green-600/10'>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-600'>
              <CheckCircle className='h-5 w-5 text-white' />
            </div>
            <div>
              <p className='text-lg font-semibold'>
                {formatCurrency(admissionFeeAmount)}
              </p>
              <p className='text-sm text-muted-foreground'>Admission Fee</p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-xs text-muted-foreground'>Status</p>
            <p className='text-xs text-green-600 font-medium'>Paid</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
