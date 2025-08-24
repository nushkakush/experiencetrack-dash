import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  open,
  onOpenChange,
  rejectionReason,
  onRejectionReasonChange,
  onSubmit,
  onCancel,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-md'
        aria-describedby='rejection-dialog-description'
      >
        <DialogHeader>
          <DialogTitle>Reject Payment</DialogTitle>
        </DialogHeader>
        <div id='rejection-dialog-description' className='sr-only'>
          Dialog for providing reason for payment rejection
        </div>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='rejection-reason'>Reason for Rejection *</Label>
            <Textarea
              id='rejection-reason'
              placeholder='Please provide a reason for rejecting this payment...'
              value={rejectionReason}
              onChange={e => onRejectionReasonChange(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='secondary'
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={onSubmit}
            disabled={!rejectionReason.trim() || loading}
          >
            Reject Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
