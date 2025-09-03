import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EpicsService } from '@/services/epics.service';
import type { Epic } from '@/types/epic';

interface DeleteEpicDialogProps {
  epic: Epic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEpicDeleted: () => void;
}

export const DeleteEpicDialog: React.FC<DeleteEpicDialogProps> = ({
  epic,
  open,
  onOpenChange,
  onEpicDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setLoading(true);
      await EpicsService.deleteEpic(epic.id);
      onEpicDeleted();
    } catch (error) {
      console.error('Error deleting epic:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete epic. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            <span>Delete Epic</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the epic "{epic.name}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='bg-destructive/10 p-4 rounded-lg'>
          <p className='text-sm text-destructive'>
            <strong>Warning:</strong> Deleting this epic will remove it
            permanently from the system. Any associated data may also be
            affected.
          </p>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Epic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
