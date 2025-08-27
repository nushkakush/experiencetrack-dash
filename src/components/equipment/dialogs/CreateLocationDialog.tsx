import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateLocation } from '@/hooks/equipment/useEquipment';

interface CreateLocationDialogProps {
  open: boolean;
  onClose: () => void;
  locationName: string;
  onLocationNameChange: (name: string) => void;
}

export const CreateLocationDialog: React.FC<CreateLocationDialogProps> = ({
  open,
  onClose,
  locationName,
  onLocationNameChange,
}) => {
  const createLocation = useCreateLocation();

  const handleCreateLocation = async () => {
    if (!locationName.trim()) {
      toast.error('Location name is required');
      return;
    }

    try {
      await createLocation.mutateAsync({ name: locationName.trim() });
      onLocationNameChange('');
      onClose();
      toast.success('Location created successfully');
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div
        className='bg-background border border-border rounded-lg p-6 w-96'
        onClick={e => e.stopPropagation()}
      >
        <h3 className='text-lg font-semibold mb-4 text-foreground'>
          Create New Location
        </h3>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='location-name' className='text-foreground'>
              Location Name
            </Label>
            <Input
              id='location-name'
              value={locationName}
              onChange={e => onLocationNameChange(e.target.value)}
              placeholder='Enter location name'
              className='bg-background text-foreground border-border'
            />
          </div>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleCreateLocation}
              disabled={createLocation.isPending}
            >
              {createLocation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
