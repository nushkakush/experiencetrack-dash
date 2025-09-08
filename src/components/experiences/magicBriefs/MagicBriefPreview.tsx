import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Expand,
  X,
  ExternalLink,
  Globe,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import type { MagicBrief } from '@/types/magicBrief';
import { formatSources, formatSourcesList } from '@/utils/sourceFormatting';
import { RawResponseViewer } from './RawResponseViewer';
import { CopyButton } from '@/components/ui/copy-button';
import { MagicBriefsService } from '@/services/magicBriefs.service';
import { useMagicBriefRegeneration } from '@/hooks/useMagicBriefs';
import { toast } from 'sonner';

interface MagicBriefPreviewProps {
  brief: MagicBrief | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpand: (brief: MagicBrief) => void;
  onRegenerate?: (updatedBrief: MagicBrief) => void;
}

/**
 * Preview dialog for magic briefs
 * Shows full content and expand option
 */
export const MagicBriefPreview: React.FC<MagicBriefPreviewProps> = ({
  brief,
  open,
  onOpenChange,
  onExpand,
  onRegenerate,
}) => {
  const [rawResponseFromLogs, setRawResponseFromLogs] = useState<any>(null);
  const [isLoadingRawResponse, setIsLoadingRawResponse] = useState(false);
  const { regenerateMagicBrief, isRegenerating } = useMagicBriefRegeneration();

  const fetchRawResponseFromLogs = async () => {
    if (!brief) return;

    setIsLoadingRawResponse(true);
    try {
      const rawResponse = await MagicBriefsService.getRawResponseFromLogs(
        brief.id
      );
      setRawResponseFromLogs(rawResponse);
    } catch (error) {
      console.warn('Failed to fetch raw response from logs:', error);
    } finally {
      setIsLoadingRawResponse(false);
    }
  };

  // Fetch raw response from logs if not available in brief
  useEffect(() => {
    if (brief && !brief.rawResponse && open) {
      fetchRawResponseFromLogs();
    }
  }, [brief, open, fetchRawResponseFromLogs]);

  if (!brief) return null;

  // Use rawResponse from brief if available, otherwise use the one from logs
  const effectiveRawResponse = brief.rawResponse || rawResponseFromLogs;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExpand = () => {
    onExpand(brief);
    onOpenChange(false);
  };

  const handleRegenerate = async () => {
    try {
      toast.loading('Regenerating magic brief...', { id: 'regenerate-brief' });

      const updatedBrief = await regenerateMagicBrief(brief);

      toast.success('Magic brief regenerated successfully!', {
        id: 'regenerate-brief',
      });

      // Notify parent component about the update
      if (onRegenerate) {
        onRegenerate(updatedBrief);
      }
    } catch (error) {
      console.error('Failed to regenerate magic brief:', error);
      toast.error(error.message || 'Failed to regenerate magic brief', {
        id: 'regenerate-brief',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[85vh] w-[95vw]'>
        <DialogHeader>
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <DialogTitle className='text-xl break-words'>
                {brief.title}
              </DialogTitle>
              <div className='flex items-center gap-4 mt-2'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <Building2 className='h-4 w-4' />
                  <span className='font-medium'>{brief.brand_name}</span>
                </div>
                <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                  <Calendar className='h-4 w-4' />
                  {formatDate(brief.created_at)}
                </div>
                {brief.expanded && <Badge variant='secondary'>Expanded</Badge>}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className='flex items-center gap-2'
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className='h-4 w-4 animate-spin' />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RotateCcw className='h-4 w-4' />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className='max-h-[55vh]'>
          <div className='space-y-6 pr-2'>
            <div>
              <h3 className='font-semibold mb-2'>Challenge Statement</h3>
              <div className='text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere'>
                {formatSources(brief.challenge_statement, brief.citations)}
              </div>
              {formatSourcesList(brief.challenge_statement)}
            </div>

            <div>
              <h3 className='font-semibold mb-2'>
                Connected Learning Outcomes
              </h3>
              <div className='space-y-1'>
                {brief.connected_learning_outcomes.map((outcome, index) => (
                  <div
                    key={index}
                    className='text-sm text-muted-foreground flex items-start gap-2'
                  >
                    <span className='text-primary font-medium flex-shrink-0'>
                      •
                    </span>
                    <span className='break-words overflow-wrap-anywhere'>
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className='font-semibold mb-2'>Skill Focus</h3>
              <div className='text-sm text-muted-foreground break-words overflow-wrap-anywhere'>
                {brief.skill_focus}
              </div>
            </div>

            <div>
              <h3 className='font-semibold mb-2'>Prerequisite Skills</h3>
              <div className='text-sm text-muted-foreground break-words overflow-wrap-anywhere'>
                {formatSources(brief.prerequisite_skills, brief.citations)}
              </div>
              {formatSourcesList(brief.prerequisite_skills)}
            </div>

            <div>
              <h3 className='font-semibold mb-2'>Skill Compounding</h3>
              <div className='text-sm text-muted-foreground break-words overflow-wrap-anywhere'>
                {formatSources(brief.skill_compounding, brief.citations)}
              </div>
              {formatSourcesList(brief.skill_compounding)}
            </div>

            {/* Perplexity Citations Section */}
            {brief.citations && brief.citations.length > 0 && (
              <div>
                <h3 className='font-semibold mb-3 flex items-center gap-2'>
                  <Globe className='h-4 w-4' />
                  Research Sources ({brief.citations.length})
                </h3>
                <div className='space-y-2'>
                  {brief.citations.slice(0, 5).map(citation => (
                    <Card
                      key={citation.index}
                      className='border-l-4 border-l-primary/30 cursor-pointer hover:shadow-md hover:border-l-primary/60 transition-all duration-200 group'
                      onClick={() =>
                        window.open(
                          citation.url,
                          '_blank',
                          'noopener,noreferrer'
                        )
                      }
                    >
                      <CardContent className='p-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <Badge variant='outline' className='text-xs'>
                                [{citation.index}]
                              </Badge>
                              {citation.domain && (
                                <Badge variant='secondary' className='text-xs'>
                                  {citation.domain}
                                </Badge>
                              )}
                            </div>
                            <h4 className='font-medium text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors'>
                              {citation.title}
                            </h4>
                            {citation.snippet && (
                              <p className='text-xs text-muted-foreground line-clamp-2 mb-2'>
                                {citation.snippet}
                              </p>
                            )}
                            <div className='text-xs text-muted-foreground truncate group-hover:text-primary/80 transition-colors'>
                              {citation.url}
                            </div>
                          </div>
                          <div className='flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <ExternalLink className='h-4 w-4 text-primary' />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {brief.citations.length > 5 && (
                    <div className='text-xs text-muted-foreground text-center py-2'>
                      +{brief.citations.length - 5} more sources
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className='flex justify-between items-center pt-4 border-t'>
          <div className='text-sm text-muted-foreground'>
            {brief.expanded
              ? 'This brief has been expanded. Click to expand again with new variations.'
              : 'Click expand to generate a complete CBL experience'}
          </div>

          <div className='flex gap-2'>
            {effectiveRawResponse && (
              <CopyButton
                data={effectiveRawResponse}
                label='Copy Raw Data'
                successMessage='Raw response copied to clipboard!'
                errorMessage='Failed to copy raw response'
                size='sm'
              />
            )}
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleExpand}>
              <Expand className='h-4 w-4 mr-2' />
              {brief.expanded ? 'Expand Again' : 'Expand to CBL'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
