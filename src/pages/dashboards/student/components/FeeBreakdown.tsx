import React from 'react';
import { Separator } from '@/components/ui/separator';

export interface FeeBreakdownProps {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number; // One-shot or other discount
  scholarshipAmount?: number; // Scholarship waiver (separate from discount)
  amountPayable: number;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  baseAmount,
  gstAmount,
  discountAmount,
  scholarshipAmount = 0,
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
        {/* One-shot or other discount, if any */}
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span>One-shot Discount</span>
            <span className="text-green-600">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>GST</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>
        {/* Scholarship waiver shown separately from discount */}
        {scholarshipAmount > 0 && (
          <div className="flex justify-between">
            <span>Scholarship Waiver</span>
            <span className="text-red-600">- {formatCurrency(scholarshipAmount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold text-blue-600">
          <span>Total</span>
          <span>{formatCurrency(amountPayable)}</span>
        </div>
      </div>
    </div>
  );
};
