import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCohorts } from '@/hooks/useCohorts';
import { useStudents } from '@/hooks/useStudents';
import { useEquipment } from '@/hooks/equipment/useEquipment';
import { useCreateBorrowing } from '@/hooks/equipment/useEquipment';
import { CreateBorrowingFormData } from '@/types/equipment';
import { CohortStudentSelection } from '@/components/equipment/components/CohortStudentSelection';
import { EquipmentSelection } from '@/components/equipment/components/EquipmentSelection';
import { BorrowingDetails } from '@/components/equipment/components/BorrowingDetails';
import { ReviewStep } from '@/components/equipment/components/ReviewStep';
import { IssuanceFormData } from '@/components/equipment/schemas/issuanceFormSchema';
import { Logo } from '@/components/ui/logo';

const PublicEquipmentIssuePage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<IssuanceFormData>({
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

  const formData = form.watch();
  const { cohorts } = useCohorts();
  const { data: students } = useStudents(formData.cohort_id);
  const { data: equipmentData } = useEquipment(1, 100, {
    availability_status: 'available',
  });
  const createBorrowing = useCreateBorrowing();

  const handleNext = () => {
    if (currentStep === 1 && !formData.cohort_id) {
      toast.error('Please select a cohort');
      return;
    }
    if (currentStep === 1 && !formData.student_id) {
      toast.error('Please select a student');
      return;
    }
    if (
      currentStep === 2 &&
      (!formData.equipment_ids || formData.equipment_ids.length === 0)
    ) {
      toast.error('Please select equipment');
      return;
    }
    if (currentStep === 3 && !formData.reason) {
      toast.error('Please provide a reason for borrowing');
      return;
    }
    if (currentStep === 3 && !formData.expected_return_date) {
      toast.error('Please select expected return date');
      return;
    }
    if (currentStep === 3 && !formData.expected_return_time) {
      toast.error('Please select expected return time');
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleRequestAnother = () => {
    setIsSubmitted(false);
    form.reset();
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (
      !formData.cohort_id ||
      !formData.student_id ||
      !formData.equipment_ids ||
      formData.equipment_ids.length === 0 ||
      !formData.expected_return_date ||
      !formData.reason
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For now, we'll only handle single equipment borrowing in the public page
    const borrowingData: CreateBorrowingFormData = {
      student_id: formData.student_id,
      equipment_ids: [formData.equipment_ids[0]], // Take the first selected equipment as array
      reason: formData.reason,
      expected_return_date: formData.expected_return_date,
      expected_return_time: formData.expected_return_time,
      notes: formData.notes || '',
    };

    try {
      await createBorrowing.mutateAsync(borrowingData);
      toast.success('Equipment issued successfully!');
      setIsSubmitted(true);
    } catch (error) {
      toast.error('Failed to issue equipment');
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className='min-h-screen bg-background py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <Logo size='lg' />
          </div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Issue Equipment from LIT School
          </h1>
          <p className='text-muted-foreground'>
            Borrow equipment from our inventory
          </p>
        </div>

        {/* Progress Steps */}
        <div className='flex justify-center mb-8'>
          <div className='flex items-center space-x-4'>
            {[1, 2, 3, 4].map(step => (
              <div key={step} className='flex items-center'>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    getStepStatus(step) === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : getStepStatus(step) === 'current'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {getStepStatus(step) === 'completed' ? (
                    <CheckCircle className='h-5 w-5' />
                  ) : (
                    <span className='font-semibold'>{step}</span>
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      getStepStatus(step) === 'completed'
                        ? 'bg-green-500'
                        : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Labels */}
        <div className='flex justify-center mb-8'>
          <div className='flex space-x-16'>
            <span
              className={`text-sm font-medium ${
                getStepStatus(1) === 'current'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Select Student
            </span>
            <span
              className={`text-sm font-medium ${
                getStepStatus(2) === 'current'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Select Equipment
            </span>
            <span
              className={`text-sm font-medium ${
                getStepStatus(3) === 'current'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Borrowing Details
            </span>
            <span
              className={`text-sm font-medium ${
                getStepStatus(4) === 'current'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Review & Submit
            </span>
          </div>
        </div>

        {/* Main Content */}
        {isSubmitted ? (
          <Card className='shadow-lg'>
            <CardContent className='p-6'>
              <div className='text-center space-y-6'>
                <div className='flex justify-center'>
                  <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                    <CheckCircle className='h-8 w-8 text-green-600' />
                  </div>
                </div>

                <div>
                  <h2 className='text-2xl font-bold text-foreground mb-2'>
                    Equipment Request Submitted!
                  </h2>
                  <p className='text-muted-foreground'>
                    Your equipment borrowing request has been successfully
                    submitted. You will receive a confirmation email shortly.
                  </p>
                </div>

                <div className='pt-4'>
                  <Button
                    onClick={handleRequestAnother}
                    className='w-full sm:w-auto'
                  >
                    <Package className='mr-2 h-4 w-4' />
                    Request Another Equipment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className='shadow-lg'>
            <CardContent className='p-6'>
              <FormProvider {...form}>
                {currentStep === 1 && (
                  <div className='space-y-6'>
                    <div>
                      <h2 className='text-xl font-semibold mb-4 text-foreground'>
                        Select Student
                      </h2>
                      <p className='text-muted-foreground mb-6'>
                        Choose your cohort and student to borrow equipment.
                      </p>
                    </div>

                    <CohortStudentSelection form={form} />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className='space-y-6'>
                    <div>
                      <h2 className='text-xl font-semibold mb-4 text-foreground'>
                        Select Equipment
                      </h2>
                      <p className='text-muted-foreground mb-6'>
                        Choose the equipment you want to borrow.
                      </p>
                    </div>

                    <EquipmentSelection
                      form={form}
                      equipment={equipmentData?.equipment || []}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className='space-y-6'>
                    <div>
                      <h2 className='text-xl font-semibold mb-4 text-foreground'>
                        Borrowing Details
                      </h2>
                      <p className='text-muted-foreground mb-6'>
                        Set the purpose and return date for your borrowing.
                      </p>
                    </div>

                    <BorrowingDetails form={form} />
                  </div>
                )}

                {currentStep === 4 && (
                  <div className='space-y-6'>
                    <div>
                      <h2 className='text-xl font-semibold mb-4 text-foreground'>
                        Review & Submit
                      </h2>
                      <p className='text-muted-foreground mb-6'>
                        Please review your borrowing details before submitting.
                      </p>
                    </div>

                    <ReviewStep form={form} />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className='flex justify-between mt-8'>
                  <Button
                    variant='outline'
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Back
                  </Button>

                  <div className='flex space-x-2'>
                    {currentStep < 4 ? (
                      <Button onClick={handleNext}>Next</Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={createBorrowing.isPending}
                      >
                        {createBorrowing.isPending
                          ? 'Submitting...'
                          : 'Submit Borrowing'}
                      </Button>
                    )}
                  </div>
                </div>
              </FormProvider>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className='text-center mt-8'>
          <p className='text-sm text-muted-foreground'>
            Need help? Contact the equipment management team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicEquipmentIssuePage;
