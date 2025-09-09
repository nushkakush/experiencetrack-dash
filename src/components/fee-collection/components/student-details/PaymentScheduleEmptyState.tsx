import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, IndianRupee } from 'lucide-react';

export const PaymentScheduleEmptyState: React.FC = () => {
  return (
    <>
      <div className='text-center py-8'>
        <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
          <Calendar className='h-8 w-8 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold text-foreground mb-2'>
          No Payment Schedule Available
        </h3>
        <p className='text-sm text-muted-foreground mb-4 max-w-sm mx-auto'>
          Payment schedule will be generated once the student selects a payment
          plan. This will show all upcoming payments and due dates.
        </p>

        {/* Schedule Preview */}
        <div className='grid grid-cols-1 gap-3 max-w-xs mx-auto'>
          <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
            <IndianRupee className='h-5 w-5 text-green-600' />
            <div className='text-left'>
              <p className='text-sm font-medium'>One-Shot Payment</p>
              <p className='text-xs text-muted-foreground'>
                Single payment due immediately
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
            <Clock className='h-5 w-5 text-blue-600' />
            <div className='text-left'>
              <p className='text-sm font-medium'>Semester-wise</p>
              <p className='text-xs text-muted-foreground'>
                Payments due at semester start
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
            <Calendar className='h-5 w-5 text-purple-600' />
            <div className='text-left'>
              <p className='text-sm font-medium'>Installment-wise</p>
              <p className='text-xs text-muted-foreground'>
                Regular monthly payments
              </p>
            </div>
          </div>
        </div>
      </div>
      <Separator className='bg-border' />
    </>
  );
};
