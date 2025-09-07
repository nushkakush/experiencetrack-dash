import React, { useState, useEffect } from 'react';
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
import { CompactCoverageProgress } from './magicBriefs/CompactCoverageProgress';
import { ExpandAllButton } from './magicBriefs/ExpandAllButton';
import { EpicsService } from '@/services/epics.service';
import type { MagicBrief } from '@/types/magicBrief';
import type { Epic } from '@/types/epic';

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

  // State for epic data
  const [activeEpic, setActiveEpic] = useState<Epic | null>(null);
  const [epicLoading, setEpicLoading] = useState(false);
  
  // State to track individual vs bulk expansion
  const [isIndividualExpanding, setIsIndividualExpanding] = useState(false);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [briefToDelete, setBriefToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Load epic data when activeEpicId changes
  useEffect(() => {
    const loadEpicData = async () => {
      if (!activeEpicId) {
        setActiveEpic(null);
        return;
      }

      setEpicLoading(true);
      try {
        const epic = await EpicsService.getEpic(activeEpicId);
        setActiveEpic(epic);
      } catch (error) {
        console.error('Failed to load epic data:', error);
        setActiveEpic(null);
      } finally {
        setEpicLoading(false);
      }
    };

    loadEpicData();
  }, [activeEpicId]);

  const handleExpand = async (brief: MagicBrief) => {
    setIsIndividualExpanding(true);
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
    } finally {
      setIsIndividualExpanding(false);
    }
  };

  // Separate function for bulk expansion (Expand All) - doesn't trigger individual expanding overlay
  const handleBulkExpand = async (brief: MagicBrief): Promise<void> => {
    try {
      const experience = await expandMagicBrief(brief);

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
      console.error('Failed to expand brief:', error);
      throw error; // Re-throw so ExpandAllDialog can handle it
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

  const handleRegenerate = async (updatedBrief: MagicBrief) => {
    // Refresh the briefs list to show the updated content
    await loadMagicBriefs();
    
    toast({
      title: 'Magic Brief Regenerated',
      description: 'The magic brief has been successfully regenerated with fresh content.',
    });
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
            High-quality, research-backed brand case study challenges ready to expand into full
            experiences. Generate 7 briefs sequentially to ensure comprehensive coverage of all
            learning outcomes with maximum quality per brief.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeEpic && activeEpic.outcomes && activeEpic.outcomes.length > 0 && (
            <CompactCoverageProgress
              epicOutcomes={activeEpic.outcomes}
              magicBriefs={savedBriefs}
              onBriefGenerated={loadMagicBriefs}
            />
          )}
          <ExpandAllButton
            briefs={savedBriefs}
            onExpand={handleBulkExpand}
            onSuccess={loadMagicBriefs}
            disabled={!activeEpicId || isExpanding}
          />
          <MagicCreateButton
            onMagicBriefsGenerated={handleMagicBriefsGenerated}
            disabled={!activeEpicId}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Expanding Overlay - Only show for individual expansions */}
      {isIndividualExpanding && (
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
        onRegenerate={handleRegenerate}
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
