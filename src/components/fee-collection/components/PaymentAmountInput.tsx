import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface PaymentAmountInputProps {
  amountPaid: number;
  requiredAmount: number;
  onAmountChange: (amount: number) => void;
  isPartialPayment: boolean;
}

export const PaymentAmountInput: React.FC<PaymentAmountInputProps> = ({
  amountPaid,
  requiredAmount,
  onAmountChange,
  isPartialPayment
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="amount" className="text-left block">Amount Paid (₹) *</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          ₹
        </span>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amountPaid || ''}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="pl-8"
          min="0"
          max={requiredAmount}
          step="0.01"
        />
      </div>
      {amountPaid > 0 && (
        <div className="flex items-center gap-2 text-sm">
          {isPartialPayment ? (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600">Partial Payment</span>
              <Badge variant="outline" className="text-orange-600">
                ₹{requiredAmount - amountPaid} remaining
              </Badge>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Full Payment</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
