import React, { useState } from 'react';
import { Expand, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpandAllDialog } from './ExpandAllDialog';
import type { MagicBrief } from '@/types/magicBrief';

interface ExpandAllButtonProps {
  briefs: MagicBrief[];
  onExpand: (brief: MagicBrief) => Promise<void>;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Button to expand all magic briefs at once
 * Provides options for handling already expanded briefs
 */
export const ExpandAllButton: React.FC<ExpandAllButtonProps> = ({
  briefs,
  onExpand,
  onSuccess,
  disabled = false,
  className = '',
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter briefs based on expansion status
  const unexpandedBriefs = briefs.filter(brief => !brief.expanded);
  const expandedBriefs = briefs.filter(brief => brief.expanded);

  // Calculate what will be expanded (default to unexpanded, but dialog allows including expanded)
  const totalToExpand = unexpandedBriefs.length;
  const allExpanded = briefs.length > 0 && totalToExpand === 0;

  // Don't show button if no briefs at all
  if (briefs.length === 0) {
    return null;
  }

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className={`${className} border-dashed border-blue-300 text-blue-700 hover:bg-blue-50`}
        disabled={disabled}
        onClick={() => setIsDialogOpen(true)}
      >
        <Expand className='h-4 w-4 mr-2' />
        {allExpanded ? 'Re-expand All' : 'Expand All'}
        <Badge variant='secondary' className='ml-2 text-xs'>
          {allExpanded ? expandedBriefs.length : totalToExpand}
        </Badge>
      </Button>

      <ExpandAllDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
        briefs={briefs}
        onExpand={onExpand}
      />
    </>
  );
};
