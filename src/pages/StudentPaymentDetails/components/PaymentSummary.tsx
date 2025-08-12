/**
 * Payment Summary Component
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CheckCircle } from 'lucide-react';
import { PaymentPlan } from '@/types/payments';

interface PaymentSummaryProps {
  paymentBreakdown: any; // TODO: Replace with proper type
  selectedPaymentPlan: PaymentPlan;
  feeStructure: any; // TODO: Replace with proper type
  cohortData: any; // TODO: Replace with proper type
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  paymentBreakdown,
  selectedPaymentPlan,
  feeStructure,
  cohortData,
  formatCurrency,
  formatDate
}) => {
  if (!paymentBreakdown) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Payment Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(paymentBreakdown.overallSummary.totalAmountPayable)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedPaymentPlan === 'one_shot' && `As a one shot instalment starting before ${formatDate(cohortData?.start_date)}. This is inclusive of your scholarship waiver.`}
            {selectedPaymentPlan === 'sem_wise' && `Over ${feeStructure.number_of_semesters} instalments starting on ${formatDate(cohortData?.start_date)}. This is inclusive of your scholarship waiver.`}
            {selectedPaymentPlan === 'instalment_wise' && `Over ${feeStructure.number_of_semesters * feeStructure.instalments_per_semester} instalments starting on ${formatDate(cohortData?.start_date)}. This is inclusive of your scholarship waiver.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Admission Fee Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(paymentBreakdown.admissionFee.totalPayable)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Admission fee to be paid before course commencement
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
