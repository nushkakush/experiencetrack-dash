import React from 'react';

interface ScholarshipHeaderProps {
  hasOverlappingScholarships: boolean;
}

export const ScholarshipHeader: React.FC<ScholarshipHeaderProps> = ({
  hasOverlappingScholarships
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Configure Scholarships</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Define scholarships based on test scores. Each scholarship should have a unique range.
      </p>
      
      {hasOverlappingScholarships && (
        <div className="bg-red-950/20 border border-red-800 rounded-lg p-4 mb-4">
          <h4 className="text-red-300 font-medium mb-2">⚠️ Overlapping Scholarships Detected</h4>
          <p className="text-red-200 text-sm">
            Some scholarships have overlapping test score ranges. Please fix the overlaps before saving.
          </p>
        </div>
      )}
    </div>
  );
};
