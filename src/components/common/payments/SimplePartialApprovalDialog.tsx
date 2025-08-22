import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface SimplePartialApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  studentName: string;
  submittedAmount: number;
  expectedAmount: number;
  onApprove: (transactionId: string, actualAmount: number) => void;
  loading?: boolean;
}

export const SimplePartialApprovalDialog: React.FC<SimplePartialApprovalDialogProps> = ({
  open,
  onOpenChange,
  transactionId,
  studentName,
  submittedAmount,
  expectedAmount,
  onApprove,
  loading = false
}) => {
  const [actualAmount, setActualAmount] = useState(submittedAmount);
  const [error, setError] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setActualAmount(submittedAmount);
      setError('');
    }
  }, [open, submittedAmount]);

  const validateAmount = (amount: number) => {
    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (amount > expectedAmount) {
      return 'Amount cannot exceed the expected amount';
    }
    return '';
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setActualAmount(amount);
    setError(validateAmount(amount));
  };

  const handleSubmit = () => {
    const validationError = validateAmount(actualAmount);
    if (validationError) {
      setError(validationError);
      return;
    }

    onApprove(transactionId, actualAmount);
    onOpenChange(false);
  };

  const isPartialPayment = actualAmount > 0 && actualAmount < expectedAmount;
  const isFullPayment = actualAmount === expectedAmount;
  const remainingAmount = expectedAmount - actualAmount;

  const formatAmountForDisplay = (amount: number) => {
    if (amount === 0) return '';
    return amount.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Approve Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student Submitted:</span>
              <span className="font-medium">{formatCurrency(submittedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Amount:</span>
              <span className="font-medium">{formatCurrency(expectedAmount)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="actualAmount">Actual Amount Received *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="actualAmount"
                type="number"
                value={formatAmountForDisplay(actualAmount)}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`pl-8 ${error ? 'border-red-500' : ''}`}
                max={expectedAmount}
                step="0.01"
                placeholder="Enter actual amount received"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the exact amount you verified the student has actually paid
            </p>
          </div>

          {/* Payment Status Preview */}
          {actualAmount > 0 && !error && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {isFullPayment ? (
                  <span className="text-green-700">
                    <strong>Full Payment:</strong> This transaction will be marked as fully paid.
                  </span>
                ) : isPartialPayment ? (
                  <span className="text-orange-700">
                    <strong>Partial Payment:</strong> {formatCurrency(actualAmount)} will be approved. 
                    Remaining {formatCurrency(remainingAmount)} will stay pending.
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !!error || actualAmount <= 0}
          >
            {loading ? 'Processing...' : 'Approve Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
