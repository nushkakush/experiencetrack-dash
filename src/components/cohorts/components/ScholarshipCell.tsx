import React from 'react';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle } from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { Scholarship, StudentScholarshipWithDetails } from '@/types/fee';
import StudentScholarshipDialog from '../StudentScholarshipDialog';

interface ScholarshipCellProps {
  student: CohortStudent;
  scholarships: Scholarship[];
  hasScholarship: boolean;
  scholarshipDetails?: StudentScholarshipWithDetails;
  loading: boolean;
  isFeeSetupComplete: boolean;
  onScholarshipAssigned: (studentId: string) => void;
}

export const ScholarshipCell: React.FC<ScholarshipCellProps> = ({
  student,
  scholarships,
  hasScholarship,
  scholarshipDetails,
  loading,
  isFeeSetupComplete,
  onScholarshipAssigned,
}) => {
  return (
    <div className='space-y-3'>
      {/* Scholarship Section */}
      <div className='flex items-center justify-between'>
        {hasScholarship ? (
          <div className='min-w-0'>
            <div className='text-sm font-medium text-green-700 dark:text-green-300'>
              {scholarshipDetails?.scholarship?.name || 'Scholarship'}
            </div>
            <div className='text-xs text-muted-foreground'>
              {scholarshipDetails?.scholarship?.amount_percentage}%
              {scholarshipDetails?.additional_discount_percentage > 0 &&
                ` + ${scholarshipDetails?.additional_discount_percentage}% need based`}
            </div>
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>
            {!isFeeSetupComplete ? 'Fee setup required' : 'No scholarship'}
          </div>
        )}
        <StudentScholarshipDialog
          student={student}
          scholarships={scholarships}
          onScholarshipAssigned={onScholarshipAssigned}
        >
          <Button
            variant='ghost'
            size='sm'
            className={`h-8 w-8 p-0 hover:bg-primary/10 ${
              hasScholarship
                ? 'text-green-600 hover:text-green-700'
                : 'text-primary hover:text-primary/80'
            }`}
            title={
              !isFeeSetupComplete
                ? 'Complete fee setup first'
                : hasScholarship
                  ? 'Edit scholarship'
                  : 'Assign scholarship'
            }
            disabled={loading || !isFeeSetupComplete}
          >
            {hasScholarship ? (
              <CheckCircle className='h-4 w-4' />
            ) : (
              <Award className='h-4 w-4' />
            )}
          </Button>
        </StudentScholarshipDialog>
      </div>
    </div>
  );
};
