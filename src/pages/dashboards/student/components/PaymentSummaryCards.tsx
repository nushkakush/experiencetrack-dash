import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';

interface Semester {
  semesterNumber: number;
  instalments: Array<{
    paymentDate: string;
    baseAmount: number;
    gstAmount: number;
    amountPayable: number;
  }>;
}

interface PaymentBreakdownData {
  semesters: Semester[];
  admissionFee: {
    totalPayable: number;
  };
  overallSummary: {
    totalAmountPayable: number;
    oneShotDiscount?: number;
  };
}

export interface PaymentSummaryCardsProps {
  paymentBreakdown: PaymentBreakdownData;
  selectedPaymentPlan: PaymentPlan;
}

export const PaymentSummaryCards: React.FC<PaymentSummaryCardsProps> = ({
  paymentBreakdown,
  selectedPaymentPlan
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getPaymentPlanDescription = () => {
    if (!paymentBreakdown?.overallSummary) return '';
    
    const { totalAmountPayable } = paymentBreakdown.overallSummary;
    
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return `Pay your fees in a one shot instalment with an additional waiver of ${paymentBreakdown.overallSummary?.oneShotDiscount || 0}%`;
      case 'sem_wise':
        return `Pay your fees Over a course of ${paymentBreakdown.semesters?.length || 0} semesters`;
      case 'instalment_wise':
        const totalInstallments = paymentBreakdown.semesters?.reduce((total: number, semester: Semester) => 
          total + (semester.instalments?.length || 0), 0
        ) || 0;
        return `Pay your fees Over a course of ${totalInstallments} instalments`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Total Payment Summary Card */}
      <Card className="border-2 border-blue-200 bg-blue-600/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">
                You are required to make a total payment of {formatCurrency(paymentBreakdown.overallSummary?.totalAmountPayable || 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {getPaymentPlanDescription()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admission Fee Card */}
      <Card className="border-green-200 bg-green-600/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {formatCurrency(paymentBreakdown.admissionFee?.totalPayable || 0)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Admission fee paid</p>
              <p className="text-xs text-muted-foreground">3 Nov, 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
