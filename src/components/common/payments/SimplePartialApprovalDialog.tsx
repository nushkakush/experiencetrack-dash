import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatCurrency } from '@/utils/formatCurrency';

interface SimplePartialApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentData?: {
    avatar_url?: string | null;
  };
  submittedAmount: number;
  expectedAmount: number;
  onApprove: (approvedAmount: number) => void;
  onReject: () => void;
  loading?: boolean;
}

export const SimplePartialApprovalDialog: React.FC<
  SimplePartialApprovalDialogProps
> = ({
  open,
  onOpenChange,
  studentName,
  studentData,
  submittedAmount,
  expectedAmount,
  onApprove,
  onReject,
  loading = false,
}) => {
  const [approvedAmount, setApprovedAmount] = useState(submittedAmount);
  const [error, setError] = useState('');

  const handleApprove = () => {
    // Validate the amount
    if (approvedAmount <= 0) {
      setError('Approved amount must be greater than 0');
      return;
    }
    if (approvedAmount > submittedAmount) {
      setError('Approved amount cannot exceed submitted amount');
      return;
    }
    if (approvedAmount === submittedAmount) {
      setError('Use full approval for the complete amount');
      return;
    }

    setError('');
    onApprove(approvedAmount);
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setApprovedAmount(numValue);
    setError(''); // Clear error when user types
  };

  const remainingAmount = submittedAmount - approvedAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Partial Payment Approval</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Student Info */}
          <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
            <UserAvatar
              avatarUrl={studentData?.avatar_url}
              name={studentName}
              size='md'
            />
            <div>
              <div className='font-medium'>{studentName}</div>
              <div className='text-sm text-muted-foreground'>
                Submitted: {formatCurrency(submittedAmount)}
              </div>
              <div className='text-sm text-muted-foreground'>
                Expected: {formatCurrency(expectedAmount)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className='space-y-2'>
            <Label htmlFor='approvedAmount' className='text-sm font-medium'>
              Enter the actual amount received:
            </Label>
            <Input
              id='approvedAmount'
              type='number'
              min='0'
              max={submittedAmount}
              step='0.01'
              value={approvedAmount}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder='Enter amount'
              className='text-lg font-medium'
            />
            {error && <div className='text-sm text-red-600'>{error}</div>}
          </div>

          {/* Summary */}
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='text-sm text-blue-700 space-y-1'>
              <div>
                <strong>Will be approved:</strong>{' '}
                {formatCurrency(approvedAmount)}
              </div>
              {approvedAmount < submittedAmount && (
                <div>
                  <strong>Will remain pending:</strong>{' '}
                  {formatCurrency(remainingAmount)}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={loading || !!error}>
            {loading ? 'Approving...' : 'Approve Partial Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
