import React from 'react';
import { CohortStudent } from '@/types/cohort';

interface StudentHeaderProps {
  studentData: CohortStudent;
  cohortData: any;
}

export const StudentHeader = React.memo<StudentHeaderProps>(({ studentData, cohortData }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {studentData.first_name}!
        </h1>
        <p className="text-muted-foreground text-left">
          {cohortData.name} • {cohortData.course_name}
        </p>
      </div>
    </div>
  );
});

StudentHeader.displayName = 'StudentHeader';
