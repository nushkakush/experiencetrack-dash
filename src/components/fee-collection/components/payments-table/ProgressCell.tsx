import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import type { StudentPaymentSummary } from '@/types/fee';

interface ProgressCellProps {
  student: StudentPaymentSummary;
}

export const ProgressCell: React.FC<ProgressCellProps> = ({ student }) => {
  const totalAmount = Number(student.total_amount) || 0;
  const paidAmount = Number(student.paid_amount) || 0;

  const progress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  return (
    <TableCell>
      {totalAmount > 0 ? (
        <div className="flex items-center gap-3 min-w-[140px]">
          <Progress value={progress} className="w-24" />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">--</span>
      )}
    </TableCell>
  );
};