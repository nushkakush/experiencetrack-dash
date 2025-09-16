import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Trash2, X } from 'lucide-react';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface NotesManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  currentNotes: string;
  onNotesUpdated: (notes: string) => void;
}

export const NotesManagementDialog: React.FC<NotesManagementDialogProps> = ({
  open,
  onOpenChange,
  transactionId,
  currentNotes,
  onNotesUpdated,
}) => {
  const [notes, setNotes] = useState(currentNotes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if user can manage notes (fee collector or super admin)
  const canManageNotes = profile?.role === 'fee_collector' || profile?.role === 'super_admin';

  // Reset notes when dialog opens
  React.useEffect(() => {
    if (open) {
      setNotes(currentNotes || '');
      setError(null);
    }
  }, [open, currentNotes]);

  const handleSave = async () => {
    if (!canManageNotes) {
      setError('You do not have permission to manage payment notes');
      return;
    }

    if (!transactionId) {
      setError('Transaction ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await paymentTransactionService.updateNotes(transactionId, notes);
      
      if (result.success) {
        onNotesUpdated(notes);
        onOpenChange(false);
        toast({
          title: 'Success',
          description: 'Payment notes updated successfully',
        });
      } else {
        setError(result.error || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating payment notes:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canManageNotes) {
      setError('You do not have permission to manage payment notes');
      return;
    }

    if (!transactionId) {
      setError('Transaction ID is required');
      return;
    }

    if (!confirm('Are you sure you want to delete these payment notes? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await paymentTransactionService.updateNotes(transactionId, '');
      
      if (result.success) {
        onNotesUpdated('');
        onOpenChange(false);
        toast({
          title: 'Success',
          description: 'Payment notes deleted successfully',
        });
      } else {
        setError(result.error || 'Failed to delete notes');
      }
    } catch (error) {
      console.error('Error deleting payment notes:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Manage Payment Notes</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='notes'>Payment Notes</Label>
            <Textarea
              id='notes'
              placeholder='Add any notes about this payment...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='min-h-[120px] resize-vertical'
              disabled={isLoading || !canManageNotes}
            />
            <p className='text-sm text-muted-foreground'>
              Add any additional notes or comments about this payment installment.
            </p>
          </div>

          <div className='flex justify-between'>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={handleDelete}
                disabled={isLoading || !notes.trim() || !canManageNotes}
                className='text-destructive hover:text-destructive'
              >
                {isLoading ? (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                ) : (
                  <Trash2 className='h-4 w-4 mr-2' />
                )}
                Delete Notes
              </Button>
            </div>
            
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
              >
                <X className='h-4 w-4 mr-2' />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !canManageNotes}
              >
                {isLoading ? (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                ) : (
                  <Save className='h-4 w-4 mr-2' />
                )}
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
