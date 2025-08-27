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
import { AlertTriangle, Package } from 'lucide-react';

interface MarkEquipmentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentName: string;
  action: 'lost' | 'damaged' | 'active' | 'retired';
  onConfirm: () => void;
  isLoading?: boolean;
}

export const MarkEquipmentStatusDialog: React.FC<
  MarkEquipmentStatusDialogProps
> = ({
  open,
  onOpenChange,
  equipmentName,
  action,
  onConfirm,
  isLoading = false,
}) => {
  const getActionConfig = () => {
    switch (action) {
      case 'lost':
        return {
          title: 'Mark Equipment as Lost',
          description: `Are you sure you want to mark "${equipmentName}" as lost? This will update the equipment status and move it to the Lost tab.`,
          icon: AlertTriangle,
          confirmText: 'Mark as Lost',
          variant: 'destructive' as const,
        };
      case 'damaged':
        return {
          title: 'Mark Equipment as Damaged',
          description: `Are you sure you want to mark "${equipmentName}" as damaged? This will update the equipment status and move it to the Damaged tab.`,
          icon: AlertTriangle,
          confirmText: 'Mark as Damaged',
          variant: 'destructive' as const,
        };
      case 'active':
        return {
          title: 'Mark Equipment as Active',
          description: `Are you sure you want to mark "${equipmentName}" as active? This will make the equipment available for borrowing again.`,
          icon: Package,
          confirmText: 'Mark as Active',
          variant: 'default' as const,
        };
      case 'retired':
        return {
          title: 'Mark Equipment as Retired',
          description: `Are you sure you want to mark "${equipmentName}" as retired? This will decommission the equipment and move it to the Lost tab.`,
          icon: AlertTriangle,
          confirmText: 'Mark as Retired',
          variant: 'destructive' as const,
        };
      default:
        return {
          title: 'Update Equipment Status',
          description: `Are you sure you want to update the status of "${equipmentName}"?`,
          icon: Package,
          confirmText: 'Confirm',
          variant: 'default' as const,
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <IconComponent className='h-5 w-5' />
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-left'>
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              config.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {isLoading ? 'Updating...' : config.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
