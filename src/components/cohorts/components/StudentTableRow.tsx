import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CohortStudent } from '@/types/cohort';
import { Scholarship } from '@/types/fee';
import { StudentScholarshipWithDetails } from '@/types/fee';
import { StudentPaymentPlan } from '@/services/studentPaymentPlan.service';
import { ScholarshipCell } from './ScholarshipCell';
import { PaymentPlanCell } from './PaymentPlanCell';
import { StudentActions } from './StudentActions';
import { BulkSelectionCheckbox } from './index';

interface StudentTableRowProps {
  student: CohortStudent;
  scholarships: Scholarship[];
  scholarshipAssignments: Record<string, boolean>;
  scholarshipDetails: Record<string, StudentScholarshipWithDetails>;
  loadingScholarships: boolean;
  updatingScholarshipId: string | null;
  paymentPlanAssignments: Record<string, boolean>;
  paymentPlanDetails: Record<string, StudentPaymentPlan>;
  loadingPaymentPlans: boolean;
  updatingPaymentPlanId: string | null;
  customFeeStructures: Record<string, boolean>;
  isFeeSetupComplete: boolean;
  deletingStudentId: string | null;
  invitingStudentId: string | null;
  canManageStudents: boolean;
  canEditStudents: boolean;
  canAssignScholarships: boolean;
  onStudentUpdated?: (
    studentId: string,
    updates: Partial<CohortStudent>
  ) => void;
  onStudentDeleted: () => void;
  onScholarshipAssigned: (studentId: string) => void;
  onPaymentPlanUpdated: (studentId: string) => void;
  onOpenEmailConfirmation: (student: CohortStudent) => void;
  onMarkAsDroppedOut: (student: CohortStudent) => void;
  onDeleteStudent: (studentId: string) => void;
  shouldShowEmailOption: (student: CohortStudent) => boolean;
  // Bulk selection props
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  isBulkProcessing?: boolean;
}

export const StudentTableRow: React.FC<StudentTableRowProps> = ({
  student,
  scholarships,
  scholarshipAssignments,
  scholarshipDetails,
  loadingScholarships,
  updatingScholarshipId,
  paymentPlanAssignments,
  paymentPlanDetails,
  loadingPaymentPlans,
  updatingPaymentPlanId,
  customFeeStructures,
  isFeeSetupComplete,
  deletingStudentId,
  invitingStudentId,
  canManageStudents,
  canEditStudents,
  canAssignScholarships,
  onStudentUpdated,
  onStudentDeleted,
  onScholarshipAssigned,
  onPaymentPlanUpdated,
  onOpenEmailConfirmation,
  onMarkAsDroppedOut,
  onDeleteStudent,
  shouldShowEmailOption,
  // Bulk selection props
  isSelected = false,
  onSelectChange,
  isBulkProcessing = false,
}) => {
  return (
    <TableRow key={student.id}>
      {/* Bulk Selection Checkbox */}
      <TableCell className='w-12'>
        <BulkSelectionCheckbox
          checked={isSelected}
          onCheckedChange={onSelectChange || (() => {})}
          disabled={isBulkProcessing}
        />
      </TableCell>

      {/* Student Info */}
      <TableCell>
        <div className='flex items-center gap-3'>
          <UserAvatar
            avatarUrl={null}
            name={
              `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
              student.email
            }
            size='md'
            userId={student.user_id}
          />
          <div className='min-w-0 flex-1'>
            <div className='font-medium text-sm'>
              {student.first_name} {student.last_name}
            </div>
            <div className='text-xs text-muted-foreground truncate'>
              {student.email}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              student.invite_status === 'accepted'
                ? 'default'
                : student.invite_status === 'declined'
                  ? 'destructive'
                  : student.invite_status === 'sent'
                    ? 'secondary'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }
          >
            {student.invite_status}
          </Badge>
          {student.dropped_out_status === 'dropped_out' && (
            <Badge variant='destructive' className='text-xs'>
              Dropped Out
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Phone */}
      <TableCell className='text-sm text-muted-foreground'>
        {student.phone || '—'}
      </TableCell>

      {/* Scholarship */}
      {canAssignScholarships && (
        <TableCell>
          <ScholarshipCell
            student={student}
            scholarships={scholarships}
            hasScholarship={scholarshipAssignments[student.id]}
            scholarshipDetails={scholarshipDetails[student.id]}
            loading={
              loadingScholarships || updatingScholarshipId === student.id
            }
            isFeeSetupComplete={isFeeSetupComplete}
            onScholarshipAssigned={onScholarshipAssigned}
          />
        </TableCell>
      )}

      {/* Payment Plan */}
      {canAssignScholarships && (
        <TableCell>
          <PaymentPlanCell
            student={student}
            hasPaymentPlan={
              paymentPlanAssignments[student.id] &&
              paymentPlanDetails[student.id]?.payment_plan
            }
            paymentPlanDetails={paymentPlanDetails[student.id]}
            customFeeStructure={customFeeStructures[student.id]}
            loading={
              loadingPaymentPlans || updatingPaymentPlanId === student.id
            }
            isFeeSetupComplete={isFeeSetupComplete}
            onPaymentPlanUpdated={onPaymentPlanUpdated}
          />
        </TableCell>
      )}

      {/* Actions */}
      {canManageStudents && (
        <TableCell>
          <StudentActions
            student={student}
            canEditStudents={canEditStudents}
            deletingStudentId={deletingStudentId}
            invitingStudentId={invitingStudentId}
            onStudentUpdated={onStudentUpdated}
            onStudentDeleted={onStudentDeleted}
            onOpenEmailConfirmation={onOpenEmailConfirmation}
            onMarkAsDroppedOut={onMarkAsDroppedOut}
            onDeleteStudent={onDeleteStudent}
            shouldShowEmailOption={shouldShowEmailOption}
          />
        </TableCell>
      )}
    </TableRow>
  );
};
