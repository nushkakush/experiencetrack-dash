/**
 * Payment Header Component
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings } from 'lucide-react';
import { PaymentPlan } from '@/types/payments';

interface PaymentHeaderProps {
  cohortName: string;
  studentName: string;
  selectedPaymentPlan: PaymentPlan;
  onBackToDashboard: () => void;
  getPaymentPlanDisplay: (plan: PaymentPlan) => string;
  getPaymentPlanIcon: (plan: PaymentPlan) => React.ReactNode;
  getPaymentPlanColor: (plan: PaymentPlan) => string;
}

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  cohortName,
  studentName,
  selectedPaymentPlan,
  onBackToDashboard,
  getPaymentPlanDisplay,
  getPaymentPlanIcon,
  getPaymentPlanColor
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBackToDashboard} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">{cohortName}</h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Payment Plan Badge */}
      <div className="flex items-center gap-2">
        <Badge className={getPaymentPlanColor(selectedPaymentPlan)}>
          {getPaymentPlanIcon(selectedPaymentPlan)}
          {getPaymentPlanDisplay(selectedPaymentPlan)}
        </Badge>
      </div>
    </>
  );
};
