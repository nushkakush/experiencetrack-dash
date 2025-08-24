import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const NoPaymentScheduleCard: React.FC = () => {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='text-center text-muted-foreground'>
          No payment schedule available. Please select a payment plan first.
        </div>
      </CardContent>
    </Card>
  );
};
