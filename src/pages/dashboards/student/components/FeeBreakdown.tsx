import React from 'react';
import { SharedPaymentBreakdown } from '@/components/common/payments/SharedPaymentBreakdown';

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
  amountPayable,
}) => {
  return (
    <SharedPaymentBreakdown
      baseAmount={baseAmount}
      gstAmount={gstAmount}
      discountAmount={discountAmount}
      scholarshipAmount={scholarshipAmount}
      totalAmount={amountPayable}
      title='Fee Breakdown'
      showTitle={true}
      variant='compact'
    />
  );
};
