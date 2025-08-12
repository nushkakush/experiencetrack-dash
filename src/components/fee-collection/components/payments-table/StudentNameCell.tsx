import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary } from '@/types/fee';

interface StudentNameCellProps {
  student: StudentPaymentSummary;
}

export const StudentNameCell: React.FC<StudentNameCellProps> = ({ student }) => {
  return (
    <TableCell>
      <div>
        <div className="font-medium">
          {student.student?.first_name} {student.student?.last_name}
        </div>
        <div className="text-sm text-muted-foreground">
          {student.student?.email}
        </div>
      </div>
    </TableCell>
  );
};
