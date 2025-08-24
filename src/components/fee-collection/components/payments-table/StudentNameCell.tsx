import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary } from '@/types/fee';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface StudentNameCellProps {
  student: StudentPaymentSummary;
}

export const StudentNameCell: React.FC<StudentNameCellProps> = ({ student }) => {
  const studentName = `${student.student?.first_name || ''} ${student.student?.last_name || ''}`.trim();
  
  return (
    <TableCell>
      <div className="flex items-center gap-3">
        <UserAvatar
          avatarUrl={null}
          name={studentName}
          size="md"
          userId={student.student?.user_id}
        />
        <div>
          <div className="font-medium">
            {student.student?.first_name} {student.student?.last_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {student.student?.email}
          </div>
        </div>
      </div>
    </TableCell>
  );
};
