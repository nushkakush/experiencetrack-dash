/**
 * Payment Header Component
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { PaymentPlan } from '@/types/payments';

interface PaymentHeaderProps {
  cohortName: string;
  studentName: string;
  studentData?: {
    avatar_url?: string | null;
    email?: string;
  };
  selectedPaymentPlan: PaymentPlan;
  onBackToDashboard: () => void;
  getPaymentPlanDisplay: (plan: PaymentPlan) => string;
  getPaymentPlanIcon: (plan: PaymentPlan) => React.ReactNode;
  getPaymentPlanColor: (plan: PaymentPlan) => string;
}

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  cohortName,
  studentName,
  studentData,
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
          <div className="flex items-center justify-end gap-2">
            <UserAvatar
              avatarUrl={studentData?.avatar_url}
              name={studentName}
              size="sm"
            />
            <p className="text-muted-foreground">{studentName}</p>
          </div>
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
