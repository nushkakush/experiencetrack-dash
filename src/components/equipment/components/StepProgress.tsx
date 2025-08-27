import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className='flex items-center justify-between mb-6'>
      {steps.map((step, index) => (
        <div key={step.id} className='flex items-center'>
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2',
              index <= currentStep
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground text-muted-foreground'
            )}
          >
            {index < currentStep ? (
              <Check className='w-4 h-4' />
            ) : (
              <span className='text-sm font-medium'>{index + 1}</span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-2',
                index < currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
