import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onClose?: () => void;
  isComplete?: boolean;
  isEditMode?: boolean;
  saving?: boolean;
  canProceed?: boolean;
  nextButtonText?: string;
  saveButtonText?: string;
  showProgressBar?: boolean;
  showNavigationButtons?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSave,
  onEdit,
  onCancelEdit,
  onClose,
  isComplete = false,
  isEditMode = false,
  saving = false,
  canProceed = true,
  nextButtonText = 'Next',
  saveButtonText = 'Save Configuration',
  showProgressBar = true,
  showNavigationButtons = true
}) => {
  const progressValue = (currentStep / steps.length) * 100;
  const isLastStep = currentStep === steps.length;
  const isFirstStep = currentStep === 1;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {showProgressBar && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            {steps.map((step) => (
              <span
                key={step.id}
                className={step.id <= currentStep ? 'text-primary font-medium' : ''}
              >
                {step.title}
              </span>
            ))}
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      )}

      {/* Navigation Buttons */}
      {showNavigationButtons && (
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {isComplete && !isEditMode ? (
              <>
                {onEdit && (
                  <Button variant="outline" onClick={onEdit}>
                    Edit Configuration
                  </Button>
                )}
                <Button onClick={onNext} disabled={!canProceed}>
                  {nextButtonText}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                {onClose && (
                  <Button onClick={onClose}>
                    Close
                  </Button>
                )}
              </>
            ) : isEditMode ? (
              <>
                {onCancelEdit && (
                  <Button variant="outline" onClick={onCancelEdit}>
                    Cancel Edit
                  </Button>
                )}
                {isLastStep ? (
                  onSave && (
                    <Button onClick={onSave} disabled={saving || !canProceed}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )
                ) : (
                  <Button onClick={onNext} disabled={!canProceed}>
                    {nextButtonText}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </>
            ) : isLastStep ? (
              onSave && (
                <Button onClick={onSave} disabled={saving || !canProceed}>
                  {saving ? 'Saving...' : saveButtonText}
                </Button>
              )
            ) : (
              <Button onClick={onNext} disabled={!canProceed}>
                {nextButtonText}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
