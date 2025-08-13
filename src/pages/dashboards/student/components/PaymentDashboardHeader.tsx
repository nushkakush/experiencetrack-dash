import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface PaymentDashboardHeaderProps {
  cohortName?: string;
  cohortStartDate?: string;
}

export const PaymentDashboardHeader: React.FC<PaymentDashboardHeaderProps> = ({
  cohortName,
  cohortStartDate
}) => {
  const getCohortStartDate = () => {
    if (cohortStartDate) {
      const date = new Date(cohortStartDate);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric'
        });
      }
    }
    return 'Start date to be announced';
  };

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">{cohortName || 'Cohort'}</h1>
      <p className="text-muted-foreground">{getCohortStartDate()}</p>
      
      {/* Introductory Text */}
      <div className="text-muted-foreground">
        <p>
          Our zero-interest instalment plan is designed to ease lump-sum payments and ensure you can focus on learning without financial strain.
        </p>
      </div>
    </div>
  );
};
