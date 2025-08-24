import React from 'react';

export const PaymentScheduleLoadingState: React.FC = () => {
  return (
    <div className='space-y-3'>
      <div className='animate-pulse'>
        <div className='h-20 bg-muted rounded mb-2'></div>
        <div className='h-20 bg-muted rounded mb-2'></div>
        <div className='h-20 bg-muted rounded mb-2'></div>
      </div>
    </div>
  );
};
