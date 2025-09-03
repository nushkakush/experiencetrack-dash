import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Trash2, GripVertical, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { EpicLearningPathsService } from '@/services/epicLearningPaths.service';
import { BulletedInput } from '@/components/ui/bulleted-input';
import type { CreateEpicLearningPathRequest, EpicInPath, EpicLearningPath } from '@/types/epicLearningPath';
import type { Epic } from '@/types/epic';

interface EpicLearningPathStepperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLearningPathSaved: () => void;
  existingLearningPath?: EpicLearningPath | null;
}

export const EpicLearningPathStepperDialog: React.FC<EpicLearningPathStepperDialogProps> = ({
  open,
  onOpenChange,
  onLearningPathSaved,
  existingLearningPath = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableEpics, setAvailableEpics] = useState<Epic[]>([]);
  const [selectedEpics, setSelectedEpics] = useState<EpicInPath[]>([]);
  const [formData, setFormData] = useState<CreateEpicLearningPathRequest & { id?: string }>({
    id: existingLearningPath?.id,
    title: existingLearningPath?.title || '',
    description: existingLearningPath?.description || '',
    outcomes: existingLearningPath?.outcomes || [],
    epics: existingLearningPath?.epics || [],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(existingLearningPath?.avatar_url || '');
  const [bannerPreview, setBannerPreview] = useState<string>(existingLearningPath?.banner_url || '');

  const { toast } = useToast();
  const isEditMode = !!existingLearningPath;

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Title, description, and learning outcomes',
    },
    {
      id: 2,
      title: 'Epic Selection',
      description: 'Choose epics for your learning path',
    },
    {
      id: 3,
      title: 'Review & Order',
      description: 'Review and arrange epics in order',
    },
  ];

  // Load available epics when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableEpics();
    }
  }, [open]);

  // Initialize form data when existing learning path changes
  useEffect(() => {
    if (existingLearningPath) {
      setFormData({
        id: existingLearningPath.id,
        title: existingLearningPath.title,
        description: existingLearningPath.description || '',
        outcomes: existingLearningPath.outcomes || [],
        epics: existingLearningPath.epics || [],
      });
      setSelectedEpics(existingLearningPath.epics || []);
      setAvatarPreview(existingLearningPath.avatar_url || '');
      setBannerPreview(existingLearningPath.banner_url || '');
    } else {
      // Reset for create mode
      setFormData({
        title: '',
        description: '',
        outcomes: [],
        epics: [],
      });
      setSelectedEpics([]);
      setAvatarPreview('');
      setBannerPreview('');
    }
    setCurrentStep(1);
  }, [existingLearningPath]);

  const loadAvailableEpics = async () => {
    try {
      const epics = await EpicLearningPathsService.getAvailableEpics();
      setAvailableEpics(epics);
    } catch (error) {
      console.error('Error loading epics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available epics.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: keyof CreateEpicLearningPathRequest, value: string | string[] | EpicInPath[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (
    file: File | null,
    type: 'avatar' | 'banner'
  ) => {
    if (type === 'avatar') {
      setAvatarFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    } else {
      setBannerFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setBannerPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = (type: 'avatar' | 'banner') => {
    if (type === 'avatar') {
      setAvatarFile(null);
      setAvatarPreview('');
    } else {
      setBannerFile(null);
      setBannerPreview('');
    }
  };

  const handleEpicToggle = (epic: Epic, checked: boolean) => {
    if (checked) {
      const newEpic: EpicInPath = {
        id: epic.id,
        order: selectedEpics.length + 1,
      };
      const newSelectedEpics = [...selectedEpics, newEpic];
      setSelectedEpics(newSelectedEpics);
      handleInputChange('epics', newSelectedEpics);
    } else {
      const newSelectedEpics = selectedEpics
        .filter(epicInPath => epicInPath.id !== epic.id)
        .map((epicInPath, index) => ({ ...epicInPath, order: index + 1 }));
      setSelectedEpics(newSelectedEpics);
      handleInputChange('epics', newSelectedEpics);
    }
  };

  const handleEpicReorder = (fromIndex: number, toIndex: number) => {
    const newSelectedEpics = [...selectedEpics];
    const [movedEpic] = newSelectedEpics.splice(fromIndex, 1);
    newSelectedEpics.splice(toIndex, 0, movedEpic);
    
    // Update order numbers
    const reorderedEpics = newSelectedEpics.map((epic, index) => ({
      ...epic,
      order: index + 1,
    }));
    
    setSelectedEpics(reorderedEpics);
    handleInputChange('epics', reorderedEpics);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Learning path title is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      let avatarUrl = formData.avatar_url || '';
      let bannerUrl = formData.banner_url || '';

      // Upload new images if provided
      if (avatarFile) {
        avatarUrl = await EpicLearningPathsService.uploadImage(avatarFile, 'avatar');
      }

      if (bannerFile) {
        bannerUrl = await EpicLearningPathsService.uploadImage(bannerFile, 'banner');
      }

      // Upsert the learning path
      await EpicLearningPathsService.upsertEpicLearningPath({
        ...formData,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        outcomes: [],
        epics: [],
      });
      setSelectedEpics([]);
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview('');
      setBannerPreview('');
      setCurrentStep(1);

      onLearningPathSaved();
    } catch (error) {
      console.error('Error saving learning path:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} learning path. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        outcomes: [],
        epics: [],
      });
      setSelectedEpics([]);
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview('');
      setBannerPreview('');
      setCurrentStep(1);
      onOpenChange(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== '';
      case 2:
        return selectedEpics.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Epic Learning Path' : 'Create New Epic Learning Path'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update your learning path details, outcomes, and epic selection.'
              : 'Create a structured learning path with multiple epics and learning outcomes.'
            }
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
                  <div className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {step.description}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
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
                <div className='space-y-2'>
                  <Label htmlFor='title'>Learning Path Title *</Label>
                  <Input
                    id='title'
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder='Enter learning path title'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder='Describe the learning path...'
                    rows={3}
                  />
                </div>

                <BulletedInput
                  value={formData.outcomes}
                  onChange={(value) => handleInputChange('outcomes', value)}
                  placeholder='What will learners achieve from this path?'
                  label='Learning Outcomes'
                  maxItems={8}
                />
              </div>

              {/* Image Uploads */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Avatar Upload */}
                <div className='space-y-2'>
                  <Label>Avatar Image</Label>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
                    {avatarPreview ? (
                      <div className='relative'>
                        <img
                          src={avatarPreview}
                          alt='Avatar preview'
                          className='w-full h-32 object-cover rounded-lg'
                        />
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          className='absolute top-2 right-2'
                          onClick={() => handleRemoveImage('avatar')}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ) : (
                      <label className='cursor-pointer block text-center'>
                        <Upload className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                        <span className='text-sm text-gray-600'>
                          Click to upload avatar
                        </span>
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={(e) =>
                            handleFileChange(e.target.files?.[0] || null, 'avatar')
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Banner Upload */}
                <div className='space-y-2'>
                  <Label>Banner Image</Label>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
                    {bannerPreview ? (
                      <div className='relative'>
                        <img
                          src={bannerPreview}
                          alt='Banner preview'
                          className='w-full h-32 object-cover rounded-lg'
                        />
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          className='absolute top-2 right-2'
                          onClick={() => handleRemoveImage('banner')}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ) : (
                      <label className='cursor-pointer block text-center'>
                        <Upload className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                        <span className='text-sm text-gray-600'>
                          Click to upload banner
                        </span>
                        <input
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={(e) =>
                            handleFileChange(e.target.files?.[0] || null, 'banner')
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Epic Selection */}
          {currentStep === 2 && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-lg font-semibold'>Select Epics</Label>
                <div className='text-sm text-muted-foreground'>
                  {selectedEpics.length} epic{selectedEpics.length !== 1 ? 's' : ''} selected
                </div>
              </div>

              {/* Available Epics */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Available Epics</Label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2'>
                  {availableEpics.map((epic) => {
                    const isSelected = selectedEpics.some(epicInPath => epicInPath.id === epic.id);
                    return (
                      <div key={epic.id} className='flex items-center space-x-2 p-2 hover:bg-muted rounded'>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleEpicToggle(epic, checked as boolean)}
                        />
                        <Avatar className='h-6 w-6'>
                          {epic.avatar_url ? (
                            <AvatarImage src={epic.avatar_url} alt={epic.name} />
                          ) : null}
                          <AvatarFallback className='text-xs'>
                            {epic.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm flex-1 truncate'>{epic.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Order */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              {/* Learning Path Summary */}
              <div className='bg-muted/30 p-4 rounded-lg'>
                <h3 className='text-lg font-semibold mb-3'>Learning Path Summary</h3>
                <div className='space-y-2'>
                  <div><strong>Title:</strong> {formData.title}</div>
                  {formData.description && (
                    <div><strong>Description:</strong> {formData.description}</div>
                  )}
                  {formData.outcomes && formData.outcomes.length > 0 && (
                    <div>
                      <strong>Learning Outcomes:</strong>
                      <ul className='list-disc list-inside mt-1 ml-4'>
                        {formData.outcomes.map((outcome, index) => (
                          <li key={index} className='text-sm'>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Epic Ordering */}
              {selectedEpics.length > 0 && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-lg font-semibold'>Epic Order</Label>
                    <div className='text-sm text-muted-foreground'>
                      Use arrows to reorder
                    </div>
                  </div>
                  
                  <div className='space-y-2'>
                    {selectedEpics.map((epicInPath, index) => {
                      const epic = availableEpics.find(e => e.id === epicInPath.id);
                      if (!epic) return null;
                      
                      return (
                        <div
                          key={epicInPath.id}
                          className='flex items-center space-x-3 p-3 border rounded-lg bg-background'
                        >
                          <div className='flex flex-col space-y-1'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              disabled={index === 0}
                              onClick={() => handleEpicReorder(index, index - 1)}
                            >
                              <ChevronLeft className='h-3 w-3' />
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              disabled={index === selectedEpics.length - 1}
                              onClick={() => handleEpicReorder(index, index + 1)}
                            >
                              <ChevronRight className='h-3 w-3' />
                            </Button>
                          </div>
                          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium'>
                            {epicInPath.order}
                          </div>
                          <Avatar className='h-10 w-10'>
                            {epic.avatar_url ? (
                              <AvatarImage src={epic.avatar_url} alt={epic.name} />
                            ) : null}
                            <AvatarFallback>
                              {epic.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <h4 className='font-medium'>{epic.name}</h4>
                            {epic.description && (
                              <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                                {epic.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEpicToggle(epic, false)}
                            className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className='flex justify-between'>
            <div className='flex space-x-2'>
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
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
            
            <div className='flex space-x-2'>
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
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Learning Path' : 'Create Learning Path')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
