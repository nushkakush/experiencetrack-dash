import React from 'react';
import { CohortStudent } from '@/types/cohort';

interface StudentInfoProps {
  student: CohortStudent;
  cohortName: string;
}

export const StudentInfo: React.FC<StudentInfoProps> = ({ student, cohortName }) => {
  return (
    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
      <div className="text-sm text-blue-800 dark:text-blue-200">
        <p><strong>Name:</strong> {student.first_name} {student.last_name}</p>
        <p><strong>Email:</strong> {student.email}</p>
        {cohortName && <p><strong>Cohort:</strong> {cohortName}</p>}
      </div>
    </div>
  );
};
