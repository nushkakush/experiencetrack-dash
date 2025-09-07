import React, { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MagicCreateDialog } from './MagicCreateDialog';
import { useEpicValidation } from '@/hooks/useMagicBriefs';

interface MagicCreateButtonProps {
  onMagicBriefsGenerated: () => void;
  disabled?: boolean;
}

/**
 * Simple dropdown button that opens the magic create dialog
 * Keeps the main button component lightweight
 */
export const MagicCreateButton: React.FC<MagicCreateButtonProps> = ({
  onMagicBriefsGenerated,
  disabled = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isValid, isLoading } = useEpicValidation();

  const handleCBLCreate = () => {
    setDialogOpen(true);
  };

  const isDisabled = disabled || !isValid || isLoading;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isDisabled} className='flex items-center gap-2'>
            <Sparkles className='h-4 w-4' />
            Magic Create
            <ChevronDown className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={handleCBLCreate} disabled={isDisabled}>
            <div className='flex flex-col'>
              <span className='font-medium'>Magic Briefs</span>
              <span className='text-sm text-muted-foreground'>
                Generate 7 high-quality brand challenges
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MagicCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onMagicBriefsGenerated}
      />
    </>
  );
};
