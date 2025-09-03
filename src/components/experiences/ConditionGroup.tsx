import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConditionRow } from './ConditionRow';
import type { ConditionTree, ConditionOption } from '@/types/experience';
import { createEmptyCondition, createEmptyGroup } from '@/types/conditions';

interface ConditionGroupProps {
  group: ConditionTree;
  onChange: (group: ConditionTree) => void;
  onDelete: () => void;
  availableFields: ConditionOption[];
  depth: number;
  canDelete?: boolean;
}

export const ConditionGroup: React.FC<ConditionGroupProps> = ({
  group,
  onChange,
  onDelete,
  availableFields,
  depth,
  canDelete = true
}) => {
  const handleOperatorChange = (operator: string) => {
    onChange({
      ...group,
      operator: operator as 'AND' | 'OR',
    });
  };

  const handleAddCondition = () => {
    const newCondition = createEmptyCondition();
    onChange({
      ...group,
      conditions: [...(group.conditions || []), newCondition],
    });
  };

  const handleAddGroup = () => {
    const newGroup = createEmptyGroup();
    onChange({
      ...group,
      conditions: [...(group.conditions || []), newGroup],
    });
  };

  const handleConditionChange = (index: number, updatedCondition: ConditionTree) => {
    const newConditions = [...(group.conditions || [])];
    newConditions[index] = updatedCondition;
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const handleDeleteCondition = (index: number) => {
    const newConditions = [...(group.conditions || [])];
    newConditions.splice(index, 1);
    
    // If no conditions left, add an empty one
    if (newConditions.length === 0) {
      newConditions.push(createEmptyCondition());
    }
    
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const borderColor = depth % 2 === 0 ? 'border-blue-200' : 'border-green-200';
  const bgColor = depth % 2 === 0 ? 'bg-blue-50/50' : 'bg-green-50/50';

  return (
    <div className={`border-2 ${borderColor} ${bgColor} rounded-lg p-4 space-y-3`}>
      {/* Group Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Layers className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm font-medium text-muted-foreground'>
            Group (depth {depth})
          </span>
        </div>
        
        <div className='flex items-center space-x-2'>
          {/* Operator Selector */}
          <Select value={group.operator || 'AND'} onValueChange={handleOperatorChange}>
            <SelectTrigger className='w-20'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='AND'>AND</SelectItem>
              <SelectItem value='OR'>OR</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Delete Group Button */}
          {canDelete && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onDelete}
              className='h-8 w-8 p-0 text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Conditions */}
      <div className='space-y-2'>
        {group.conditions?.map((condition, index) => (
          <div key={condition.id}>
            {condition.type === 'condition' ? (
              <ConditionRow
                condition={condition}
                onChange={(updated) => handleConditionChange(index, updated)}
                onDelete={() => handleDeleteCondition(index)}
                availableFields={availableFields}
                canDelete={(group.conditions?.length || 0) > 1}
              />
            ) : (
              <ConditionGroup
                group={condition}
                onChange={(updated) => handleConditionChange(index, updated)}
                onDelete={() => handleDeleteCondition(index)}
                availableFields={availableFields}
                depth={depth + 1}
                canDelete={true}
              />
            )}
            
            {/* Show operator between conditions */}
            {index < (group.conditions?.length || 0) - 1 && (
              <div className='text-center py-1'>
                <span className='text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded'>
                  {group.operator}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Buttons */}
      <div className='flex items-center space-x-2 pt-2 border-t border-muted'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleAddCondition}
        >
          <Plus className='h-3 w-3 mr-1' />
          Add Condition
        </Button>
        
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleAddGroup}
        >
          <Layers className='h-3 w-3 mr-1' />
          Add Group
        </Button>
      </div>
    </div>
  );
};
