import React from 'react';
import { Scholarship } from '@/types/fee';
import { useScholarshipManagement } from './hooks/useScholarshipManagement';
import { ScholarshipHeader } from './components/ScholarshipHeader';
import { ScholarshipCard } from './components/ScholarshipCard';
import { AddScholarshipButton } from './components/AddScholarshipButton';

interface Step2ScholarshipsProps {
  scholarships: Scholarship[];
  onScholarshipsChange: (scholarships: Scholarship[]) => void;
  errors: Record<string, string>;
  isReadOnly?: boolean;
}

export default function Step2Scholarships({
  scholarships,
  onScholarshipsChange,
  errors,
  isReadOnly = false
}: Step2ScholarshipsProps) {
  const {
    hasOverlappingScholarships,
    addScholarship,
    removeScholarship,
    updateScholarship,
    getFieldError,
    getOverlapError
  } = useScholarshipManagement({
    scholarships,
    onScholarshipsChange,
    errors
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isReadOnly ? 'Scholarships Overview' : 'Step 2: Scholarships'}
        </h2>
        <p className="text-muted-foreground">
          {isReadOnly 
            ? 'Current scholarship configuration for this cohort'
            : 'Configure scholarships and discounts for students'
          }
        </p>
      </div>

      <ScholarshipHeader hasOverlappingScholarships={hasOverlappingScholarships} />

      {scholarships.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{isReadOnly ? 'No scholarships configured' : 'No scholarships added yet'}</p>
        </div>
      ) : (
        scholarships.map((scholarship, index) => (
          <ScholarshipCard
            key={scholarship.id}
            scholarship={scholarship}
            index={index}
            onRemove={isReadOnly ? undefined : removeScholarship}
            onUpdate={isReadOnly ? undefined : updateScholarship}
            getFieldError={getFieldError}
            getOverlapError={getOverlapError}
            isReadOnly={isReadOnly}
          />
        ))
      )}

      {!isReadOnly && <AddScholarshipButton onAdd={addScholarship} />}
    </div>
  );
}
