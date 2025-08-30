import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface BulkSelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  selectedCount?: number;
  totalCount?: number;
}

export default function BulkSelectionCheckbox({
  checked,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  showSelectAll = false,
  onSelectAll,
  onClearSelection,
  selectedCount = 0,
  totalCount = 0,
}: BulkSelectionCheckboxProps) {
  if (showSelectAll) {
    return (
      <div className='flex items-center gap-2'>
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          ref={el => {
            if (el) {
              el.indeterminate = indeterminate;
            }
          }}
        />
        {selectedCount > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onClearSelection}
            className='h-auto p-1 text-xs text-muted-foreground hover:text-foreground'
          >
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  );
}
