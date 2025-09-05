import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ApplicationConfigurationService } from '@/services/applicationConfiguration.service';
import { ApplicationConfiguration, FormQuestion } from '@/types/applications';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { FormBuilder } from './FormBuilder';
import { QuestionEditor } from './QuestionEditor';
import {
  DollarSign,
  FileText,
  Settings,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Users,
  FormInput,
} from 'lucide-react';

interface ApplicationConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortName?: string;
  onSetupComplete?: () => void;
}

export const ApplicationConfigurationModal: React.FC<
  ApplicationConfigurationModalProps
> = ({
  open,
  onOpenChange,
  cohortId,
  cohortName = 'Cohort',
  onSetupComplete,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configuration, setConfiguration] =
    useState<ApplicationConfiguration | null>(null);
  const [applicationFee, setApplicationFee] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<FormQuestion | null>(
    null
  );
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  const { canSetupApplicationConfiguration } = useFeaturePermissions();

  // Define steps for the stepper
  const steps = [
    {
      id: 1,
      title: 'Application Fee',
      description: 'Set the application fee amount',
      icon: DollarSign,
      completed: false,
    },
    {
      id: 2,
      title: 'Form Builder',
      description: 'Create application form questions',
      icon: FormInput,
      completed: false,
    },
    {
      id: 3,
      title: 'Review & Complete',
      description: 'Review configuration and complete setup',
      icon: CheckCircle,
      completed: false,
    },
  ];

  // Load existing configuration when modal opens
  useEffect(() => {
    if (open && cohortId) {
      loadConfiguration();
    }
  }, [open, cohortId]);

  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
    }
  }, [open]);

  // Update step completion status
  const updateStepCompletion = () => {
    const updatedSteps = steps.map(step => {
      switch (step.id) {
        case 1:
          return { ...step, completed: applicationFee >= 0 };
        case 2:
          return { ...step, completed: questions.length > 0 };
        case 3:
          return {
            ...step,
            completed: configuration?.is_setup_complete || false,
          };
        default:
          return step;
      }
    });
    return updatedSteps;
  };

  const completedSteps = updateStepCompletion();

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  // Handle questions change
  const handleQuestionsChange = (newQuestions: FormQuestion[]) => {
    setQuestions(newQuestions);
  };

  // Handle question edit
  const handleEditQuestion = (question: FormQuestion) => {
    setSelectedQuestion(question);
    setIsEditingQuestion(true);
  };

  // Handle question save
  const handleQuestionSave = (updatedQuestion: FormQuestion) => {
    const updatedQuestions = questions.map(q =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setQuestions(updatedQuestions);
    setIsEditingQuestion(false);
    setSelectedQuestion(null);
  };

  // Handle form save
  const handleFormSave = async () => {
    setIsSavingQuestions(true);
    try {
      // Questions are already saved individually, just show success
      toast.success('Form saved successfully');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const { configuration: existingConfig } =
        await ApplicationConfigurationService.getCompleteConfiguration(
          cohortId
        );

      if (existingConfig) {
        setConfiguration(existingConfig);
        setApplicationFee(existingConfig.application_fee);
        setQuestions(existingConfig.questions || []);
      } else {
        // No configuration exists, start with defaults
        setApplicationFee(0);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error loading application configuration:', error);
      toast.error('Failed to load application configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFeeConfiguration = async () => {
    if (!canSetupApplicationConfiguration) {
      toast.error(
        'You do not have permission to configure application settings'
      );
      return;
    }

    setIsSaving(true);
    try {
      let savedConfig: ApplicationConfiguration | null = null;

      if (configuration) {
        // Update existing configuration
        savedConfig = await ApplicationConfigurationService.upsertConfiguration(
          {
            id: configuration.id,
            application_fee: applicationFee,
          }
        );
      } else {
        // Create new configuration
        savedConfig = await ApplicationConfigurationService.upsertConfiguration(
          {
            cohort_id: cohortId,
            application_fee: applicationFee,
            is_setup_complete: false, // Will be marked complete when form is also configured
          }
        );
      }

      if (savedConfig) {
        setConfiguration(savedConfig);
        toast.success('Application fee configuration saved successfully');
        // Automatically proceed to next step
        goToNextStep();
      } else {
        toast.error('Failed to save application fee configuration');
      }
    } catch (error) {
      console.error('Error saving fee configuration:', error);
      toast.error('Failed to save application fee configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!configuration) {
      toast.error('Please save the fee configuration first');
      return;
    }

    if (!canSetupApplicationConfiguration) {
      toast.error('You do not have permission to complete application setup');
      return;
    }

    setIsSaving(true);
    try {
      const success =
        await ApplicationConfigurationService.markConfigurationComplete(
          cohortId
        );

      if (success) {
        toast.success('Application configuration completed successfully');
        onSetupComplete?.();
      } else {
        toast.error('Failed to complete application setup');
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete application setup');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = canSetupApplicationConfiguration;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Application Configuration - {cohortName}
          </DialogTitle>
          <DialogDescription>
            Configure application fees and form questions for this cohort.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex-1 space-y-4 p-6'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-8 w-full' />
          </div>
        ) : (
          <div className='flex-1 overflow-hidden flex flex-col'>
            {/* Stepper Header */}
            <div className='border-b p-6'>
              <div className='flex items-center justify-between'>
                {completedSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = step.completed;
                  const isClickable = step.id <= currentStep || step.completed;

                  return (
                    <div key={step.id} className='flex items-center'>
                      <div className='flex flex-col items-center'>
                        <button
                          onClick={() => isClickable && goToStep(step.id)}
                          disabled={!isClickable}
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : isActive
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'bg-gray-100 border-gray-300 text-gray-500'
                          } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                        >
                          {isCompleted ? (
                            <CheckCircle className='h-5 w-5' />
                          ) : (
                            <Icon className='h-5 w-5' />
                          )}
                        </button>
                        <div className='mt-2 text-center'>
                          <p
                            className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                          >
                            {step.title}
                          </p>
                          <p className='text-xs text-gray-400'>
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < completedSteps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-4 ${
                            completedSteps[index + 1].completed
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className='flex-1 overflow-auto p-6'>
              {currentStep === 1 && (
                <div className='space-y-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='application-fee'>Application Fee (₹)</Label>
                    <Input
                      id='application-fee'
                      type='number'
                      min='0'
                      step='0.01'
                      value={applicationFee}
                      onChange={e =>
                        setApplicationFee(parseFloat(e.target.value) || 0)
                      }
                      disabled={!canEdit}
                      placeholder='Enter application fee amount'
                      className='text-lg'
                    />
                    <p className='text-sm text-muted-foreground'>
                      This fee will be charged to students when they submit
                      their applications.
                    </p>
                  </div>

                  {applicationFee > 0 && (
                    <div className='bg-blue-50 p-4 rounded-lg'>
                      <p className='text-sm text-blue-800'>
                        <strong>Fee Preview:</strong> Students will be required
                        to pay ₹{applicationFee} when submitting their
                        application.
                      </p>
                    </div>
                  )}

                  {applicationFee === 0 && (
                    <div className='bg-green-50 p-4 rounded-lg'>
                      <p className='text-sm text-green-800'>
                        <strong>Free Application:</strong> Students can submit
                        applications without any fee.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className='space-y-6'>
                  {!configuration ? (
                    <div className='flex items-center justify-center h-64'>
                      <div className='text-center space-y-4'>
                        <FileText className='h-16 w-16 mx-auto text-muted-foreground' />
                        <h3 className='text-lg font-semibold'>
                          Complete Fee Configuration First
                        </h3>
                        <p className='text-muted-foreground max-w-md'>
                          Please complete the application fee configuration
                          before building the form.
                        </p>
                        <Badge
                          variant='outline'
                          className='text-orange-600 border-orange-200'
                        >
                          Fee configuration required
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <FormBuilder
                      configurationId={configuration.id}
                      questions={questions}
                      onQuestionsChange={handleQuestionsChange}
                      onEditQuestion={handleEditQuestion}
                      onSave={handleFormSave}
                      isSaving={isSavingQuestions}
                    />
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-4 border rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <DollarSign className='h-5 w-5 text-green-600' />
                        <div>
                          <p className='font-medium'>Application Fee</p>
                          <p className='text-sm text-muted-foreground'>
                            {applicationFee > 0 ? `₹${applicationFee}` : 'Free'}
                          </p>
                        </div>
                      </div>
                      <Badge variant='outline' className='text-green-600'>
                        Configured
                      </Badge>
                    </div>

                    <div className='flex items-center justify-between p-4 border rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <FormInput className='h-5 w-5 text-orange-500' />
                        <div>
                          <p className='font-medium'>Form Questions</p>
                          <p className='text-sm text-muted-foreground'>
                            {questions.length} questions configured
                          </p>
                        </div>
                      </div>
                      <Badge variant='outline' className='text-orange-600'>
                        {questions.length > 0 ? 'Configured' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <p className='text-sm text-blue-800'>
                      <strong>Note:</strong> You can always come back to modify
                      these settings later. Once completed, students will be
                      able to submit applications for this cohort.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step Navigation */}
            <div className='flex justify-between items-center p-6 border-t'>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>

              <div className='flex gap-2'>
                {currentStep > 1 && (
                  <Button
                    variant='outline'
                    onClick={goToPreviousStep}
                    className='flex items-center gap-2'
                  >
                    <ArrowLeft className='h-4 w-4' />
                    Previous
                  </Button>
                )}

                {currentStep === 1 && canEdit && (
                  <Button
                    onClick={handleSaveFeeConfiguration}
                    disabled={isSaving}
                    className='flex items-center gap-2'
                  >
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                    <ArrowRight className='h-4 w-4' />
                  </Button>
                )}

                {currentStep === 2 && (
                  <Button
                    onClick={goToNextStep}
                    className='flex items-center gap-2'
                  >
                    Continue
                    <ArrowRight className='h-4 w-4' />
                  </Button>
                )}

                {currentStep === 3 && canEdit && (
                  <Button
                    onClick={handleCompleteSetup}
                    disabled={isSaving}
                    className='bg-green-600 hover:bg-green-700 flex items-center gap-2'
                  >
                    {isSaving ? 'Completing...' : 'Complete Setup'}
                    <CheckCircle className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Question Editor Modal */}
        <QuestionEditor
          question={selectedQuestion}
          isOpen={isEditingQuestion}
          onClose={() => {
            setIsEditingQuestion(false);
            setSelectedQuestion(null);
          }}
          onSave={handleQuestionSave}
          isSaving={isSavingQuestions}
        />
      </DialogContent>
    </Dialog>
  );
};
