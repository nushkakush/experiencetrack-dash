import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Save } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ExperiencesService } from '@/services/experiences.service';
import { BulletedInput } from '@/components/ui/bulleted-input';
import { ExperienceTypeForms } from '@/components/experiences/ExperienceTypeForms';
import {
  WYSIWYGEditor,
  DeliverableBuilder,
  GradingRubricBuilder,
  ConditionBuilder,
  LectureModuleBuilder,
  SampleProfilesBuilder,
} from '@/components/experiences';
import type {
  CreateExperienceRequest,
  Experience,
  ExperienceType,
} from '@/types/experience';
import { EXPERIENCE_TYPES } from '@/types/experience';
import { useActiveEpic } from '@/contexts/ActiveEpicContext';

interface ExperienceStepperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExperienceSaved: () => void;
  existingExperience?: Experience | null;
}

export const ExperienceStepperDialog: React.FC<
  ExperienceStepperDialogProps
> = ({ open, onOpenChange, onExperienceSaved, existingExperience = null }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<
    CreateExperienceRequest & { id?: string }
  >({
    id: existingExperience?.id,
    title: existingExperience?.title || '',
    learning_outcomes: existingExperience?.learning_outcomes || [],
    type: existingExperience?.type || 'CBL',
    challenge: existingExperience?.challenge || '',
    deliverables: existingExperience?.deliverables || [],
    grading_rubric: existingExperience?.grading_rubric || [],
    pass_conditions: existingExperience?.pass_conditions,
    distinction_conditions: existingExperience?.distinction_conditions,
    lecture_sessions: existingExperience?.lecture_sessions || [],
    sample_brand_profiles: existingExperience?.sample_brand_profiles || [],
    sample_mentor_profiles: existingExperience?.sample_mentor_profiles || [],
    sample_judge_profiles: existingExperience?.sample_judge_profiles || [],
  });

  const { toast } = useToast();
  const { activeEpicId } = useActiveEpic();
  const isEditMode = !!existingExperience;

  const getStepsForType = (type: ExperienceType) => {
    const baseSteps = [
      {
        id: 1,
        title: 'Basic Information',
        description: 'Title, outcomes, and experience type',
      },
    ];

    switch (type) {
      case 'CBL':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'CBL Content',
            description: 'Challenge, deliverables, and grading',
          },
          {
            id: 3,
            title: 'Lecture Sessions',
            description: 'Learning modules and resources',
          },
          {
            id: 4,
            title: 'Sample Profiles',
            description: 'Brand, mentor, and judge profiles',
          },
        ];

      case 'Mock Challenge':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Challenge Content',
            description: 'Challenge, deliverables, and grading (no lectures)',
          },
          {
            id: 3,
            title: 'Sample Profiles',
            description: 'Reference profiles for the challenge',
          },
        ];

      case 'Masterclass':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Sample Profiles',
            description: 'Expert profiles and credentials',
          },
        ];

      case 'Workshop':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Activity Details',
            description: 'Activity description and materials',
          },
          {
            id: 3,
            title: 'SOP & Loom Video',
            description: 'Standard operating procedure and instructional video',
          },
        ];

      case 'GAP':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Activity Details',
            description: 'Activity description and materials',
          },
          {
            id: 3,
            title: 'SOP & Loom Video',
            description: 'Standard operating procedure and instructional video',
          },
        ];

      default:
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Content',
            description: 'Experience-specific content',
          },
        ];
    }
  };

  const steps = getStepsForType(formData.type);

  // Initialize form data when existing experience changes
  useEffect(() => {
    if (existingExperience) {
      setFormData({
        id: existingExperience.id,
        title: existingExperience.title,
        learning_outcomes: existingExperience.learning_outcomes || [],
        type: existingExperience.type,
        challenge: existingExperience.challenge || '',
        deliverables: existingExperience.deliverables || [],
        grading_rubric: existingExperience.grading_rubric || [],
        pass_conditions: existingExperience.pass_conditions,
        distinction_conditions: existingExperience.distinction_conditions,
        lecture_sessions: existingExperience.lecture_sessions || [],
        sample_brand_profiles: existingExperience.sample_brand_profiles || [],
        sample_mentor_profiles: existingExperience.sample_mentor_profiles || [],
        sample_judge_profiles: existingExperience.sample_judge_profiles || [],
      });
    } else {
      // Reset for create mode
      setFormData({
        title: '',
        learning_outcomes: [],
        type: 'CBL',
        epic_id: activeEpicId || '', // Set the active epic
        challenge: '',
        deliverables: [],
        grading_rubric: [],
        pass_conditions: undefined,
        distinction_conditions: undefined,
        lecture_sessions: [],
        sample_brand_profiles: [],
        sample_mentor_profiles: [],
        sample_judge_profiles: [],
      });
    }
    setCurrentStep(1);
  }, [existingExperience]);

  // Handle activeEpicId changes for create mode only
  useEffect(() => {
    if (!existingExperience && activeEpicId) {
      setFormData(prev => ({ ...prev, epic_id: activeEpicId }));
    }
  }, [activeEpicId, existingExperience]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (existingExperience) {
        setFormData({
          id: existingExperience.id,
          title: existingExperience.title,
          learning_outcomes: existingExperience.learning_outcomes || [],
          type: existingExperience.type,
          challenge: existingExperience.challenge || '',
          deliverables: existingExperience.deliverables || [],
          grading_rubric: existingExperience.grading_rubric || [],
          pass_conditions: existingExperience.pass_conditions,
          distinction_conditions: existingExperience.distinction_conditions,
          lecture_sessions: existingExperience.lecture_sessions || [],
          sample_brand_profiles: existingExperience.sample_brand_profiles || [],
          sample_mentor_profiles:
            existingExperience.sample_mentor_profiles || [],
          sample_judge_profiles: existingExperience.sample_judge_profiles || [],
        });
      } else {
        setFormData({
          title: '',
          learning_outcomes: [],
          type: 'CBL',
          epic_id: activeEpicId || '',
          challenge: '',
          deliverables: [],
          grading_rubric: [],
          pass_conditions: undefined,
          distinction_conditions: undefined,
          lecture_sessions: [],
          sample_brand_profiles: [],
          sample_mentor_profiles: [],
          sample_judge_profiles: [],
        });
      }
      setCurrentStep(1);
    }
  }, [open, existingExperience, activeEpicId]);

  const handleInputChange = (
    field: keyof CreateExperienceRequest,
    value: any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: ExperienceType) => {
    setFormData(prev => ({ ...prev, type }));
    // Reset to step 1 when type changes to show new step structure
    setCurrentStep(1);
  };

  const validateRubricWeights = () => {
    if (!formData.grading_rubric || formData.grading_rubric.length === 0) {
      return { isValid: true, message: '' };
    }

    for (const section of formData.grading_rubric) {
      const sectionWeight = section.weight_percentage || 0;
      const criteriaTotalWeight = section.criteria.reduce(
        (total, criteria) => total + (criteria.weight_percentage || 0),
        0
      );

      if (criteriaTotalWeight > sectionWeight) {
        return {
          isValid: false,
          message: `Section "${section.title || 'Untitled'}" has criteria weights (${criteriaTotalWeight}%) that exceed the section weight (${sectionWeight}%). Please adjust the weights.`,
        };
      }
    }

    return { isValid: true, message: '' };
  };

  const autoSave = async (showToast: boolean = false) => {
    if (!formData.title.trim()) {
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Experience title is required.',
          variant: 'destructive',
        });
      }
      return false;
    }

    // Validate rubric weights
    const rubricValidation = validateRubricWeights();
    if (!rubricValidation.isValid) {
      if (showToast) {
        toast({
          title: 'Error',
          description: rubricValidation.message,
          variant: 'destructive',
        });
      }
      return false;
    }

    try {
      // Upsert the experience (auto-save)
      const savedExperience =
        await ExperiencesService.upsertExperience(formData);

      // Update form data with the saved experience ID if it's a new experience
      if (!formData.id && savedExperience.id) {
        setFormData(prev => ({ ...prev, id: savedExperience.id }));
      }

      if (showToast) {
        toast({
          title: 'Success',
          description: `Experience ${isEditMode ? 'updated' : 'saved'} successfully.`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error auto-saving experience:', error);
      if (showToast) {
        toast({
          title: 'Error',
          description: `Failed to ${isEditMode ? 'update' : 'save'} experience. Please try again.`,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const success = await autoSave(true);

      if (success) {
        // Reset form only on final save
        setFormData({
          title: '',
          learning_outcomes: [],
          type: 'CBL',
          epic_id: activeEpicId || '',
          challenge: '',
          deliverables: [],
          grading_rubric: [],
          pass_conditions: undefined,
          distinction_conditions: undefined,
          lecture_sessions: [],
          sample_brand_profiles: [],
          sample_mentor_profiles: [],
          sample_judge_profiles: [],
        });
        setCurrentStep(1);

        onExperienceSaved();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length) {
      // Auto-save before moving to next step
      const success = await autoSave(false);

      if (success) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = (open: boolean) => {
    console.log('🔍 handleClose called with:', { open, loading, isEditMode });

    if (!open && !loading) {
      console.log('🔄 Resetting form data and closing modal');
      // Reset form data when closing
      setFormData({
        title: '',
        learning_outcomes: [],
        type: 'CBL',
        epic_id: activeEpicId || '',
        challenge: '',
        deliverables: [],
        grading_rubric: [],
        pass_conditions: undefined,
        distinction_conditions: undefined,
        lecture_sessions: [],
        sample_brand_profiles: [],
        sample_mentor_profiles: [],
        sample_judge_profiles: [],
      });
      setCurrentStep(1);
    }

    console.log('📞 Calling onOpenChange with:', open);
    // Always call the parent's onOpenChange
    onOpenChange(open);
  };

  const canProceedToNext = () => {
    // Always check rubric weight validation
    const rubricValidation = validateRubricWeights();
    if (!rubricValidation.isValid) {
      return false;
    }

    switch (currentStep) {
      case 1:
        return formData.title.trim() !== '' && formData.type !== '';
      case 2:
        if (formData.type === 'CBL') {
          return formData.challenge?.trim() !== '';
        }
        return true;
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={newOpen => {
        console.log('🎭 Dialog onOpenChange called with:', {
          newOpen,
          currentOpen: open,
        });
        handleClose(newOpen);
      }}
    >
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Experience' : 'Create New Experience'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your experience design and learning content.'
              : 'Design a comprehensive learning experience with structured content and assessment.'}
          </DialogDescription>

          {/* Step Indicator */}
          <div className='flex items-center justify-center space-x-4 py-4'>
            {steps.map((step, index) => (
              <div key={step.id} className='flex items-center'>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className='h-4 w-4' />
                  ) : (
                    <span className='text-sm font-medium'>{step.id}</span>
                  )}
                </div>
                <div className='ml-2 hidden sm:block'>
                  <div
                    className={`text-sm font-medium ${
                      currentStep >= step.id
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {step.description}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <div className='space-y-4'>
                {/* Title and Type on same row */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Experience Title *</Label>
                    <Input
                      id='title'
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      placeholder='Enter experience title'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='type'>Experience Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <BulletedInput
                  value={formData.learning_outcomes}
                  onChange={value =>
                    handleInputChange('learning_outcomes', value)
                  }
                  placeholder='What will learners achieve from this experience?'
                  label='Learning Outcomes'
                  maxItems={8}
                />
              </div>
            </div>
          )}

          {/* Step 2: CBL Content */}
          {currentStep === 2 && formData.type === 'CBL' && (
            <div className='space-y-6'>
              <WYSIWYGEditor
                label='Challenge Description *'
                value={formData.challenge || ''}
                onChange={value => handleInputChange('challenge', value)}
                placeholder='Describe the challenge students will work on...'
                rows={8}
              />

              <DeliverableBuilder
                deliverables={formData.deliverables || []}
                onChange={deliverables =>
                  handleInputChange('deliverables', deliverables)
                }
              />

              <GradingRubricBuilder
                rubricSections={formData.grading_rubric || []}
                onChange={sections =>
                  handleInputChange('grading_rubric', sections)
                }
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <ConditionBuilder
                  label='Pass Conditions'
                  conditions={formData.pass_conditions}
                  onChange={conditions =>
                    handleInputChange('pass_conditions', conditions)
                  }
                  rubricSections={formData.grading_rubric || []}
                  placeholder='Define requirements for passing this experience'
                />

                <ConditionBuilder
                  label='Distinction Conditions'
                  conditions={formData.distinction_conditions}
                  onChange={conditions =>
                    handleInputChange('distinction_conditions', conditions)
                  }
                  rubricSections={formData.grading_rubric || []}
                  placeholder='Define requirements for distinction level'
                />
              </div>
            </div>
          )}

          {/* Step 3: Lecture Sessions (CBL) */}
          {currentStep === 3 && formData.type === 'CBL' && (
            <div className='space-y-6'>
              <LectureModuleBuilder
                modules={formData.lecture_sessions || []}
                onChange={modules =>
                  handleInputChange('lecture_sessions', modules)
                }
                deliverables={formData.deliverables || []}
              />
            </div>
          )}

          {/* Step 4: Sample Profiles (CBL) */}
          {currentStep === 4 && formData.type === 'CBL' && (
            <div className='space-y-6'>
              <div className='space-y-6'>
                <h3 className='text-lg font-semibold'>Sample Profiles</h3>
                <p className='text-sm text-muted-foreground'>
                  Provide sample profiles for reference during the experience.
                  You can add multiple profiles for each type.
                </p>

                <div className='space-y-8'>
                  <SampleProfilesBuilder
                    profiles={formData.sample_brand_profiles || []}
                    onChange={profiles =>
                      handleInputChange('sample_brand_profiles', profiles)
                    }
                    profileType='brand'
                  />

                  <SampleProfilesBuilder
                    profiles={formData.sample_mentor_profiles || []}
                    onChange={profiles =>
                      handleInputChange('sample_mentor_profiles', profiles)
                    }
                    profileType='mentor'
                  />

                  <SampleProfilesBuilder
                    profiles={formData.sample_judge_profiles || []}
                    onChange={profiles =>
                      handleInputChange('sample_judge_profiles', profiles)
                    }
                    profileType='judge'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Other Experience Types */}
          <ExperienceTypeForms
            currentStep={currentStep}
            formData={formData}
            handleInputChange={handleInputChange}
          />

          <DialogFooter className='flex justify-between'>
            <div className='flex space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  console.log('🚫 Cancel button clicked');
                  handleClose(false);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  <ChevronLeft className='h-4 w-4 mr-2' />
                  Previous
                </Button>
              )}
            </div>

            <div className='flex space-x-2'>
              {/* Save Button - Always visible */}
              <Button
                type='button'
                variant='secondary'
                onClick={() => autoSave(true)}
                disabled={loading || !formData.title.trim()}
              >
                <Save className='h-4 w-4 mr-2' />
                {loading ? 'Saving...' : 'Save'}
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type='button'
                  onClick={handleNext}
                  disabled={!canProceedToNext() || loading}
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-2' />
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={handleSave}
                  disabled={loading || !canProceedToNext()}
                >
                  {loading
                    ? isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditMode
                      ? 'Update Experience'
                      : 'Create Experience'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
