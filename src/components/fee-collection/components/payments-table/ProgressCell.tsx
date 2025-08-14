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

    // Calculate based on amount paid vs total amount
    const totalAmount = student.total_amount;
    const paidAmount = student.paid_amount;
    
    if (totalAmount === 0) return null;

    const progress = Math.round((paidAmount / totalAmount) * 100);
    
    // For installment-wise payments, calculate how many installments are completed
    let completedInstallments = 0;
    let totalInstallments = 0;
    
    if (student.payment_plan === 'instalment_wise') {
      // Assuming 12 installments based on the payment schedule
      totalInstallments = 12;
      const installmentAmount = totalAmount / totalInstallments;
      completedInstallments = Math.floor(paidAmount / installmentAmount);
    } else if (student.payment_plan === 'sem_wise') {
      // For semester-wise, assume 4 semesters
      totalInstallments = 4;
      const semesterAmount = totalAmount / totalInstallments;
      completedInstallments = Math.floor(paidAmount / semesterAmount);
    } else if (student.payment_plan === 'one_shot') {
      // For one-shot, it's either 0 or 1
      totalInstallments = 1;
      completedInstallments = paidAmount >= totalAmount ? 1 : 0;
    } else {
      // Fallback to transaction count for other cases
      const paidTransactions = student.payments?.filter(p => 
        p.status === 'paid' || p.status === 'complete'
      ).length || 0;
      const totalTransactions = student.payments?.length || 0;
      
      completedInstallments = paidTransactions;
      totalInstallments = totalTransactions;
    }
    
    return { progress, paidInstallments: completedInstallments, totalInstallments };
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
