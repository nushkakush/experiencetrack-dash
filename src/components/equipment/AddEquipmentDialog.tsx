import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Settings, Image } from 'lucide-react';
import {
  useCreateEquipment,
  useUpdateEquipment,
} from '@/domains/equipment/hooks/useEquipmentMutations';
import {
  useEquipmentCategories,
  useEquipmentLocations,
} from '@/domains/equipment/hooks/useEquipmentQueries';
import { CreateEquipmentFormData, Equipment } from '@/domains/equipment/types';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { BasicInformationTab, DetailsStatusTab, ImagesReviewTab } from './tabs';
import { CreateCategoryDialog, CreateLocationDialog } from './dialogs';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  location_id: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.number().min(0, 'Cost must be positive').optional(),
  condition_status: z.enum([
    'excellent',
    'good',
    'poor',
    'damaged',
    'under_repair',
    'lost',
    'decommissioned',
  ]),
  availability_status: z.enum([
    'available',
    'borrowed',
    'maintenance',
    'retired',
    'lost',
    'decommissioned',
  ]),
  condition_notes: z.string().optional(),
  images: z.array(z.string()),
}) satisfies z.ZodType<CreateEquipmentFormData>;

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment | null; // For edit mode
  isCloneMode?: boolean; // For clone mode
}

const AddEquipmentDialog: React.FC<AddEquipmentDialogProps> = ({
  open,
  onOpenChange,
  equipment,
  isCloneMode = false,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<CreateEquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      location_id: '',
      serial_number: '',
      purchase_date: '',
      purchase_cost: undefined,
      condition_status: 'good',
      availability_status: 'available', // Always available for new equipment
      condition_notes: '',
      images: [],
    },
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useEquipmentCategories();
  const {
    data: locationsData,
    isLoading: locationsLoading,
    error: locationsError,
  } = useEquipmentLocations();

  // Show error toasts when data fails to load
  useEffect(() => {
    if (categoriesError) {
      toast.error(
        'Failed to load equipment categories. Please try refreshing the page.'
      );
    }
  }, [categoriesError]);

  useEffect(() => {
    if (locationsError) {
      toast.error(
        'Failed to load equipment locations. Please try refreshing the page.'
      );
    }
  }, [locationsError]);

  // Debug logging
  console.log('AddEquipmentDialog - categoriesData:', categoriesData);
  console.log('AddEquipmentDialog - locationsData:', locationsData);
  console.log('AddEquipmentDialog - categoriesLoading:', categoriesLoading);
  console.log('AddEquipmentDialog - locationsLoading:', locationsLoading);
  console.log('AddEquipmentDialog - categoriesError:', categoriesError);
  console.log('AddEquipmentDialog - locationsError:', locationsError);
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();

  // Check if we're in edit mode or clone mode
  const isEditMode = !!equipment && !isCloneMode;
  const isCloneModeActive = !!equipment && isCloneMode;

  // Populate form when in edit mode or clone mode
  useEffect(() => {
    if (equipment && (isEditMode || isCloneModeActive)) {
      form.reset({
        name: isCloneModeActive ? `${equipment.name} (Copy)` : equipment.name,
        description: equipment.description || '',
        category_id: equipment.category_id,
        location_id: equipment.location_id || '',
        serial_number: isCloneModeActive ? '' : equipment.serial_number || '', // Empty for clone
        purchase_date: equipment.purchase_date || '',
        purchase_cost: equipment.purchase_cost,
        condition_status: equipment.condition_status,
        availability_status: isCloneModeActive
          ? 'available'
          : equipment.availability_status, // Always available for clones
        condition_notes: equipment.condition_notes || '',
        images: equipment.images || [],
      });
      setImages(equipment.images || []);
    }
  }, [equipment, isEditMode, isCloneModeActive, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // For now, we'll simulate image upload by creating data URLs
      // In production, you'd upload to Supabase Storage
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateEquipmentFormData) => {
    if (images.length === 0) {
      toast.error('At least one image is required');
      setActiveTab('images');
      return;
    }

    const equipmentData: CreateEquipmentFormData = {
      ...data,
      images,
      purchase_cost: data.purchase_cost
        ? Number(data.purchase_cost)
        : undefined,
    };

    try {
      if (isEditMode && equipment) {
        await updateEquipment.mutateAsync({
          id: equipment.id,
          data: equipmentData,
        });
      } else {
        await createEquipment.mutateAsync(equipmentData);
      }
      form.reset();
      setImages([]);
      setActiveTab('basic');
      onOpenChange(false);
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? 'update' : 'create'} equipment:`,
        error
      );
    }
  };

  const handleNext = () => {
    if (activeTab === 'basic') {
      setActiveTab('details');
    } else if (activeTab === 'details') {
      setActiveTab('images');
    }
  };

  const handlePrevious = () => {
    if (activeTab === 'details') {
      setActiveTab('basic');
    } else if (activeTab === 'images') {
      setActiveTab('details');
    }
  };

  const canProceedToNext = () => {
    const values = form.getValues();
    if (activeTab === 'basic') {
      return values.name && values.category_id;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Edit Equipment'
              : isCloneModeActive
                ? 'Clone Equipment'
                : 'Add New Equipment'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the equipment information. Complete all three steps to save your changes.'
              : isCloneModeActive
                ? 'Create a copy of this equipment. Complete all three steps to create the new equipment.'
                : 'Add a new piece of equipment to the inventory. Complete all three steps to create your equipment.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='basic' className='flex items-center gap-2'>
              <Package className='h-4 w-4' />
              Basic Information
            </TabsTrigger>
            <TabsTrigger value='details' className='flex items-center gap-2'>
              <Settings className='h-4 w-4' />
              Details & Status
            </TabsTrigger>
            <TabsTrigger value='images' className='flex items-center gap-2'>
              <Image className='h-4 w-4' />
              Images & Review
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Tab 1: Basic Information */}
              <TabsContent value='basic' className='space-y-6'>
                <BasicInformationTab
                  control={form.control}
                  categoriesData={categoriesData}
                  locationsData={locationsData}
                  onShowCategoryForm={() => setShowCategoryForm(true)}
                  onShowLocationForm={() => setShowLocationForm(true)}
                  categoriesLoading={categoriesLoading}
                  locationsLoading={locationsLoading}
                  categoriesError={categoriesError}
                  locationsError={locationsError}
                />
              </TabsContent>

              {/* Tab 2: Details & Status */}
              <TabsContent value='details' className='space-y-6'>
                <DetailsStatusTab control={form.control} />
              </TabsContent>

              {/* Tab 3: Images & Review */}
              <TabsContent value='images' className='space-y-6'>
                <ImagesReviewTab
                  control={form.control}
                  watch={form.watch}
                  images={images}
                  onImageUpload={handleImageUpload}
                  onRemoveImage={removeImage}
                  categoriesData={categoriesData}
                />
              </TabsContent>

              {/* Navigation Buttons */}
              <div className='flex items-center justify-between pt-4 border-t'>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <div className='flex gap-2'>
                  {activeTab !== 'basic' && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handlePrevious}
                    >
                      Previous
                    </Button>
                  )}
                  {activeTab !== 'images' && (
                    <Button
                      type='button'
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                    >
                      Next
                    </Button>
                  )}
                  {activeTab === 'images' && (
                    <Button
                      type='submit'
                      disabled={
                        createEquipment.isPending || updateEquipment.isPending
                      }
                    >
                      {createEquipment.isPending || updateEquipment.isPending
                        ? isEditMode
                          ? 'Updating...'
                          : 'Creating...'
                        : isEditMode
                          ? 'Update Equipment'
                          : isCloneModeActive
                            ? 'Clone Equipment'
                            : 'Create Equipment'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </Tabs>

        {/* Category Creation Dialog */}
        <CreateCategoryDialog
          open={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
          categoryName={newCategoryName}
          onCategoryNameChange={setNewCategoryName}
        />

        {/* Location Creation Dialog */}
        <CreateLocationDialog
          open={showLocationForm}
          onClose={() => setShowLocationForm(false)}
          locationName={newLocationName}
          onLocationNameChange={setNewLocationName}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentDialog;
