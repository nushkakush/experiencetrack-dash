import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ConditionTree, ConditionOption, COMPARISON_OPERATORS } from '@/types/experience';

interface ConditionRowProps {
  condition: ConditionTree;
  onChange: (condition: ConditionTree) => void;
  onDelete: () => void;
  availableFields: ConditionOption[];
  canDelete?: boolean;
}

export const ConditionRow: React.FC<ConditionRowProps> = ({
  condition,
  onChange,
  onDelete,
  availableFields,
  canDelete = true
}) => {
  const handleFieldChange = (fieldValue: string) => {
    const field = availableFields.find(f => f.value === fieldValue);
    if (!field) return;

    onChange({
      ...condition,
      field_type: field.type,
      field_reference: field.reference,
    });
  };

  const handleOperatorChange = (operator: string) => {
    onChange({
      ...condition,
      comparison_operator: operator as any,
    });
  };

  const handleValueChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange({
        ...condition,
        value: numValue,
      });
    }
  };

  const handleNegativeChange = (isNegative: boolean) => {
    onChange({
      ...condition,
      is_negative: isNegative,
    });
  };

  const getCurrentFieldValue = () => {
    if (condition.field_type === 'overall_score') {
      return 'overall_score';
    } else if (condition.field_type === 'rubric_section' && condition.field_reference) {
      return `section_${condition.field_reference}`;
    } else if (condition.field_type === 'rubric_criteria' && condition.field_reference) {
      return `criteria_${condition.field_reference}`;
    }
    return '';
  };

  const comparisonOperators = [
    { value: '>=', label: 'greater than or equal to (≥)', symbol: '≥' },
    { value: '<=', label: 'less than or equal to (≤)', symbol: '≤' },
    { value: '>', label: 'greater than (>)', symbol: '>' },
    { value: '<', label: 'less than (<)', symbol: '<' },
    { value: '=', label: 'equal to (=)', symbol: '=' },
    { value: '!=', label: 'not equal to (≠)', symbol: '≠' }
  ];

  return (
    <div className='space-y-3 p-3 border rounded-lg bg-background'>
      {/* "No" Condition Toggle */}
      <div className='flex items-center space-x-2'>
        <Checkbox
          id={`negative-${condition.id}`}
          checked={condition.is_negative || false}
          onCheckedChange={handleNegativeChange}
        />
        <Label htmlFor={`negative-${condition.id}`} className='text-sm font-medium'>
          No (invert condition)
        </Label>
      </div>

      {/* Condition Builder */}
      <div className='flex items-center space-x-2'>
        {/* Field Selector */}
        <div className='flex-1 min-w-0'>
          <Select value={getCurrentFieldValue()} onValueChange={handleFieldChange}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select field...' />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comparison Operator */}
        <div className='w-32'>
          <Select 
            value={condition.comparison_operator || ''} 
            onValueChange={handleOperatorChange}
          >
            <SelectTrigger>
              <SelectValue placeholder='Op' />
            </SelectTrigger>
            <SelectContent>
              {comparisonOperators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Input */}
        <div className='w-20'>
          <Input
            type='number'
            step='0.1'
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder='Value'
          />
        </div>

        {/* Delete Button */}
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
  );
};
