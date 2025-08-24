import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ResetConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const ResetConfirmationDialog: React.FC<ResetConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Reset Payment Status</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Are you sure you want to reset this payment to pending status? This action cannot be undone.
          </p>
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
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2'></div>
            ) : null}
            Reset to Pending
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
