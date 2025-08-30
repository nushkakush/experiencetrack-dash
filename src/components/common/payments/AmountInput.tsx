import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface AmountInputProps {
  amount: number;
  maxAmount: number;
  onAmountChange: (amount: number) => void;
  error?: string;
  disabled?: boolean;
  allowPartialPayments?: boolean;
  isFixedAmount?: boolean;
  partialPaymentInfo?: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    partialPaymentCount: number;
    maxPartialPayments: number;
  };
}

export const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  maxAmount,
  onAmountChange,
  error,
  disabled = false,
  allowPartialPayments = false,
  isFixedAmount = false,
  partialPaymentInfo,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const validateAmount = (amount: number) => {
    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }
    // Use a small epsilon for floating-point comparison to handle precision issues
    const epsilon = 0.01;
    if (amount > maxAmount + epsilon) {
      return `Amount cannot exceed ${formatCurrency(maxAmount)}`;
    }
    return '';
  };

  const handleAmountChange = (value: string) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    const formattedValue =
      parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanValue;

    const amount = parseFloat(formattedValue) || 0;
    onAmountChange(amount);
  };

  const formatAmountForDisplay = (amount: number) => {
    if (amount === 0) return '';

    // Format with Indian comma system (1,00,000.00)
    const parts = amount.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Add Indian commas (last 3 digits, then groups of 2)
    let formattedInteger = '';
    const len = integerPart.length;

    if (len <= 3) {
      formattedInteger = integerPart;
    } else {
      // Last 3 digits
      const lastThree = integerPart.slice(-3);
      // Remaining digits
      const remaining = integerPart.slice(0, -3);
      // Add commas for groups of 2
      const formattedRemaining = remaining.replace(
        /\B(?=(\d{2})+(?!\d))/g,
        ','
      );
      formattedInteger = formattedRemaining + ',' + lastThree;
    }

    return decimalPart
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  // Log partial payment restrictions for debugging
  React.useEffect(() => {
    console.log('🔒 AmountInput Partial Payment Settings:', {
      allowPartialPayments,
      isFixedAmount,
      maxAmount,
      hasPartialPaymentInfo: !!partialPaymentInfo,
    });
  }, [allowPartialPayments, isFixedAmount, maxAmount, partialPaymentInfo]);

  return (
    <div className='space-y-4'>
      <div>
        <Label htmlFor='amount'>Amount to Pay</Label>

        {/* Show partial payment history if available */}
        {partialPaymentInfo && partialPaymentInfo.paidAmount > 0 && (
          <div className='mb-3 p-3 bg-muted/50 rounded-lg border'>
            <div className='text-sm space-y-1'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Total Amount:</span>
                <span className='font-medium'>
                  {formatCurrency(partialPaymentInfo.totalAmount)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Already Paid:</span>
                <span className='font-medium text-green-600'>
                  {formatCurrency(partialPaymentInfo.paidAmount)}
                </span>
              </div>
              <div className='flex justify-between border-t pt-1'>
                <span className='text-muted-foreground'>Amount Pending:</span>
                <span className='font-medium text-orange-600'>
                  {formatCurrency(partialPaymentInfo.pendingAmount)}
                </span>
              </div>
              {partialPaymentInfo.partialPaymentCount > 0 && (
                <div className='text-xs text-muted-foreground'>
                  Partial payments: {partialPaymentInfo.partialPaymentCount}/
                  {partialPaymentInfo.maxPartialPayments}
                </div>
              )}
            </div>
          </div>
        )}

        <div className='relative'>
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground'>
            ₹
          </div>

          {isFixedAmount ? (
            // Fixed amount display (no input)
            <div className='w-full px-3 py-2 pl-8 pr-16 border rounded-md bg-muted text-lg font-medium'>
              {formatAmountForDisplay(maxAmount)}
            </div>
          ) : (
            // Editable amount input
            <Input
              id='amount'
              type='text'
              placeholder={
                allowPartialPayments ? 'Enter amount' : 'Full payment amount'
              }
              value={formatAmountForDisplay(amount)}
              onChange={e => handleAmountChange(e.target.value)}
              className={`${error ? 'border-red-500' : ''} pl-8 pr-16`}
              disabled={disabled}
            />
          )}

          <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground'>
            {isFixedAmount ? 'Fixed' : `Max: ${formatCurrency(maxAmount)}`}
          </div>
        </div>

        {error && <p className='text-sm text-red-500 mt-1'>{error}</p>}

        {!allowPartialPayments && !isFixedAmount && (
          <p className='text-sm text-muted-foreground mt-1'>
            Full payment required - partial payments not allowed
          </p>
        )}

        {allowPartialPayments && !isFixedAmount && partialPaymentInfo && (
          <p className='text-sm text-muted-foreground mt-1'>
            Partial payments allowed -{' '}
            {partialPaymentInfo.maxPartialPayments -
              partialPaymentInfo.partialPaymentCount}{' '}
            remaining
          </p>
        )}
      </div>
    </div>
  );
};
