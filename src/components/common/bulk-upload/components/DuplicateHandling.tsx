import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DuplicateHandlingProps {
  value: 'ignore' | 'overwrite';
  onChange: (value: 'ignore' | 'overwrite') => void;
  duplicateCount: number;
}

export const DuplicateHandling = ({ value, onChange, duplicateCount }: DuplicateHandlingProps) => {
  if (duplicateCount === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">How should duplicates be handled?</h4>
        <p className="text-xs text-muted-foreground">
          {duplicateCount} potential duplicate{duplicateCount > 1 ? 's' : ''} found
        </p>
      </div>
      
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ignore" id="ignore" />
          <Label htmlFor="ignore" className="text-sm">
            Skip duplicates (recommended)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="overwrite" id="overwrite" />
          <Label htmlFor="overwrite" className="text-sm">
            Overwrite existing records
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
