import React from 'react';
import { TableCell } from '@/components/ui/table';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { StudentPaymentSummary, PaymentType } from '@/types/fee';

interface StatusCellProps {
  student: StudentPaymentSummary;
}

export const StatusCell: React.FC<StatusCellProps> = ({ student }) => {
  const getPaymentTypeDisplay = (paymentType: PaymentType) => {
    switch (paymentType) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'instalments':
        return 'Instalments';
      case 'one_shot':
        return 'One-Shot';
      case 'sem_plan':
        return 'Sem Plan';
      default:
        return paymentType;
    }
  };

  return (
    <TableCell>
      <div className="space-y-1">
        {student.payments && student.payments.length > 0 ? (
          student.payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-2">
              <PaymentStatusBadge status="pending" />
              <span className="text-xs text-muted-foreground">
                {getPaymentTypeDisplay(payment.payment_type)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2">
            <PaymentStatusBadge status="pending" />
            <span className="text-xs text-muted-foreground">
              Payment Setup Required
            </span>
          </div>
        )}
      </div>
    </TableCell>
  );
};
