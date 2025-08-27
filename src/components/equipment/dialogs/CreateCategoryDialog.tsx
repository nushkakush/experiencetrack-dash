import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateCategory } from '@/hooks/equipment/useEquipment';

interface CreateCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  onCategoryNameChange: (name: string) => void;
}

export const CreateCategoryDialog: React.FC<CreateCategoryDialogProps> = ({
  open,
  onClose,
  categoryName,
  onCategoryNameChange,
}) => {
  const createCategory = useCreateCategory();

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await createCategory.mutateAsync({ name: categoryName.trim() });
      onCategoryNameChange('');
      onClose();
      toast.success('Category created successfully');
    } catch (error) {
      console.error('Failed to create category:', error);
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
          Create New Category
        </h3>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='category-name' className='text-foreground'>
              Category Name
            </Label>
            <Input
              id='category-name'
              value={categoryName}
              onChange={e => onCategoryNameChange(e.target.value)}
              placeholder='Enter category name'
              className='bg-background text-foreground border-border'
            />
          </div>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleCreateCategory}
              disabled={createCategory.isPending}
            >
              {createCategory.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
