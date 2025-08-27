import React from 'react';
import { Control, UseFormWatch } from 'react-hook-form';
import { FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { CreateEquipmentFormData } from '@/domains/equipment/types';
import { CategoryListResponse } from '@/domains/equipment/types';

interface ImagesReviewTabProps {
  control: Control<CreateEquipmentFormData>;
  watch: UseFormWatch<CreateEquipmentFormData>;
  images: string[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  categoriesData?: CategoryListResponse;
}

export const ImagesReviewTab: React.FC<ImagesReviewTabProps> = ({
  watch,
  images,
  onImageUpload,
  onRemoveImage,
  categoriesData,
}) => {
  const formValues = watch();

  return (
    <div className='space-y-4'>
      <div>
        <div className='text-sm font-medium'>Equipment Images *</div>
        <FormDescription>
          Upload at least one image of the equipment. Multiple images can be
          uploaded.
        </FormDescription>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div
          className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors'
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          <Upload className='mx-auto h-8 w-8 text-gray-400 mb-2' />
          <span className='text-sm font-medium text-gray-600'>
            Click to upload images
          </span>
          <Input
            id='image-upload'
            type='file'
            multiple
            accept='image/*'
            className='hidden'
            onChange={onImageUpload}
          />
        </div>

        {images.length > 0 && (
          <div className='space-y-2'>
            <div className='text-sm font-medium'>
              Uploaded Images ({images.length})
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {images.map((image, index) => (
                <div key={index} className='relative'>
                  <img
                    src={image}
                    alt={`Equipment ${index + 1}`}
                    className='w-full h-24 object-cover rounded border'
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    className='absolute top-1 right-1 h-6 w-6 p-0'
                    onClick={() => onRemoveImage(index)}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
