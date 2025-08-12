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
}

export default function Step2Scholarships({
  scholarships,
  onScholarshipsChange,
  errors
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
      <ScholarshipHeader hasOverlappingScholarships={hasOverlappingScholarships} />

      {scholarships.map((scholarship, index) => (
        <ScholarshipCard
          key={scholarship.id}
          scholarship={scholarship}
          index={index}
          onRemove={removeScholarship}
          onUpdate={updateScholarship}
          getFieldError={getFieldError}
          getOverlapError={getOverlapError}
        />
      ))}

      <AddScholarshipButton onAdd={addScholarship} />
    </div>
  );
}
