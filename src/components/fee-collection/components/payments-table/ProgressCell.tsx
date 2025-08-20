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

  // Debug logging to help identify the issue
  console.log('🔍 [ProgressCell] Debug values:', {
    student_id: student.student_id,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    progress_percentage: progress,
    aggregate_status: (student as any).aggregate_status,
    payment_engine_breakdown: !!(student as any).payment_engine_breakdown,
  });
  
  // Also log the raw student object for debugging
  console.log('🔍 [ProgressCell] Raw student data:', {
    total_amount: student.total_amount,
    paid_amount: student.paid_amount,
    aggregate_status: (student as any).aggregate_status,
    has_breakdown: !!(student as any).payment_engine_breakdown,
  });

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