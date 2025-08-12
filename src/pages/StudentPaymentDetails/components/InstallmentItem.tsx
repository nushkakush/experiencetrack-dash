import React from 'react';
import { formatCurrency, formatDate } from '../utils/paymentUtils';
import { Installment } from '@/types/payments/StudentPaymentDetailsTypes';

interface InstallmentItemProps {
  installment: Installment;
  index: number;
}

export const InstallmentItem: React.FC<InstallmentItemProps> = ({
  installment,
  index
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div>
        <p className="font-medium">Installment {index + 1}</p>
        <p className="text-sm text-muted-foreground">
          Due: {formatDate(installment.paymentDate)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold">{formatCurrency(installment.amountPayable)}</p>
      </div>
    </div>
  );
};
