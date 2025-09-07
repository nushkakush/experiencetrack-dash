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
  const [numberOfBriefs, setNumberOfBriefs] = useState<number>(7);
  const [generationProgress, setGenerationProgress] = useState<{current: number, total: number} | null>(null);
  const { generateMagicBriefs, isGenerating } = useMagicBriefGeneration();
  const { isValid, error, isLoading } = useEpicValidation();
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setGenerationProgress({ current: 0, total: numberOfBriefs }); // Initialize with the correct total
      await generateMagicBriefs(numberOfBriefs, setGenerationProgress);

      toast({
        title: 'Magic Briefs Generated!',
        description: `${numberOfBriefs} high-quality business challenges created with 100% learning outcome coverage.`,
      });

      onSuccess();
      onOpenChange(false);
      setGenerationProgress(null);
    } catch (error) {
      let title = 'Generation Failed';
      let description = 'Failed to generate magic briefs';
      
      if (error.message) {
        if (error.message.includes('quota exceeded')) {
          title = 'OpenAI Quota Exceeded';
          description = 'Your OpenAI account has reached its usage limit. Please check your billing settings and add credits to continue using AI features.';
        } else if (error.message.includes('rate limit')) {
          title = 'Rate Limit Exceeded';
          description = 'Too many requests to OpenAI. Please wait a moment and try again.';
        } else if (error.message.includes('API key')) {
          title = 'API Configuration Error';
          description = 'There\'s an issue with the OpenAI API configuration. Please contact your administrator.';
        } else if (error.message.includes('too long')) {
          title = 'Content Too Long';
          description = 'The request content is too long for the AI model. Try reducing the number of learning outcomes or simplifying the content.';
        } else {
          description = error.message;
        }
      }
      
      toast({
        title,
        description,
        variant: 'destructive',
      });
      setGenerationProgress(null);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Generate Magic Briefs</DialogTitle>
          <DialogDescription>
            Generate high-quality business case study challenges with guaranteed 100% coverage
            of all learning outcomes. The system will create exactly the number of briefs you
            specify, intelligently distributing all learning outcomes across them.
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
            <Label htmlFor='number-of-briefs'>Number of Briefs</Label>
            <Input
              id='number-of-briefs'
              type='number'
              min='1'
              max='20'
              value={numberOfBriefs}
              onChange={(e) => setNumberOfBriefs(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              placeholder='Enter number of briefs (1-20)'
              disabled={isGenerating || !isValid}
            />
            <p className='text-sm text-muted-foreground'>
              AI will generate exactly {numberOfBriefs} briefs with 100% coverage of all learning outcomes
              intelligently distributed across them.
            </p>
          </div>

          {/* Progress Display */}
          {generationProgress && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Generating {numberOfBriefs} briefs with full coverage...</span>
                <span>
                  {generationProgress.total > 0 
                    ? `${generationProgress.current}/${generationProgress.total}`
                    : `${generationProgress.current} generated`
                  }
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div 
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ 
                    width: generationProgress.total > 0 
                      ? `${(generationProgress.current / generationProgress.total) * 100}%`
                      : '100%'
                  }}
                />
              </div>
            </div>
          )}
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
                Generating Briefs with Full Coverage...
              </>
            ) : (
              `Generate ${numberOfBriefs} Magic Briefs`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
