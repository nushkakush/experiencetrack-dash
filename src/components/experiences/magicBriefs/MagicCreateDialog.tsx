import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChipInput } from '@/components/ui/chip-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  useMagicBriefGeneration,
  useEpicValidation,
} from '@/hooks/useMagicBriefs';

interface MagicCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Dialog for configuring magic brief generation
 * Handles user input and triggers generation
 */
export const MagicCreateDialog: React.FC<MagicCreateDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [challengeCount, setChallengeCount] = useState(5);
  const { generateMagicBriefs, isGenerating } = useMagicBriefGeneration();
  const { isValid, error, isLoading } = useEpicValidation();
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      await generateMagicBriefs(
        brandNames.length > 0 ? brandNames : undefined,
        challengeCount
      );

      toast({
        title: 'Magic Briefs Generated!',
        description: `${challengeCount} brand challenges have been created successfully.`,
      });

      onSuccess();
      onOpenChange(false);
      setBrandNames([]);
      setChallengeCount(5);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate magic briefs',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
      setBrandNames([]);
      setChallengeCount(5);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Generate Magic Briefs</DialogTitle>
          <DialogDescription>
            Generate brand case study challenges based on the active epic's
            learning outcomes.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Validation Alert */}
          {!isLoading && !isValid && error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <Alert>
              <Loader2 className='h-4 w-4 animate-spin' />
              <AlertDescription>Checking epic validation...</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='challenge-count'>Number of Challenges</Label>
            <Input
              id='challenge-count'
              type='number'
              min='1'
              max='10'
              value={challengeCount}
              onChange={e => setChallengeCount(parseInt(e.target.value) || 5)}
              disabled={isGenerating || !isValid}
            />
            <p className='text-sm text-muted-foreground'>
              Choose how many challenge statements to generate (1-10).
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='brand-names'>Brand Names (Optional)</Label>
            <ChipInput
              value={brandNames}
              onChange={setBrandNames}
              placeholder='Type brand names and press comma...'
              disabled={isGenerating || !isValid}
            />
            <p className='text-sm text-muted-foreground'>
              {brandNames.length > 0
                ? `You've specified ${brandNames.length} brand(s). AI will choose additional brands to reach ${challengeCount} total challenges.`
                : `Leave empty to let AI choose all ${challengeCount} relevant brands automatically.`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !isValid || isLoading}
          >
            {isGenerating ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Generating...
              </>
            ) : (
              'Generate Briefs'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
