import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  X,
  Filter,
  Calendar,
  MapPin,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  EquipmentCategory,
  EquipmentLocation,
} from '@/domains/equipment/types';

export interface EquipmentFilters {
  search?: string;
  category_id?: string;
  condition_status?: string;
  availability_status?: string;
  location_id?: string;
  date_from?: string;
  date_to?: string;
  price_min?: number;
  price_max?: number;
}

interface EquipmentFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EquipmentFilters;
  onApplyFilters: (filters: EquipmentFilters) => void;
  onClearFilters: () => void;
  categories?: EquipmentCategory[];
  locations?: EquipmentLocation[];
}

const conditionOptions = [
  { value: 'excellent', label: 'Excellent', icon: '🟢' },
  { value: 'good', label: 'Good', icon: '🟡' },
  { value: 'poor', label: 'Poor', icon: '🔴' },
  { value: 'damaged', label: 'Damaged', icon: '⚠️' },
  { value: 'under_repair', label: 'Under Repair', icon: '🔧' },
  { value: 'lost', label: 'Lost', icon: '❌' },
  { value: 'decommissioned', label: 'Decommissioned', icon: '🚫' },
];

const availabilityOptions = [
  { value: 'available', label: 'Available', icon: '✅' },
  { value: 'borrowed', label: 'Borrowed', icon: '📦' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'retired', label: 'Retired', icon: '🏁' },
  { value: 'lost', label: 'Lost', icon: '❌' },
  { value: 'decommissioned', label: 'Decommissioned', icon: '🚫' },
];

export const EquipmentFilterDialog: React.FC<EquipmentFilterDialogProps> = ({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onClearFilters,
  categories = [],
  locations = [],
}) => {
  const [localFilters, setLocalFilters] = useState<EquipmentFilters>(filters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  const updateFilter = (key: keyof EquipmentFilters, value: unknown) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const removeFilter = (key: keyof EquipmentFilters) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).filter(
      key =>
        localFilters[key as keyof EquipmentFilters] !== undefined &&
        localFilters[key as keyof EquipmentFilters] !== ''
    ).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filter Equipment
          </DialogTitle>
          <DialogDescription>
            Apply filters to find specific equipment. You can combine multiple
            filters.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Active Filters</Label>
              <div className='flex flex-wrap gap-2'>
                {Object.entries(localFilters).map(([key, value]) => {
                  if (!value || value === '') return null;

                  let displayValue = value;
                  let icon = '🏷️';

                  // Format display values
                  if (key === 'category_id') {
                    const category = categories.find(c => c.id === value);
                    displayValue = category?.name || value;
                    icon = '📂';
                  } else if (key === 'location_id') {
                    const location = locations.find(l => l.id === value);
                    displayValue = location?.name || value;
                    icon = '📍';
                  } else if (key === 'condition_status') {
                    const option = conditionOptions.find(
                      o => o.value === value
                    );
                    displayValue = option?.label || value;
                    icon = option?.icon || '🔧';
                  } else if (key === 'availability_status') {
                    const option = availabilityOptions.find(
                      o => o.value === value
                    );
                    displayValue = option?.label || value;
                    icon = option?.icon || '📦';
                  } else if (key === 'date_from' || key === 'date_to') {
                    displayValue = new Date(value).toLocaleDateString();
                    icon = '📅';
                  } else if (key === 'price_min' || key === 'price_max') {
                    displayValue = `$${value}`;
                    icon = '💰';
                  }

                  return (
                    <Badge key={key} variant='secondary' className='gap-1'>
                      <span>{icon}</span>
                      <span className='capitalize'>
                        {key.replace('_', ' ')}: {displayValue}
                      </span>
                      <button
                        onClick={() =>
                          removeFilter(key as keyof EquipmentFilters)
                        }
                        className='ml-1 hover:text-red-500'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className='space-y-2'>
            <Label htmlFor='search'>Search Equipment</Label>
            <Input
              id='search'
              placeholder='Search by name, description, or serial number...'
              value={localFilters.search || ''}
              onChange={e => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Category and Location */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='category'>Category</Label>
              <Select
                value={localFilters.category_id || 'all'}
                onValueChange={value => updateFilter('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='location'>Location</Label>
              <Select
                value={localFilters.location_id || 'all'}
                onValueChange={value => updateFilter('location_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Locations' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Condition and Availability */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='condition'>Condition Status</Label>
              <Select
                value={localFilters.condition_status || 'all'}
                onValueChange={value => updateFilter('condition_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Conditions' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Conditions</SelectItem>
                  {conditionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className='flex items-center gap-2'>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='availability'>Availability Status</Label>
              <Select
                value={localFilters.availability_status || 'all'}
                onValueChange={value =>
                  updateFilter('availability_status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {availabilityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className='flex items-center gap-2'>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Date Range
            </Label>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <Label htmlFor='date_from' className='text-xs'>
                  From
                </Label>
                <Input
                  id='date_from'
                  type='date'
                  value={localFilters.date_from || ''}
                  onChange={e =>
                    updateFilter('date_from', e.target.value || undefined)
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='date_to' className='text-xs'>
                  To
                </Label>
                <Input
                  id='date_to'
                  type='date'
                  value={localFilters.date_to || ''}
                  onChange={e =>
                    updateFilter('date_to', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Package className='h-4 w-4' />
              Price Range
            </Label>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <Label htmlFor='price_min' className='text-xs'>
                  Min Price
                </Label>
                <Input
                  id='price_min'
                  type='number'
                  placeholder='0'
                  value={localFilters.price_min || ''}
                  onChange={e =>
                    updateFilter(
                      'price_min',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='price_max' className='text-xs'>
                  Max Price
                </Label>
                <Input
                  id='price_max'
                  type='number'
                  placeholder='1000'
                  value={localFilters.price_max || ''}
                  onChange={e =>
                    updateFilter(
                      'price_max',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex justify-between'>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleReset}>
              Reset
            </Button>
            <Button variant='outline' onClick={handleClear}>
              Clear All
            </Button>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters ({getActiveFiltersCount()})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
