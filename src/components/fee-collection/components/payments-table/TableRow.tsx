import React from 'react';
import { TableRow as UITableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { StudentPaymentSummary } from '@/types/fee';
import { StudentNameCell } from './StudentNameCell';
import { PaymentPlanCell } from './PaymentPlanCell';
import { ProgressCell } from './ProgressCell';
import { NextDueCell } from './NextDueCell';
import { StatusCell } from './StatusCell';
import { ActionsCell } from './ActionsCell';

interface FeeStructureData {
  id: string;
  cohort_id: string;
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TableRowProps {
  student: StudentPaymentSummary;
  selectedRows?: Set<string>;
  onStudentSelect: (student: StudentPaymentSummary) => void;
  onRowSelection?: (studentId: string, isSelected: boolean) => void;
  feeStructure?: FeeStructureData;
  onVerificationUpdate?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  student,
  selectedRows = new Set(),
  onStudentSelect,
  onRowSelection,
  feeStructure,
  onVerificationUpdate,
}) => {
  return (
    <UITableRow className='hover:bg-muted/50'>
      <TableCell className='w-12'>
        {onRowSelection && (
          <Checkbox
            checked={selectedRows.has(student.student_id)}
            onCheckedChange={checked => {
              onRowSelection(student.student_id, checked as boolean);
            }}
            onClick={e => e.stopPropagation()}
            aria-label={`Select ${student.student?.first_name} ${student.student?.last_name}`}
          />
        )}
      </TableCell>

      <StudentNameCell student={student} />
      <PaymentPlanCell student={student} />
      <ProgressCell student={student} feeStructure={feeStructure} />
      <NextDueCell student={student} feeStructure={feeStructure} />
      <StatusCell student={student} />
      <ActionsCell
        student={student}
        onStudentSelect={onStudentSelect}
        onVerificationUpdate={onVerificationUpdate}
        feeStructure={feeStructure}
      />
    </UITableRow>
  );
};
