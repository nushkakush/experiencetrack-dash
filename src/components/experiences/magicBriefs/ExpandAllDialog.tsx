import React, { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  Expand,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { MagicBrief } from '@/types/magicBrief';

interface ExpandAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  briefs: MagicBrief[];
  onExpand: (brief: MagicBrief) => Promise<void>;
}

interface ExpansionProgress {
  current: number;
  total: number;
  currentBrief?: string;
  completed: string[];
  failed: string[];
}

/**
 * Dialog for expanding all magic briefs with progress tracking
 * Reuses the same structure as MagicCreateDialog for consistency
 */
export const ExpandAllDialog: React.FC<ExpandAllDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  briefs,
  onExpand,
}) => {
  // Filter briefs based on expansion status
  const unexpandedBriefs = briefs.filter(brief => !brief.expanded);
  const expandedBriefs = briefs.filter(brief => brief.expanded);
  const allExpanded = briefs.length > 0 && unexpandedBriefs.length === 0;

  // Auto-check includeExpanded if all briefs are already expanded
  const [includeExpanded, setIncludeExpanded] = useState(allExpanded);
  const [expansionProgress, setExpansionProgress] =
    useState<ExpansionProgress | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const { toast } = useToast();

  // Update includeExpanded when dialog opens or briefs change
  React.useEffect(() => {
    if (open) {
      setIncludeExpanded(allExpanded);
    }
  }, [open, allExpanded]);

  // Calculate what will be expanded
  const briefsToExpand = includeExpanded ? briefs : unexpandedBriefs;
  const totalToExpand = briefsToExpand.length;

  const handleExpandAll = async () => {
    if (totalToExpand === 0) return;

    setIsExpanding(true);
    setExpansionProgress({
      current: 0,
      total: totalToExpand,
      completed: [],
      failed: [],
    });

    let successCount = 0;
    let failureCount = 0;

    try {
      // Process briefs sequentially to avoid overwhelming the API
      for (let i = 0; i < briefsToExpand.length; i++) {
        const brief = briefsToExpand[i];

        // Update progress to show current brief
        setExpansionProgress(prev =>
          prev
            ? {
                ...prev,
                current: i,
                currentBrief: brief.title,
              }
            : null
        );

        try {
          await onExpand(brief);
          successCount++;

          // Update progress with success
          setExpansionProgress(prev =>
            prev
              ? {
                  ...prev,
                  current: i + 1,
                  completed: [...prev.completed, brief.title],
                  currentBrief: undefined,
                }
              : null
          );

          // Small delay between expansions to prevent rate limiting
          if (i < briefsToExpand.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          failureCount++;
          console.error(`Failed to expand brief "${brief.title}":`, error);

          // Update progress with failure
          setExpansionProgress(prev =>
            prev
              ? {
                  ...prev,
                  current: i + 1,
                  failed: [...prev.failed, brief.title],
                  currentBrief: undefined,
                }
              : null
          );
        }
      }

      // Final success toast
      if (successCount > 0 && failureCount === 0) {
        toast({
          title: 'All Magic Briefs Expanded!',
          description: `Successfully expanded all ${successCount} magic briefs into full CBL experiences.`,
        });
      } else if (successCount > 0 && failureCount > 0) {
        toast({
          title: 'Partial Success',
          description: `Expanded ${successCount} briefs successfully. ${failureCount} failed.`,
          variant: 'destructive',
        });
      } else if (failureCount > 0) {
        toast({
          title: 'Expansion Failed',
          description: `Failed to expand all ${failureCount} briefs.`,
          variant: 'destructive',
        });
      }

      if (successCount > 0) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      let title = 'Expansion Failed';
      let description = 'Failed to expand magic briefs';

      if (error.message) {
        if (error.message.includes('quota exceeded')) {
          title = 'OpenAI Quota Exceeded';
          description =
            'Your OpenAI account has reached its usage limit. Please check your billing settings and add credits to continue using AI features.';
        } else if (error.message.includes('rate limit')) {
          title = 'Rate Limit Exceeded';
          description =
            'Too many requests to OpenAI. Please wait a moment and try again.';
        } else if (error.message.includes('API key')) {
          title = 'API Configuration Error';
          description =
            "There's an issue with the OpenAI API configuration. Please contact your administrator.";
        } else {
          description = error.message;
        }
      }

      toast({
        title,
        description,
        variant: 'destructive',
      });
    } finally {
      setIsExpanding(false);
      setExpansionProgress(null);
    }
  };

  const handleClose = () => {
    if (!isExpanding) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Expand className='h-5 w-5 text-blue-500' />
            {allExpanded
              ? 'Re-expand All Magic Briefs'
              : 'Expand All Magic Briefs'}
          </DialogTitle>
          <DialogDescription>
            {allExpanded
              ? 'Re-expand all magic briefs into full CBL experiences. This will regenerate the expanded content for all briefs.'
              : 'Expand all magic briefs into full CBL experiences with comprehensive learning content.'}{' '}
            Each brief will be processed sequentially to ensure quality and
            avoid system overload.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Briefs Summary */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Briefs to Expand:</span>
              <Badge variant='secondary' className='text-xs'>
                {totalToExpand} total
              </Badge>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-green-700'>Unexpanded:</span>
                <Badge
                  variant='outline'
                  className='text-green-700 border-green-300'
                >
                  {unexpandedBriefs.length}
                </Badge>
              </div>

              {expandedBriefs.length > 0 && (
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-amber-700'>Already Expanded:</span>
                  <Badge
                    variant='outline'
                    className='text-amber-700 border-amber-300'
                  >
                    {expandedBriefs.length}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Include Expanded Option */}
          {expandedBriefs.length > 0 && (
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='include-expanded'
                  checked={includeExpanded}
                  onCheckedChange={checked =>
                    setIncludeExpanded(checked as boolean)
                  }
                  disabled={isExpanding}
                />
                <Label
                  htmlFor='include-expanded'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  Also re-expand the {expandedBriefs.length} already expanded
                  brief{expandedBriefs.length !== 1 ? 's' : ''}
                </Label>
              </div>
            </div>
          )}

          {/* Cost Information */}
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              <strong>Estimated Cost:</strong> ~{totalToExpand} expansion credit
              {totalToExpand !== 1 ? 's' : ''}
              (${(totalToExpand * 0.02).toFixed(2)}) •<strong>Time:</strong> ~
              {Math.ceil(totalToExpand * 1.5)} minutes
            </AlertDescription>
          </Alert>

          {/* Progress Display */}
          {expansionProgress && (
            <div className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='font-medium'>Expanding magic briefs...</span>
                  <span className='font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded'>
                    {expansionProgress.total > 0
                      ? `${expansionProgress.current}/${expansionProgress.total}`
                      : `${expansionProgress.current} expanded`}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-3'>
                  <div
                    className='bg-blue-600 h-3 rounded-full transition-all duration-300'
                    style={{
                      width:
                        expansionProgress.total > 0
                          ? `${(expansionProgress.current / expansionProgress.total) * 100}%`
                          : '100%',
                    }}
                  />
                </div>
              </div>

              {/* Current Brief */}
              {expansionProgress.currentBrief && (
                <div className='space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                  <div className='text-sm font-medium text-blue-700 flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Currently expanding:
                  </div>
                  <div className='text-sm text-blue-600 break-words leading-relaxed'>
                    "{expansionProgress.currentBrief}"
                  </div>
                </div>
              )}

              {/* Status Summary */}
              {(expansionProgress.completed.length > 0 ||
                expansionProgress.failed.length > 0) && (
                <div className='grid grid-cols-2 gap-3'>
                  {/* Completed Briefs */}
                  {expansionProgress.completed.length > 0 && (
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-green-700 flex items-center gap-2'>
                        <CheckCircle className='h-4 w-4' />
                        Completed ({expansionProgress.completed.length})
                      </div>
                      <div className='max-h-20 overflow-y-auto space-y-1 border border-green-200 rounded bg-green-50 p-2'>
                        {expansionProgress.completed.map((title, index) => (
                          <div
                            key={index}
                            className='flex items-start gap-2 text-xs text-green-600'
                          >
                            <CheckCircle className='h-3 w-3 mt-0.5 flex-shrink-0' />
                            <span className='break-words leading-relaxed'>
                              {title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Briefs */}
                  {expansionProgress.failed.length > 0 && (
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-red-700 flex items-center gap-2'>
                        <XCircle className='h-4 w-4' />
                        Failed ({expansionProgress.failed.length})
                      </div>
                      <div className='max-h-20 overflow-y-auto space-y-1 border border-red-200 rounded bg-red-50 p-2'>
                        {expansionProgress.failed.map((title, index) => (
                          <div
                            key={index}
                            className='flex items-start gap-2 text-xs text-red-600'
                          >
                            <XCircle className='h-3 w-3 mt-0.5 flex-shrink-0' />
                            <span className='break-words leading-relaxed'>
                              {title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={isExpanding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExpandAll}
            disabled={isExpanding || totalToExpand === 0}
            className='bg-blue-600 hover:bg-blue-700'
          >
            {isExpanding ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Expanding Briefs...
              </>
            ) : (
              <>
                <Expand className='h-4 w-4 mr-2' />
                Expand {totalToExpand} Brief{totalToExpand !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
