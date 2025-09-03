import React from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConditionGroup } from './ConditionGroup';
import { ConditionRow } from './ConditionRow';
import type { ConditionTree, ConditionOption, RubricSection } from '@/types/experience';
import { generateConditionFields, generateConditionDescription, createEmptyGroup, createEmptyCondition } from '@/types/conditions';

interface ConditionBuilderProps {
  label: string;
  conditions?: ConditionTree;
  onChange: (conditions: ConditionTree) => void;
  rubricSections: RubricSection[];
  placeholder?: string;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  label,
  conditions,
  onChange,
  rubricSections,
  placeholder = 'No conditions set'
}) => {
  const [showPreview, setShowPreview] = React.useState(true);
  
  const availableFields = React.useMemo(() => 
    generateConditionFields(rubricSections), 
    [rubricSections]
  );

  const conditionDescription = React.useMemo(() => {
    if (!conditions) return '';
    return generateConditionDescription(conditions, availableFields);
  }, [conditions, availableFields]);

  const initializeConditions = () => {
    if (availableFields.length === 0) {
      // If no rubric sections available, create a basic overall score condition
      const basicCondition = createEmptyCondition();
      onChange(basicCondition);
    } else {
      // Create a simple group with one condition
      const initialGroup = createEmptyGroup();
      onChange(initialGroup);
    }
  };

  const handleConditionChange = (updatedConditions: ConditionTree) => {
    onChange(updatedConditions);
  };

  if (availableFields.length === 0) {
    return (
      <div className='space-y-2'>
        <Label className='text-sm font-medium'>{label}</Label>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Please create grading rubric sections first to define conditions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>{label}</Label>
        {conditions && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className='h-3 w-3 mr-1' />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className='h-3 w-3 mr-1' />
                Show Preview
              </>
            )}
          </Button>
        )}
      </div>

      {/* Condition Builder */}
      {!conditions ? (
        <div className='border-2 border-dashed border-muted rounded-lg p-8 text-center'>
          <p className='text-muted-foreground mb-4'>{placeholder}</p>
          <Button type='button' onClick={initializeConditions}>
            Add Condition
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {conditions.type === 'group' ? (
            <ConditionGroup
              group={conditions}
              onChange={handleConditionChange}
              onDelete={() => onChange(createEmptyCondition())}
              availableFields={availableFields}
              depth={0}
              canDelete={false}
            />
          ) : (
            <ConditionRow
              condition={conditions}
              onChange={handleConditionChange}
              onDelete={() => {}}
              availableFields={availableFields}
              canDelete={false}
            />
          )}
        </div>
      )}

      {/* Preview */}
      {conditions && showPreview && conditionDescription && (
        <div className='bg-muted/30 p-3 rounded-lg'>
          <div className='text-xs text-muted-foreground mb-1'>Preview:</div>
          <div className='text-sm font-mono'>{conditionDescription}</div>
        </div>
      )}

      {/* Helper Text */}
      <div className='text-xs text-muted-foreground'>
        Build complex conditions using AND/OR logic. Conditions can reference overall scores or specific rubric criteria.
      </div>
    </div>
  );
};
