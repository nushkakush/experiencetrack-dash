import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WYSIWYGEditor } from '@/components/experiences/WYSIWYGEditor';
import { DeliverableBuilder } from '@/components/experiences/DeliverableBuilder';
import { GradingRubricBuilder } from '@/components/experiences/GradingRubricBuilder';
import { ConditionBuilder } from '@/components/experiences/ConditionBuilder';
import { SampleProfilesBuilder } from '@/components/experiences/SampleProfilesBuilder';
import { BulletedInput } from '@/components/ui/bulleted-input';
import type { CreateExperienceRequest, Experience } from '@/types/experience';

interface ExperienceTypeFormsProps {
  currentStep: number;
  formData: CreateExperienceRequest & { id?: string };
  handleInputChange: (field: string, value: any) => void;
}

export const ExperienceTypeForms: React.FC<ExperienceTypeFormsProps> = ({
  currentStep,
  formData,
  handleInputChange,
}) => {
  // Mock Challenge Content (reuses CBL fields)
  if (currentStep === 2 && formData.type === 'Mock Challenge') {
    return (
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
          onChange={sections => handleInputChange('grading_rubric', sections)}
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
    );
  }

  // Mock Challenge Sample Profiles
  if (currentStep === 3 && formData.type === 'Mock Challenge') {
    return (
      <div className='space-y-6'>
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold'>Sample Judge Profiles</h3>
          <p className='text-sm text-muted-foreground'>
            Provide sample judge profiles who will evaluate the mock challenge
            submissions.
          </p>

          <SampleProfilesBuilder
            profiles={formData.sample_judge_profiles || []}
            onChange={profiles =>
              handleInputChange('sample_judge_profiles', profiles)
            }
            profileType='judge'
          />
        </div>
      </div>
    );
  }

  // Masterclass Sample Profiles
  if (currentStep === 2 && formData.type === 'Masterclass') {
    return (
      <div className='space-y-6'>
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold'>Expert Profiles</h3>
          <p className='text-sm text-muted-foreground'>
            Provide expert profiles who will lead the masterclass sessions.
          </p>

          <SampleProfilesBuilder
            profiles={formData.expert_profile || []}
            onChange={profiles => handleInputChange('expert_profile', profiles)}
            profileType='expert'
          />
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Session Configuration</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='max-participants'>Max Participants</Label>
              <Input
                id='max-participants'
                type='number'
                value={formData.max_participants || ''}
                onChange={e =>
                  handleInputChange(
                    'max_participants',
                    parseInt(e.target.value) || undefined
                  )
                }
                placeholder='e.g., 30'
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Workshop Activity Details
  if (currentStep === 2 && formData.type === 'Workshop') {
    return (
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='activity_description'>Activity Description *</Label>
          <textarea
            id='activity_description'
            className='w-full min-h-[120px] px-3 py-2 border border-input rounded-md resize-none'
            value={formData.activity_description || ''}
            onChange={e =>
              handleInputChange('activity_description', e.target.value)
            }
            placeholder='Describe the hands-on workshop activity in detail...'
          />
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Materials Required</h3>
          <p className='text-sm text-muted-foreground'>
            List all materials needed for this workshop activity.
          </p>
          <div className='space-y-4'>
            {(formData.materials_required || []).map((material, index) => (
              <div
                key={material.id || index}
                className='p-4 border rounded-lg space-y-4'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Material Name *</Label>
                    <Input
                      value={material.name}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          name: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., Laptop, Software License'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Quantity *</Label>
                    <Input
                      value={material.quantity}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          quantity: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., 1 per participant'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Description *</Label>
                  <Input
                    value={material.description}
                    onChange={e => {
                      const newMaterials = [
                        ...(formData.materials_required || []),
                      ];
                      newMaterials[index] = {
                        ...material,
                        description: e.target.value,
                      };
                      handleInputChange('materials_required', newMaterials);
                    }}
                    placeholder='Detailed description of the material'
                  />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Where to Get</Label>
                    <Input
                      value={material.where_to_get}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          where_to_get: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., Amazon, Local store, etc.'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Cost Estimate</Label>
                    <Input
                      value={material.cost_estimate || ''}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          cost_estimate: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., ₹50-100'
                    />
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id={`required_${index}`}
                    checked={material.required}
                    onChange={e => {
                      const newMaterials = [
                        ...(formData.materials_required || []),
                      ];
                      newMaterials[index] = {
                        ...material,
                        required: e.target.checked,
                      };
                      handleInputChange('materials_required', newMaterials);
                    }}
                  />
                  <Label htmlFor={`required_${index}`}>Required</Label>
                </div>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                const newMaterial = {
                  id: crypto.randomUUID(),
                  name: '',
                  quantity: '',
                  description: '',
                  where_to_get: '',
                  cost_estimate: '',
                  required: true,
                };
                handleInputChange('materials_required', [
                  ...(formData.materials_required || []),
                  newMaterial,
                ]);
              }}
            >
              Add Material
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Workshop SOP & Loom Video
  if (currentStep === 3 && formData.type === 'Workshop') {
    return (
      <div className='space-y-6'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>
            Standard Operating Procedure
          </h3>
          <p className='text-sm text-muted-foreground'>
            Create step-by-step instructions for conducting this workshop.
          </p>
          <div className='space-y-4'>
            {(formData.sop_steps || []).map((step, index) => (
              <div
                key={step.id || index}
                className='p-4 border rounded-lg space-y-4'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-medium'>Step {index + 1}</h4>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const newSteps = (formData.sop_steps || []).filter(
                        (_, i) => i !== index
                      );
                      handleInputChange('sop_steps', newSteps);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className='space-y-2'>
                  <Label>Step Title *</Label>
                  <Input
                    value={step.title}
                    onChange={e => {
                      const newSteps = [...(formData.sop_steps || [])];
                      newSteps[index] = { ...step, title: e.target.value };
                      handleInputChange('sop_steps', newSteps);
                    }}
                    placeholder='e.g., Setup Materials, Begin Activity, etc.'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Step Description *</Label>
                  <textarea
                    className='w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none'
                    value={step.description}
                    onChange={e => {
                      const newSteps = [...(formData.sop_steps || [])];
                      newSteps[index] = {
                        ...step,
                        description: e.target.value,
                      };
                      handleInputChange('sop_steps', newSteps);
                    }}
                    placeholder='Detailed description of what to do in this step...'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Estimated Time (minutes)</Label>
                  <Input
                    type='number'
                    value={step.estimated_time || ''}
                    onChange={e => {
                      const newSteps = [...(formData.sop_steps || [])];
                      newSteps[index] = {
                        ...step,
                        estimated_time: parseInt(e.target.value) || 0,
                      };
                      handleInputChange('sop_steps', newSteps);
                    }}
                    placeholder='5'
                    min='0'
                  />
                </div>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                const newStep = {
                  id: crypto.randomUUID(),
                  title: '',
                  description: '',
                  estimated_time: 0,
                };
                handleInputChange('sop_steps', [
                  ...(formData.sop_steps || []),
                  newStep,
                ]);
              }}
            >
              Add Step
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='loom_video_url'>Loom Video URL *</Label>
          <Input
            id='loom_video_url'
            value={formData.loom_video_url || ''}
            onChange={e => handleInputChange('loom_video_url', e.target.value)}
            placeholder='https://loom.com/share/...'
          />
          <p className='text-sm text-muted-foreground'>
            Upload your instructional video to Loom and paste the share URL
            here.
          </p>
        </div>
      </div>
    );
  }

  // GAP Activity Details (same as Workshop)
  if (currentStep === 2 && formData.type === 'GAP') {
    return (
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='activity_description'>Activity Description *</Label>
          <textarea
            id='activity_description'
            className='w-full min-h-[200px] px-3 py-2 border border-input rounded-md resize-none'
            value={formData.activity_description || ''}
            onChange={e =>
              handleInputChange('activity_description', e.target.value)
            }
            placeholder='Describe the GAP activity in detail...'
          />
        </div>

        <div className='space-y-4'>
          <Label>Materials Required *</Label>
          <p className='text-sm text-muted-foreground'>
            List all materials needed for this GAP activity.
          </p>
          <div className='space-y-4'>
            {(formData.materials_required || []).map((material, index) => (
              <div
                key={material.id || index}
                className='p-4 border rounded-lg space-y-4'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-medium'>Material {index + 1}</h4>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const newMaterials = (
                        formData.materials_required || []
                      ).filter((_, i) => i !== index);
                      handleInputChange('materials_required', newMaterials);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Material Name *</Label>
                    <Input
                      value={material.name}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          name: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., Safety goggles, Work gloves'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Quantity *</Label>
                    <Input
                      value={material.quantity}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          quantity: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., 10 pairs, 1 set'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Description *</Label>
                  <textarea
                    className='w-full min-h-[60px] px-3 py-2 border border-input rounded-md resize-none'
                    value={material.description}
                    onChange={e => {
                      const newMaterials = [
                        ...(formData.materials_required || []),
                      ];
                      newMaterials[index] = {
                        ...material,
                        description: e.target.value,
                      };
                      handleInputChange('materials_required', newMaterials);
                    }}
                    placeholder='Brief description of the material'
                  />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Where to Get</Label>
                    <Input
                      value={material.where_to_get || ''}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          where_to_get: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., Local hardware store, Online'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Cost Estimate</Label>
                    <Input
                      value={material.cost_estimate || ''}
                      onChange={e => {
                        const newMaterials = [
                          ...(formData.materials_required || []),
                        ];
                        newMaterials[index] = {
                          ...material,
                          cost_estimate: e.target.value,
                        };
                        handleInputChange('materials_required', newMaterials);
                      }}
                      placeholder='e.g., ₹50, ₹500'
                    />
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id={`required-${index}`}
                    checked={material.required}
                    onChange={e => {
                      const newMaterials = [
                        ...(formData.materials_required || []),
                      ];
                      newMaterials[index] = {
                        ...material,
                        required: e.target.checked,
                      };
                      handleInputChange('materials_required', newMaterials);
                    }}
                  />
                  <Label htmlFor={`required-${index}`}>
                    Required for activity
                  </Label>
                </div>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                const newMaterial = {
                  id: crypto.randomUUID(),
                  name: '',
                  quantity: '',
                  description: '',
                  where_to_get: '',
                  cost_estimate: '',
                  required: true,
                };
                handleInputChange('materials_required', [
                  ...(formData.materials_required || []),
                  newMaterial,
                ]);
              }}
            >
              Add Material
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // GAP SOP & Loom Video (same as Workshop)
  if (currentStep === 3 && formData.type === 'GAP') {
    return (
      <div className='space-y-6'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>
            Standard Operating Procedure
          </h3>
          <p className='text-sm text-muted-foreground'>
            Create step-by-step instructions for conducting this GAP activity.
          </p>
          <div className='space-y-4'>
            {(formData.sop_steps || []).map((step, index) => (
              <div
                key={step.id || index}
                className='p-4 border rounded-lg space-y-4'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-medium'>Step {index + 1}</h4>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const newSteps = (formData.sop_steps || []).filter(
                        (_, i) => i !== index
                      );
                      handleInputChange('sop_steps', newSteps);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className='space-y-2'>
                  <Label>Step Title *</Label>
                  <Input
                    value={step.title}
                    onChange={e => {
                      const newSteps = [...(formData.sop_steps || [])];
                      newSteps[index] = { ...step, title: e.target.value };
                      handleInputChange('sop_steps', newSteps);
                    }}
                    placeholder='e.g., Setup Materials, Begin Activity, etc.'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Step Description *</Label>
                  <textarea
                    className='w-full min-h-[80px] px-3 py-2 border border-input rounded-md resize-none'
                    value={step.description}
                    onChange={e => {
                      const newSteps = [...(formData.sop_steps || [])];
                      newSteps[index] = {
                        ...step,
                        description: e.target.value,
                      };
                      handleInputChange('sop_steps', newSteps);
                    }}
                    placeholder='Detailed description of what to do in this step...'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Estimated Time (minutes)</Label>
                  <Input
                    type='number'
                    value={step.estimated_time || ''}
                    onChange={e => {
                      const newSteps = [...(formData.sop_steps || [])];
                      newSteps[index] = {
                        ...step,
                        estimated_time: parseInt(e.target.value) || 0,
                      };
                      handleInputChange('sop_steps', newSteps);
                    }}
                    placeholder='5'
                    min='0'
                  />
                </div>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                const newStep = {
                  id: crypto.randomUUID(),
                  title: '',
                  description: '',
                  estimated_time: 0,
                };
                handleInputChange('sop_steps', [
                  ...(formData.sop_steps || []),
                  newStep,
                ]);
              }}
            >
              Add Step
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='loom_video_url'>Loom Video URL *</Label>
          <Input
            id='loom_video_url'
            value={formData.loom_video_url || ''}
            onChange={e => handleInputChange('loom_video_url', e.target.value)}
            placeholder='https://loom.com/share/...'
          />
          <p className='text-sm text-muted-foreground'>
            Upload your instructional video to Loom and paste the share URL
            here.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
