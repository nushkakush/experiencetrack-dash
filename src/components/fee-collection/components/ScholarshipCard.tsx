import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { Scholarship } from '@/types/fee';
import { SCHOLARSHIP_COLORS } from '../constants';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Scholarship, value: string) => void;
  getFieldError: (index: number, field: string) => string | undefined;
  getOverlapError: (index: number) => string | undefined;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({
  scholarship,
  index,
  onRemove,
  onUpdate,
  getFieldError,
  getOverlapError
}) => {
  const colorScheme = SCHOLARSHIP_COLORS[index % SCHOLARSHIP_COLORS.length];
  const nameError = getFieldError(index, 'name');
  const amountError = getFieldError(index, 'amount');
  const rangeError = getFieldError(index, 'range');
  const overlapError = getOverlapError(index);

  return (
    <Card className={`relative ${colorScheme.border} ${colorScheme.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base ${colorScheme.text}`}>
            Scholarship {index + 1}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`name-${index}`} className="text-foreground">
              Scholarship Name
            </Label>
            <Input
              id={`name-${index}`}
              value={scholarship.name}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              placeholder="e.g., Merit Scholarship"
              className={`${nameError ? 'border-red-500' : ''} bg-background border-input`}
            />
            {nameError && (
              <p className="text-red-400 text-xs mt-1">{nameError}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor={`amount-${index}`} className="text-foreground">
              Amount (%)
            </Label>
            <Input
              id={`amount-${index}`}
              type="number"
              value={scholarship.amount_percentage.toString()}
              onChange={(e) => onUpdate(index, 'amount_percentage', e.target.value)}
              placeholder="15"
              min="0"
              max="100"
              step="0.01"
              className={`${amountError ? 'border-red-500' : ''} bg-background border-input`}
            />
            {amountError && (
              <p className="text-red-400 text-xs mt-1">{amountError}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={`description-${index}`} className="text-foreground">
            Description
          </Label>
          <Textarea
            id={`description-${index}`}
            value={scholarship.description}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder="Describe the scholarship criteria"
            rows={2}
            className="bg-background border-input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`start-${index}`} className="text-foreground">
              Start % (Test Score)
            </Label>
            <Input
              id={`start-${index}`}
              type="number"
              value={scholarship.start_percentage.toString()}
              onChange={(e) => onUpdate(index, 'start_percentage', e.target.value)}
              placeholder="85"
              min="0"
              max="100"
              step="0.01"
              className={`${rangeError ? 'border-red-500' : ''} bg-background border-input`}
            />
          </div>
          
          <div>
            <Label htmlFor={`end-${index}`} className="text-foreground">
              End % (Test Score)
            </Label>
            <Input
              id={`end-${index}`}
              type="number"
              value={scholarship.end_percentage.toString()}
              onChange={(e) => onUpdate(index, 'end_percentage', e.target.value)}
              placeholder="100"
              min="0"
              max="100"
              step="0.01"
              className={`${rangeError ? 'border-red-500' : ''} bg-background border-input`}
            />
          </div>
        </div>
        
        {rangeError && (
          <p className="text-red-400 text-xs">{rangeError}</p>
        )}
        
        {overlapError && (
          <div className="bg-red-950/20 border border-red-800 rounded-lg p-3">
            <p className="text-red-300 text-sm font-medium">⚠️ Overlap Error</p>
            <p className="text-red-200 text-xs">{overlapError}</p>
          </div>
        )}

        <div className={`${colorScheme.summary} border rounded-lg p-3`}>
          <p className={`${colorScheme.summaryText} text-sm`}>
            This scholarship applies to students with test scores between{' '}
            <span className="font-medium">{scholarship.start_percentage || '0'}%</span> and{' '}
            <span className="font-medium">{scholarship.end_percentage || '100'}%</span>.
            Students will receive a{' '}
            <span className="font-medium">{scholarship.amount_percentage || '0'}%</span> discount on their program fee.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
