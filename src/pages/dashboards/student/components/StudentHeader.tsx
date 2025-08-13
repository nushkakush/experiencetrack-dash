import React from 'react';
import { CohortStudent } from '@/types/cohort';

interface StudentHeaderProps {
  studentData: CohortStudent;
  cohortData: any;
}

export const StudentHeader = React.memo<StudentHeaderProps>(({ studentData, cohortData }) => {
  return (
    <div className="flex items-center justify-between">
      {/* Header content removed as requested */}
    </div>
  );
});

StudentHeader.displayName = 'StudentHeader';
