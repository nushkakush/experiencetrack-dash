import React, { useState, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Search } from 'lucide-react';
import { useAvailableEquipment } from '@/hooks/equipment/useEquipment';
import { IssuanceFormData } from '../schemas/issuanceFormSchema';

// Helper function to get badge variant based on condition status
const getConditionBadgeVariant = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return 'default';
    case 'good':
      return 'secondary';

    case 'poor':
      return 'destructive';
    default:
      return 'outline';
  }
};

interface EquipmentSelectionProps {
  form: UseFormReturn<IssuanceFormData>;
}

export const EquipmentSelection: React.FC<EquipmentSelectionProps> = ({
  form,
}) => {
  const { data: availableEquipment } = useAvailableEquipment();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEquipment = useMemo(() => {
    if (!availableEquipment) return [];
    return availableEquipment.filter(
      equipment =>
        equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        equipment.serial_number
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [availableEquipment, searchQuery]);

  const handleEquipmentToggle = (equipmentId: string) => {
    const currentIds = form.watch('equipment_ids');
    if (currentIds.includes(equipmentId)) {
      form.setValue(
        'equipment_ids',
        currentIds.filter(id => id !== equipmentId)
      );
    } else {
      form.setValue('equipment_ids', [...currentIds, equipmentId]);
    }
  };

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='equipment_ids'
        render={() => (
          <FormItem>
            <FormLabel>Select Equipment *</FormLabel>
            <div className='flex items-center space-x-2 mb-2'>
              <Input
                placeholder='Search equipment...'
                className='flex-1'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className='h-5 w-5 text-muted-foreground' />
            </div>
            <div className='grid gap-3 max-h-60 overflow-y-auto'>
              {/* Loading state */}
              {availableEquipment === undefined && (
                <div className='flex items-center justify-center py-8'>
                  <div className='flex items-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
                    <span className='text-sm text-muted-foreground'>
                      Loading available equipment...
                    </span>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {availableEquipment && availableEquipment.length === 0 && (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <div className='text-muted-foreground mb-2'>
                    <svg
                      className='w-12 h-12 mx-auto mb-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                      />
                    </svg>
                  </div>
                  <h3 className='font-medium text-lg mb-2'>
                    No Available Equipment
                  </h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    There is currently no equipment available for borrowing.
                    Equipment may be:
                  </p>
                  <ul className='text-sm text-muted-foreground space-y-1 mb-4'>
                    <li>• Currently borrowed by other students</li>
                    <li>• Under maintenance or damaged</li>
                    <li>• Not yet added to the inventory</li>
                  </ul>
                  <p className='text-sm text-muted-foreground'>
                    Please contact your equipment manager for assistance.
                  </p>
                </div>
              )}

              {/* No search results */}
              {availableEquipment &&
                availableEquipment.length > 0 &&
                filteredEquipment.length === 0 &&
                searchQuery && (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <div className='text-muted-foreground mb-2'>
                      <Search className='w-12 h-12 mx-auto mb-4' />
                    </div>
                    <h3 className='font-medium text-lg mb-2'>
                      No Equipment Found
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      No equipment matches your search for "{searchQuery}". Try
                      a different search term.
                    </p>
                  </div>
                )}

              {/* Equipment list */}
              {availableEquipment &&
                availableEquipment.length > 0 &&
                filteredEquipment.length > 0 && (
                  <>
                    <div className='text-sm text-muted-foreground mb-2'>
                      Select one or more equipment items to issue:
                      {searchQuery && (
                        <span className='ml-2'>
                          ({filteredEquipment.length} of{' '}
                          {availableEquipment.length} items)
                        </span>
                      )}
                    </div>
                    {filteredEquipment.map(equipment => {
                      const isSelected = form
                        .watch('equipment_ids')
                        .includes(equipment.id);
                      return (
                        <div
                          key={equipment.id}
                          className={`flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleEquipmentToggle(equipment.id)}
                        >
                          {/* Equipment Image */}
                          <div className='flex-shrink-0 self-start'>
                            {equipment.images && equipment.images.length > 0 ? (
                              <img
                                src={equipment.images[0]}
                                alt={equipment.name}
                                className='h-12 w-12 object-cover rounded-md border'
                              />
                            ) : (
                              <div className='h-12 w-12 bg-muted rounded-md border flex items-center justify-center'>
                                <Package className='h-6 w-6 text-muted-foreground' />
                              </div>
                            )}
                          </div>

                          {/* Equipment Details */}
                          <div className='flex-1 min-w-0 w-full'>
                            <div className='flex flex-col space-y-2'>
                              <div className='flex-1 min-w-0'>
                                <div className='font-medium text-sm sm:text-base break-words'>
                                  {equipment.name}
                                </div>
                                <p className='text-sm text-muted-foreground break-words'>
                                  {equipment.description}
                                </p>
                                {equipment.serial_number && (
                                  <p className='text-xs text-muted-foreground'>
                                    S/N: {equipment.serial_number}
                                  </p>
                                )}
                              </div>
                              <div className='flex flex-wrap gap-1 sm:gap-2'>
                                {equipment.category?.name && (
                                  <Badge variant='outline' className='text-xs'>
                                    {equipment.category.name}
                                  </Badge>
                                )}
                                {equipment.location?.name && (
                                  <Badge variant='outline' className='text-xs'>
                                    {equipment.location.name}
                                  </Badge>
                                )}
                                {equipment.condition_status && (
                                  <Badge
                                    variant={getConditionBadgeVariant(
                                      equipment.condition_status
                                    )}
                                    className='text-xs'
                                  >
                                    {equipment.condition_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
