import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getPaymentPlanDescription } from '@/utils/paymentPlanDescriptions';

export interface PaymentDashboardHeaderProps {
  cohortName?: string;
  cohortStartDate?: string;
  selectedPaymentPlan?:
    | 'one_shot'
    | 'sem_wise'
    | 'instalment_wise'
    | 'not_selected';
}

export const PaymentDashboardHeader: React.FC<PaymentDashboardHeaderProps> = ({
  cohortName,
  cohortStartDate,
  selectedPaymentPlan,
}) => {
  const getCohortStartDate = () => {
    if (cohortStartDate) {
      const date = new Date(cohortStartDate);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        });
      }
    }
    return 'Start date to be announced';
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center'>
        <h1 className='text-3xl font-bold'>{cohortName || 'Cohort'}</h1>
      </div>

      {/* Introductory Text */}
      <div className='text-muted-foreground'>
        <p>
          {getPaymentPlanDescription(selectedPaymentPlan || 'not_selected')}
        </p>
      </div>
    </div>
  );
};
