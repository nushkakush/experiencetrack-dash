import React, { useState, useEffect } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BulletedInputProps {
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  maxItems?: number;
  className?: string;
}

export const BulletedInput: React.FC<BulletedInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Enter learning outcome...',
  label = 'Learning Outcomes',
  maxItems = 10,
  className,
}) => {
  const [items, setItems] = useState<string[]>(value);

  useEffect(() => {
    setItems(value);
  }, [value]);

  const addItem = () => {
    if (items.length < maxItems) {
      const newItems = [...items, ''];
      setItems(newItems);
      onChange(newItems);
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  const updateItem = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    setItems(newItems);
    onChange(newItems);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    onChange(newItems);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>{label}</Label>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={addItem}
          disabled={items.length >= maxItems}
          className='h-8 px-2'
        >
          <Plus className='h-4 w-4 mr-1' />
          Add Outcome
        </Button>
      </div>

      <div className='space-y-2'>
        {items.length === 0 ? (
          <div className='text-sm text-muted-foreground text-center py-4 border-2 border-dashed border-gray-300 rounded-lg'>
            No learning outcomes added yet. Click "Add Outcome" to get started.
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className='flex items-center space-x-2 p-2 border rounded-lg bg-background'
            >
              <div className='flex items-center space-x-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0 cursor-move'
                  disabled={index === 0}
                  onClick={() => moveItem(index, index - 1)}
                >
                  <GripVertical className='h-3 w-3' />
                </Button>
                <span className='text-sm text-muted-foreground w-4 text-center'>
                  {index + 1}.
                </span>
              </div>

              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={placeholder}
                className='flex-1'
              />

              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => removeItem(index)}
                className='h-8 w-8 p-0 text-destructive hover:text-destructive'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className='text-xs text-muted-foreground'>
          {items.length} of {maxItems} outcomes added
        </div>
      )}
    </div>
  );
};
