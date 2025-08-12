import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentSummaryProps {
  overallSummary: {
    totalProgramFee: number;
    totalGST: number;
    totalDiscount: number;
    totalAmountPayable: number;
  };
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  overallSummary
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Program Fee</p>
            <p className="text-lg font-semibold">{formatCurrency(overallSummary.totalProgramFee)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total GST</p>
            <p className="text-lg font-semibold">{formatCurrency(overallSummary.totalGST)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Discount</p>
            <p className="text-lg font-semibold">{formatCurrency(overallSummary.totalDiscount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount Payable</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(overallSummary.totalAmountPayable)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
