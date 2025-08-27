import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { useCreateBorrowing } from '@/hooks/equipment/useEquipment';
import {
  issuanceFormSchema,
  IssuanceFormData,
} from './schemas/issuanceFormSchema';
import {
  CohortStudentSelection,
  EquipmentSelection,
  BorrowingDetails,
  ReviewStep,
  StepProgress,
} from './components';

interface IssueEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    id: 'cohort-student',
    title: 'Select Cohort & Student',
    description: 'Choose the cohort and student',
  },
  {
    id: 'equipment',
    title: 'Select Equipment',
    description: 'Choose equipment to issue',
  },
  {
    id: 'details',
    title: 'Purpose & Return Date',
    description: 'Provide purpose and return details',
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review and confirm issuance',
  },
];

export const IssueEquipmentDialog: React.FC<IssueEquipmentDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<IssuanceFormData>({
    resolver: zodResolver(issuanceFormSchema),
    defaultValues: {
      cohort_id: '',
      student_id: '',
      equipment_ids: [],
      reason: '',
      expected_return_date: '',
      expected_return_time: '',
      notes: '',
    },
  });

  const createBorrowing = useCreateBorrowing();

  const watchedCohortId = form.watch('cohort_id');
  const watchedStudentId = form.watch('student_id');

  // Reset student when cohort changes
  useEffect(() => {
    if (watchedCohortId) {
      form.setValue('student_id', '');
    }
  }, [watchedCohortId, form]);

  const handleNext = async () => {
    // Validate only the current step's fields
    let isValid = false;

    switch (currentStep) {
      case 0: // Cohort & Student Selection
        isValid = await form.trigger(['cohort_id', 'student_id']);
        break;
      case 1: // Equipment Selection
        isValid = await form.trigger('equipment_ids');
        break;
      case 2: // Purpose & Return Date
        isValid = await form.trigger([
          'reason',
          'expected_return_date',
          'expected_return_time',
        ]);
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: IssuanceFormData) => {
    try {
      await createBorrowing.mutateAsync(data);
      form.reset();
      setCurrentStep(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to issue equipment:', error);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    console.log('Form submission prevented - this should not happen');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Cohort & Student Selection
        return <CohortStudentSelection form={form} />;
      case 1: // Equipment Selection
        return <EquipmentSelection form={form} />;
      case 2: // Purpose & Return Date
        return <BorrowingDetails form={form} />;
      case 3: // Review
        return <ReviewStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Issue Equipment</DialogTitle>
          <DialogDescription>
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <StepProgress steps={steps} currentStep={currentStep} />

        <Form {...form}>
          <form className='space-y-6' noValidate onSubmit={handleFormSubmit}>
            {renderStepContent()}

            <div className='flex justify-between pt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className='w-4 h-4 mr-2' />
                Previous
              </Button>

              <div className='flex gap-2'>
                {currentStep < steps.length - 1 ? (
                  <Button type='button' onClick={handleNext}>
                    Next
                    <ChevronRight className='w-4 h-4 ml-2' />
                  </Button>
                ) : (
                  <Button
                    type='button'
                    disabled={createBorrowing.isPending}
                    onClick={form.handleSubmit(handleSubmit)}
                  >
                    {createBorrowing.isPending
                      ? 'Issuing...'
                      : 'Issue Equipment'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
