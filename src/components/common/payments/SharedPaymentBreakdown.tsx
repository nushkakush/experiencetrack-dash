import React from 'react';
import { Separator } from '@/components/ui/separator';

export interface SharedPaymentBreakdownProps {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount?: number;
  totalAmount: number;
  title?: string;
  showTitle?: boolean;
  className?: string;
  variant?: 'compact' | 'detailed';
}

export const SharedPaymentBreakdown: React.FC<SharedPaymentBreakdownProps> = ({
  baseAmount,
  gstAmount,
  discountAmount,
  scholarshipAmount = 0,
  totalAmount,
  title = 'Fee Breakdown',
  showTitle = true,
  className = '',
  variant = 'detailed',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const textSize = variant === 'compact' ? 'text-sm' : 'text-base';
  const titleSize =
    variant === 'compact' ? 'text-sm font-medium' : 'text-base font-medium';

  return (
    <div className={`space-y-2 ${className}`}>
      {showTitle && <h4 className={titleSize}>{title}</h4>}
      <div className={`space-y-1 ${textSize}`}>
        <div className='flex justify-between'>
          <span>Base Fee</span>
          <span>{formatCurrency(baseAmount)}</span>
        </div>

        {/* One-shot or other discount, if any */}
        {discountAmount > 0 && (
          <div className='flex justify-between'>
            <span>One-shot Discount</span>
            <span className='text-green-600'>
              - {formatCurrency(discountAmount)}
            </span>
          </div>
        )}

        <div className='flex justify-between'>
          <span>GST</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>

        {/* Scholarship waiver shown separately from discount */}
        {scholarshipAmount > 0 && (
          <div className='flex justify-between'>
            <span>Scholarship Waiver</span>
            <span className='text-red-600'>
              - {formatCurrency(scholarshipAmount)}
            </span>
          </div>
        )}

        <Separator />
        <div className='flex justify-between font-semibold text-blue-600'>
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};
