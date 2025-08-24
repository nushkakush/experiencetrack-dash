import React from 'react';
import { Calendar } from 'lucide-react';

export const PaymentScheduleNoPaymentsState: React.FC = () => {
  return (
    <div className='text-center py-8'>
      <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
        <Calendar className='h-8 w-8 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold text-foreground mb-2'>
        No Payments Scheduled
      </h3>
      <p className='text-sm text-muted-foreground'>
        Payment schedule is being generated. Please check back later.
      </p>
    </div>
  );
};
