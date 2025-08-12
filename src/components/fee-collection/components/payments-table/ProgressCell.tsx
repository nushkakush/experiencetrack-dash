import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary } from '@/types/fee';

interface ProgressCellProps {
  student: StudentPaymentSummary;
}

export const ProgressCell: React.FC<ProgressCellProps> = ({ student }) => {
  const getPaymentProgress = (student: StudentPaymentSummary) => {
    // If student hasn't selected a payment plan, show --
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return null;
    }

    // Count paid installments
    const paidInstallments = student.payments?.filter(p => 
      p.status === 'paid' || p.status === 'complete'
    ).length || 0;

    const totalInstallments = student.payments?.length || 0;

    if (totalInstallments === 0) return null;

    const progress = Math.round((paidInstallments / totalInstallments) * 100);
    return { progress, paidInstallments, totalInstallments };
  };

  const progressData = getPaymentProgress(student);

  return (
    <TableCell>
      {progressData ? (
        <div className="w-32">
          <div className="flex justify-between text-sm mb-1">
            <span>{progressData.progress}%</span>
            <span>{progressData.paidInstallments}/{progressData.totalInstallments}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressData.progress}%` }}
            />
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">--</span>
      )}
    </TableCell>
  );
};
