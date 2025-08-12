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
      return date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric'
      });
    }
    return 'Not set';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          Fee Payment
        </Badge>
      </div>
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
