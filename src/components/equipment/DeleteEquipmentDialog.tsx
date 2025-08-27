import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Equipment } from '@/types/equipment';
import { Trash2 } from 'lucide-react';

interface DeleteEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onConfirm: (equipment: Equipment) => Promise<void>;
  isLoading?: boolean;
}

export const DeleteEquipmentDialog: React.FC<DeleteEquipmentDialogProps> = ({
  open,
  onOpenChange,
  equipment,
  onConfirm,
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    if (equipment) {
      await onConfirm(equipment);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <Trash2 className='h-5 w-5 text-red-600' />
            Delete Equipment
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{equipment?.name}"? This action
            cannot be undone.
            {equipment?.serial_number && (
              <span className='block mt-2 text-sm text-muted-foreground'>
                Serial Number: {equipment.serial_number}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {isLoading ? 'Deleting...' : 'Delete Equipment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
