import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface PartialApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  studentName: string;
  originalAmount: number;
  expectedAmount: number;
  onApprovePartial: (transactionId: string, approvedAmount: number, notes?: string) => void;
  onApproveFull: (transactionId: string, notes?: string) => void;
  onReject: (transactionId: string, reason: string) => void;
  loading?: boolean;
}

export const PartialApprovalDialog: React.FC<PartialApprovalDialogProps> = ({
  open,
  onOpenChange,
  transactionId,
  studentName,
  originalAmount,
  expectedAmount,
  onApprovePartial,
  onApproveFull,
  onReject,
  loading = false
}) => {
  const [approvalType, setApprovalType] = useState<'full' | 'partial' | 'reject'>('full');
  const [approvedAmount, setApprovedAmount] = useState(originalAmount);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (approvalType === 'partial') {
      if (approvedAmount <= 0) {
        newErrors.approvedAmount = 'Approved amount must be greater than 0';
      }
      if (approvedAmount > originalAmount) {
        newErrors.approvedAmount = 'Approved amount cannot exceed submitted amount';
      }
      if (approvedAmount === originalAmount) {
        newErrors.approvedAmount = 'Use full approval for the complete amount';
      }
    }

    if (approvalType === 'reject' && !rejectionReason.trim()) {
      newErrors.rejectionReason = 'Rejection reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    switch (approvalType) {
      case 'full':
        onApproveFull(transactionId, notes);
        break;
      case 'partial':
        onApprovePartial(transactionId, approvedAmount, notes);
        break;
      case 'reject':
        onReject(transactionId, rejectionReason);
        break;
    }

    // Reset form
    setApprovalType('full');
    setApprovedAmount(originalAmount);
    setNotes('');
    setRejectionReason('');
    setErrors({});
  };

  const remainingAmount = originalAmount - approvedAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Payment Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Submitted Amount:</span>
              <span className="font-medium">{formatCurrency(originalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Amount:</span>
              <span className="font-medium">{formatCurrency(expectedAmount)}</span>
            </div>
            {originalAmount !== expectedAmount && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Submitted amount differs from expected amount by {formatCurrency(Math.abs(originalAmount - expectedAmount))}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Approval Options */}
          <div className="space-y-3">
            <Label>Action</Label>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="full"
                  checked={approvalType === 'full'}
                  onChange={(e) => setApprovalType(e.target.value as 'full')}
                  className="form-radio"
                />
                <span className="text-sm">Approve Full Amount ({formatCurrency(originalAmount)})</span>
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
              <Label htmlFor="approvedAmount">Approved Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="approvedAmount"
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(parseFloat(e.target.value) || 0)}
                  className={`pl-8 ${errors.approvedAmount ? 'border-red-500' : ''}`}
                  max={originalAmount}
                  step="0.01"
                />
              </div>
              {errors.approvedAmount && (
                <p className="text-sm text-red-600">{errors.approvedAmount}</p>
              )}
              {approvedAmount > 0 && approvedAmount < originalAmount && (
                <div className="text-sm p-2 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center gap-1 text-orange-700">
                    <CheckCircle className="h-3 w-3" />
                    <span>Remaining amount: {formatCurrency(remainingAmount)} will be marked as pending</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes for approval */}
          {(approvalType === 'full' || approvalType === 'partial') && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Rejection Reason */}
          {approvalType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payment is being rejected..."
                className={`resize-none ${errors.rejectionReason ? 'border-red-500' : ''}`}
                rows={3}
              />
              {errors.rejectionReason && (
                <p className="text-sm text-red-600">{errors.rejectionReason}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
