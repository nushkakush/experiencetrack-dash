import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary, PaymentPlan } from '@/types/fee';

interface PaymentPlanCellProps {
  student: StudentPaymentSummary;
}

export const PaymentPlanCell: React.FC<PaymentPlanCellProps> = ({ student }) => {
  const getPlanDisplay = (plan: PaymentPlan) => {
    if (!plan || plan === 'not_selected') {
      return '--';
    }
    
    switch (plan) {
      case 'one_shot':
        return 'One-Shot';
      case 'sem_wise':
        return 'Semester-wise';
      case 'instalment_wise':
        return 'Installment-wise';
      default:
        return plan;
    }
  };

  return (
    <TableCell>
      <div>
        <div className="font-medium">
          {getPlanDisplay(student.payment_plan)}
        </div>
        {student.scholarship_name && (
          <div className="text-sm text-blue-600">
            {student.scholarship_name} ({student.scholarship_percentage}%)
          </div>
        )}
      </div>
    </TableCell>
  );
};
