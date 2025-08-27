import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, User, Calendar } from 'lucide-react';
import { EquipmentBorrowing } from '@/types/equipment';
import { useDeleteBorrowing } from '@/hooks/equipment/useEquipment';
import { format } from 'date-fns';

interface DeleteBorrowingDialogProps {
  borrowing: EquipmentBorrowing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteBorrowingDialog({
  borrowing,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBorrowingDialogProps) {
  const deleteBorrowing = useDeleteBorrowing();

  const handleDelete = async () => {
    if (!borrowing) return;

    try {
      await deleteBorrowing.mutateAsync(borrowing.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!borrowing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            Delete Borrowing Record
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this borrowing record? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Equipment Information */}
          <div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
            <Package className='h-5 w-5 text-muted-foreground' />
            <div>
              <div className='font-medium'>{borrowing.equipment?.name}</div>
              <div className='text-sm text-muted-foreground'>
                {borrowing.equipment?.category?.name}
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
            <User className='h-5 w-5 text-muted-foreground' />
            <div>
              <div className='font-medium'>{borrowing.student?.name}</div>
              <div className='text-sm text-muted-foreground'>
                {borrowing.student?.email}
              </div>
            </div>
          </div>

          {/* Borrowing Details */}
          <div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
            <Calendar className='h-5 w-5 text-muted-foreground' />
            <div>
              <div className='font-medium'>
                Borrowed:{' '}
                {borrowing.borrowed_at
                  ? format(new Date(borrowing.borrowed_at), 'MMM dd, yyyy')
                  : 'N/A'}
              </div>
              <div className='text-sm text-muted-foreground'>
                Expected Return:{' '}
                {borrowing.expected_return_date
                  ? format(
                      new Date(borrowing.expected_return_date),
                      'MMM dd, yyyy'
                    )
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
            <div className='text-sm text-destructive font-medium'>
              ⚠️ Warning: This will also change the equipment status back to
              'Available'
            </div>
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={deleteBorrowing.isPending}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={deleteBorrowing.isPending}
          >
            {deleteBorrowing.isPending ? 'Deleting...' : 'Delete Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
