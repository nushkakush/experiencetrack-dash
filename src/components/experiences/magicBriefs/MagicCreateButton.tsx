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
  disabled = false
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCBLCreate = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={disabled} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Magic Create
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCBLCreate}>
            <div className="flex flex-col">
              <span className="font-medium">CBL Experience</span>
              <span className="text-sm text-muted-foreground">
                Generate brand case study challenges
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
