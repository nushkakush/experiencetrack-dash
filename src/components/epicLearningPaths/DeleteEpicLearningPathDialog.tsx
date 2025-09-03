import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
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
import { EpicLearningPathsService } from '@/services/epicLearningPaths.service';
import type { EpicLearningPath } from '@/types/epicLearningPath';

interface DeleteEpicLearningPathDialogProps {
  learningPath: EpicLearningPath;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLearningPathDeleted: () => void;
}

export const DeleteEpicLearningPathDialog: React.FC<DeleteEpicLearningPathDialogProps> = ({
  learningPath,
  open,
  onOpenChange,
  onLearningPathDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setLoading(true);
      await EpicLearningPathsService.deleteEpicLearningPath(learningPath.id);
      onLearningPathDeleted();
    } catch (error) {
      console.error('Error deleting learning path:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete learning path. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            <span>Delete Learning Path</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this learning path? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-4'>
            <h4 className='font-medium text-destructive mb-2'>
              "{learningPath.title}"
            </h4>
            <div className='text-sm text-muted-foreground space-y-1'>
              <p>• This learning path contains {learningPath.epics.length} epic{learningPath.epics.length !== 1 ? 's' : ''}</p>
              <p>• {learningPath.outcomes?.length || 0} learning outcome{(learningPath.outcomes?.length || 0) !== 1 ? 's' : ''} will be lost</p>
              <p>• All associated data will be permanently removed</p>
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
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4 mr-2' />
                Delete Learning Path
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
