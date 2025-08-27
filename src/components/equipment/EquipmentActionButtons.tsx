import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EquipmentActionButtonsProps {
  equipmentId: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const EquipmentActionButtons: React.FC<EquipmentActionButtonsProps> = ({
  equipmentId,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {onView && (
          <DropdownMenuItem onClick={() => onView(equipmentId)}>
            <Eye className='mr-2 h-4 w-4' />
            View
          </DropdownMenuItem>
        )}
        {onEdit && canEdit && (
          <DropdownMenuItem onClick={() => onEdit(equipmentId)}>
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && canDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(equipmentId)}
            className='text-destructive focus:text-destructive'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EquipmentActionButtons;
