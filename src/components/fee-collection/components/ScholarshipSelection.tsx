import React from 'react';
import { Button } from '@/components/ui/button';
import { Scholarship } from '@/types/fee';
import { getScholarshipColorScheme } from '../utils/scholarshipColors';

interface ScholarshipSelectionProps {
  scholarships: Scholarship[];
  selectedScholarshipId: string;
  onScholarshipSelect: (scholarshipId: string) => void;
  isReadOnly?: boolean;
}

export const ScholarshipSelection: React.FC<ScholarshipSelectionProps> = ({
  scholarships,
  selectedScholarshipId,
  onScholarshipSelect,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">
        {isReadOnly ? 'Select Scholarship to Preview:' : 'Select Scholarship:'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedScholarshipId === 'no_scholarship' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onScholarshipSelect('no_scholarship')}
          className={selectedScholarshipId === 'no_scholarship' ? 'bg-primary text-primary-foreground' : ''}
        >
          No Scholarship
        </Button>
        {scholarships.map((scholarship, index) => {
          const colorScheme = getScholarshipColorScheme(index);
          const isSelected = selectedScholarshipId === scholarship.id;
          return (
            <Button
              key={scholarship.id}
              variant="outline"
              size="sm"
              onClick={() => onScholarshipSelect(scholarship.id)}
              className={isSelected ? colorScheme.selected : colorScheme.unselected}
            >
              {scholarship.name} ({scholarship.amount_percentage}%)
            </Button>
          );
        })}
      </div>
    </div>
  );
};
