import React from 'react';
import { Building2, Calendar, Expand, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MagicBrief } from '@/types/magicBrief';
import { formatSources, formatSourcesList } from '@/utils/sourceFormatting';

interface MagicBriefPreviewProps {
  brief: MagicBrief | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpand: (brief: MagicBrief) => void;
}

/**
 * Preview dialog for magic briefs
 * Shows full content and expand option
 */
export const MagicBriefPreview: React.FC<MagicBriefPreviewProps> = ({
  brief,
  open,
  onOpenChange,
  onExpand
}) => {
  if (!brief) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExpand = () => {
    onExpand(brief);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between pr-6">
            <div className="flex-1">
              <DialogTitle className="text-xl pr-4">
                {brief.title}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{brief.brand_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  {formatDate(brief.created_at)}
                </div>
                {brief.expanded && (
                  <Badge variant="secondary">
                    Expanded
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Challenge Statement</h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {formatSources(brief.challenge_statement)}
              </div>
              {formatSourcesList(brief.challenge_statement)}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Connected Learning Outcomes</h3>
              <div className="space-y-1">
                {brief.connected_learning_outcomes.map((outcome, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-medium">•</span>
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Skill Focus</h3>
              <div className="text-sm text-muted-foreground">
                {brief.skill_focus}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Prerequisite Skills</h3>
              <div className="text-sm text-muted-foreground">
                {formatSources(brief.prerequisite_skills)}
              </div>
              {formatSourcesList(brief.prerequisite_skills)}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Skill Compounding</h3>
              <div className="text-sm text-muted-foreground">
                {formatSources(brief.skill_compounding)}
              </div>
              {formatSourcesList(brief.skill_compounding)}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {brief.expanded ? 
              'This brief has been expanded. Click to expand again with new variations.' : 
              'Click expand to generate a complete CBL experience'
            }
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleExpand}
            >
              <Expand className="h-4 w-4 mr-2" />
              {brief.expanded ? 'Expand Again' : 'Expand to CBL'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
