/**
 * Course Overview Component
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { PaymentPlan } from '@/types/payments';

interface CourseOverviewProps {
  courseName: string;
  selectedPaymentPlan: PaymentPlan;
  getPaymentPlanDisplay: (plan: PaymentPlan) => string;
}

export const CourseOverview: React.FC<CourseOverviewProps> = ({
  courseName,
  selectedPaymentPlan,
  getPaymentPlanDisplay
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Course & Payment Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Course</p>
            <p className="text-muted-foreground">{courseName}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Payment Plan</p>
            <p className="text-muted-foreground">{getPaymentPlanDisplay(selectedPaymentPlan)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
