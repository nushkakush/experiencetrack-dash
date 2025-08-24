import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

export const SimplePartialApprovalDialog: React.FC<SimplePartialApprovalDialogProps> = ({
  open,
  onOpenChange,
  studentName,
  studentData,
  submittedAmount,
  expectedAmount,
  onApprove,
  onReject,
  loading = false
}) => {
  const [approvalType, setApprovalType] = useState<'full' | 'partial' | 'reject'>('full');
  const [approvedAmount, setApprovedAmount] = useState(submittedAmount);

  const handleApprove = () => {
    if (approvalType === 'full') {
      onApprove(submittedAmount);
    } else if (approvalType === 'partial') {
      onApprove(approvedAmount);
    }
  };

  const handleReject = () => {
    onReject();
  };

  const remainingAmount = submittedAmount - approvedAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <UserAvatar
              avatarUrl={studentData?.avatar_url}
              name={studentName}
              size="md"
            />
            <div>
              <div className="font-medium">{studentName}</div>
              <div className="text-sm text-muted-foreground">
                Submitted: {formatCurrency(submittedAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                Expected: {formatCurrency(expectedAmount)}
              </div>
            </div>
          </div>

          {/* Approval Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Choose Action:</div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="full"
                  checked={approvalType === 'full'}
                  onChange={(e) => setApprovalType(e.target.value as 'full')}
                  className="form-radio"
                />
                <span className="text-sm">Approve Full Amount ({formatCurrency(submittedAmount)})</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="partial"
                  checked={approvalType === 'partial'}
                  onChange={(e) => setApprovalType(e.target.value as 'partial')}
                  className="form-radio"
                />
                <span className="text-sm">Partially Approve</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="reject"
                  checked={approvalType === 'reject'}
                  onChange={(e) => setApprovalType(e.target.value as 'reject')}
                  className="form-radio"
                />
                <span className="text-sm">Reject Payment</span>
              </label>
            </div>
          </div>

          {/* Partial Approval Amount */}
          {approvalType === 'partial' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Approved Amount:</label>
              <input
                type="range"
                min="0"
                max={submittedAmount}
                step="0.01"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center">
                <span className="text-lg font-bold">{formatCurrency(approvedAmount)}</span>
                {approvedAmount < submittedAmount && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong>Partial Payment:</strong> {formatCurrency(approvedAmount)} will be approved.
                    Remaining {formatCurrency(remainingAmount)} will stay pending.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Warning */}
          {approvalType === 'reject' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">
                <strong>Warning:</strong> Rejecting this payment will mark it as invalid and require the student to submit a new payment.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {approvalType === 'reject' ? (
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
            >
              {loading ? 'Rejecting...' : 'Reject Payment'}
            </Button>
          ) : (
            <Button
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? 'Approving...' : 'Approve Payment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
