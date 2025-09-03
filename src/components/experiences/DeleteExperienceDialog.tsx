import React from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Experience } from '@/types/experience';

interface DeleteExperienceDialogProps {
  experience: Experience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteExperienceDialog: React.FC<DeleteExperienceDialogProps> = ({
  experience,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}) => {
  if (!experience) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            <span>Delete Experience</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the experience
            and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            You are about to delete <strong>"{experience.title}"</strong> ({experience.type}).
            This will permanently remove:
            <ul className='mt-2 ml-4 list-disc space-y-1'>
              <li>All challenge content and deliverables</li>
              <li>Grading rubric and assessment conditions</li>
              <li>Lecture sessions and resources</li>
              <li>Sample profile references</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Experience'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
