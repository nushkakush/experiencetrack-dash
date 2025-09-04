import React, { useState } from 'react';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useMagicBriefs, useMagicBriefExpansion } from '@/hooks/useMagicBriefs';
import { MagicCreateButton, MagicBriefsGrid } from './magicBriefs';
import type { MagicBrief } from '@/types/magicBrief';

/**
 * Main magic briefs tab component
 * Orchestrates all magic brief functionality
 */
export const MagicBriefsTab: React.FC = () => {
  const {
    savedBriefs,
    activeEpicId,
    error,
    loadMagicBriefs,
    deleteMagicBrief,
  } = useMagicBriefs();

  const { expandMagicBrief, isExpanding } = useMagicBriefExpansion();
  const { toast } = useToast();

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [briefToDelete, setBriefToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleExpand = async (brief: MagicBrief) => {
    try {
      const experience = await expandMagicBrief(brief);

      toast({
        title: 'Brief Expanded Successfully!',
        description: `"${brief.title}" has been ${brief.expanded ? 're-expanded' : 'converted'} to a full CBL experience.`,
      });

      // Reload briefs to update expanded status
      await loadMagicBriefs();

      // Notify experiences page to refresh the experience table
      try {
        window.dispatchEvent(
          new CustomEvent('experience:upserted', { detail: experience })
        );
      } catch (error) {
        // Ignore event dispatch errors
        console.debug('Failed to dispatch experience:upserted event:', error);
      }
    } catch (error) {
      toast({
        title: 'Expansion Failed',
        description: error.message || 'Failed to expand magic brief',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (brief: MagicBrief) => {
    setBriefToDelete({ id: brief.id, title: brief.title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!briefToDelete) return;

    try {
      await deleteMagicBrief(briefToDelete.id);

      toast({
        title: 'Brief Deleted',
        description: 'Magic brief has been removed successfully.',
      });

      setDeleteDialogOpen(false);
      setBriefToDelete(null);
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete magic brief',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBriefToDelete(null);
  };

  const handleMagicBriefsGenerated = () => {
    loadMagicBriefs();
  };

  // Show message when no epic is selected
  if (!activeEpicId) {
    return (
      <div className='text-center py-12'>
        <Sparkles className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
        <h3 className='text-lg font-semibold mb-2'>No Epic Selected</h3>
        <p className='text-muted-foreground mb-4'>
          Select an epic to generate and manage magic briefs
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Magic Briefs</h2>
          <p className='text-muted-foreground'>
            AI-generated brand case study challenges ready to expand into full
            experiences
          </p>
        </div>

        <MagicCreateButton
          onMagicBriefsGenerated={handleMagicBriefsGenerated}
          disabled={!activeEpicId}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Expanding Overlay */}
      {isExpanding && (
        <Alert>
          <Loader2 className='h-4 w-4 animate-spin' />
          <AlertDescription>
            Expanding magic brief into full CBL experience... This may take a
            moment.
          </AlertDescription>
        </Alert>
      )}

      {/* Magic Briefs Grid */}
      <MagicBriefsGrid
        briefs={savedBriefs}
        onExpand={handleExpand}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Magic Brief</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{briefToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
