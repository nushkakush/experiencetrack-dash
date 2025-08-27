import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CreateEquipmentFormData } from '@/domains/equipment/types';
import {
  CategoryListResponse,
  LocationListResponse,
} from '@/domains/equipment/types';
import { Skeleton } from '@/components/ui/skeleton';

interface BasicInformationTabProps {
  control: Control<CreateEquipmentFormData>;
  categoriesData?: CategoryListResponse;
  locationsData?: LocationListResponse;
  onShowCategoryForm: () => void;
  onShowLocationForm: () => void;
  categoriesLoading?: boolean;
  locationsLoading?: boolean;
  categoriesError?: any;
  locationsError?: any;
}

export const BasicInformationTab: React.FC<BasicInformationTabProps> = ({
  control,
  categoriesData,
  locationsData,
  onShowCategoryForm,
  onShowLocationForm,
  categoriesLoading = false,
  locationsLoading = false,
  categoriesError = null,
  locationsError = null,
}) => {
  // Debug logging
  console.log('BasicInformationTab - categoriesData:', categoriesData);
  console.log('BasicInformationTab - locationsData:', locationsData);
  console.log(
    'BasicInformationTab - categories count:',
    categoriesData?.categories?.length
  );
  console.log(
    'BasicInformationTab - locations count:',
    locationsData?.locations?.length
  );
  console.log(
    'BasicInformationTab - categoriesData type:',
    typeof categoriesData
  );
  console.log(
    'BasicInformationTab - locationsData type:',
    typeof locationsData
  );
  console.log(
    'BasicInformationTab - categoriesData keys:',
    categoriesData ? Object.keys(categoriesData) : 'null'
  );
  console.log(
    'BasicInformationTab - locationsData keys:',
    locationsData ? Object.keys(locationsData) : 'null'
  );

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipment Name *</FormLabel>
              <FormControl>
                <Input placeholder='e.g., Canon EOS R6 Camera' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='serial_number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input placeholder='e.g., CAN123456789' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Detailed description of the equipment...'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='category_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <div className='flex gap-2'>
                {categoriesLoading ? (
                  <Skeleton className='h-10 w-full' />
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={categoriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(() => {
                        console.log(
                          'BasicInformationTab - rendering categories dropdown'
                        );
                        console.log(
                          'BasicInformationTab - categoriesData?.categories:',
                          categoriesData?.categories
                        );
                        console.log(
                          'BasicInformationTab - categoriesData?.categories?.length:',
                          categoriesData?.categories?.length
                        );

                        if (categoriesError) {
                          console.log(
                            'BasicInformationTab - categories error:',
                            categoriesError
                          );
                          return (
                            <SelectItem value='error' disabled>
                              Error loading categories
                            </SelectItem>
                          );
                        } else if (categoriesData?.categories?.length > 0) {
                          console.log(
                            'BasicInformationTab - rendering categories list:',
                            categoriesData.categories.map(c => ({
                              id: c.id,
                              name: c.name,
                            }))
                          );
                          return categoriesData.categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ));
                        } else {
                          console.log(
                            'BasicInformationTab - no categories available, showing disabled item'
                          );
                          return (
                            <SelectItem value='no-categories' disabled>
                              No categories available
                            </SelectItem>
                          );
                        }
                      })()}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={onShowCategoryForm}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='location_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <div className='flex gap-2'>
                {locationsLoading ? (
                  <Skeleton className='h-10 w-full' />
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={locationsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select location' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(() => {
                        console.log(
                          'BasicInformationTab - rendering locations dropdown'
                        );
                        console.log(
                          'BasicInformationTab - locationsData?.locations:',
                          locationsData?.locations
                        );
                        console.log(
                          'BasicInformationTab - locationsData?.locations?.length:',
                          locationsData?.locations?.length
                        );

                        if (locationsError) {
                          console.log(
                            'BasicInformationTab - locations error:',
                            locationsError
                          );
                          return (
                            <SelectItem value='error' disabled>
                              Error loading locations
                            </SelectItem>
                          );
                        } else if (locationsData?.locations?.length > 0) {
                          console.log(
                            'BasicInformationTab - rendering locations list:',
                            locationsData.locations.map(l => ({
                              id: l.id,
                              name: l.name,
                            }))
                          );
                          return locationsData.locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ));
                        } else {
                          console.log(
                            'BasicInformationTab - no locations available, showing disabled item'
                          );
                          return (
                            <SelectItem value='no-locations' disabled>
                              No locations available
                            </SelectItem>
                          );
                        }
                      })()}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={onShowLocationForm}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
