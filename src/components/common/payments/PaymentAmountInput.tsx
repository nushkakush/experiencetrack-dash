import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentAmountInputProps {
  amount: number;
  maxAmount: number;
  onAmountChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PaymentAmountInput = React.memo<PaymentAmountInputProps>(({
  amount,
  maxAmount,
  onAmountChange,
  error,
  disabled = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
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
      const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formattedInteger = formattedRemaining + ',' + lastThree;
    }
    
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  return (
    <div>
      <Label htmlFor="amount">Amount to Pay</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
          ₹
        </div>
        <Input
          id="amount"
          type="text"
          placeholder="Enter amount"
          value={formatAmountForDisplay(amount)}
          onChange={(e) => onAmountChange(e.target.value)}
          className={`${error ? 'border-red-500' : ''} pl-8`}
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
          Max: {formatCurrency(maxAmount)}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
});

PaymentAmountInput.displayName = 'PaymentAmountInput';
