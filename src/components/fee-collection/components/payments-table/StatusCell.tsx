import React from 'react';
import { TableCell } from '@/components/ui/table';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { StudentPaymentSummary, PaymentType } from '@/types/fee';

interface StatusCellProps {
  student: StudentPaymentSummary;
}

export const StatusCell: React.FC<StatusCellProps> = ({ student }) => {
  const getPaymentTypeDisplay = (paymentType: PaymentType, paymentPlan?: string) => {
    // For one-shot payments, show "Program Fee"
    if (paymentPlan === 'one_shot') {
      return 'Program Fee';
    }
    
    // For installment-wise payments
    if (paymentPlan === 'instalment_wise') {
      return 'Installment';
    }
    
    // For semester-wise payments
    if (paymentPlan === 'sem_wise') {
      return 'Semester Fee';
    }
    
    // Default cases
    switch (paymentType) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'program_fee':
        return 'Program Fee';
      default:
        return 'Payment';
    }
  };

  const getOverallStatus = () => {
    if (!student.payments || student.payments.length === 0) {
      return { status: 'pending', text: 'Payment Setup Required' };
    }

    const totalPayments = student.payments.length;
    const completedPayments = student.payments.filter(p => p.status === 'paid').length;
    const pendingPayments = student.payments.filter(p => p.status === 'pending').length;

    if (completedPayments === totalPayments) {
      return { status: 'complete', text: 'All Payments Complete' };
    } else if (completedPayments > 0) {
      return { status: 'partially_paid', text: `${completedPayments}/${totalPayments} Paid` };
    } else {
      return { status: 'pending', text: `${pendingPayments} Pending` };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <TableCell>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={overallStatus.status} />
          <span className="text-xs text-muted-foreground">
            {overallStatus.text}
          </span>
        </div>
      </div>
    </TableCell>
  );
};
