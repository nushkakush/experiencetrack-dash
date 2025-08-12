import React from 'react';
import { Separator } from '@/components/ui/separator';

export interface FeeBreakdownProps {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  amountPayable: number;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  baseAmount,
  gstAmount,
  discountAmount,
  amountPayable
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Fee Breakdown</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Base Fee</span>
          <span>{formatCurrency(baseAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Scholarship Waiver</span>
          <span className={discountAmount > 0 ? 'text-red-600' : 'text-muted-foreground'}>
            {discountAmount > 0 ? `- ${formatCurrency(discountAmount)}` : 'Not Applied'}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-blue-600">
          <span>Total</span>
          <span>{formatCurrency(amountPayable)}</span>
        </div>
      </div>
    </div>
  );
};
