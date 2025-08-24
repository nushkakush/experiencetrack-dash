import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary } from '@/types/fee';

interface PhoneCellProps {
  student: StudentPaymentSummary;
}

export const PhoneCell: React.FC<PhoneCellProps> = ({ student }) => {
  return (
    <TableCell className="text-sm text-muted-foreground">
      {student.student?.phone || '—'}
    </TableCell>
  );
};
