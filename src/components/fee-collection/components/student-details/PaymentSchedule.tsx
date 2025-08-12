import React from 'react';
import { Separator } from '@/components/ui/separator';
import { StudentPaymentSummary } from '@/types/fee';
import { PaymentItem } from './PaymentItem';

interface PaymentScheduleProps {
  student: StudentPaymentSummary;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({ student }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      <div>
        <h4 className="font-semibold mb-4 text-foreground">Payment Schedule</h4>
        {student.payments && student.payments.length > 0 ? (
          <div className="space-y-3">
            {student.payments.map((payment) => (
              <PaymentItem
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No payment schedule available</p>
            <p className="text-xs text-muted-foreground">Student needs to select a payment plan first</p>
          </div>
        )}
      </div>
      <Separator className="bg-border" />
    </>
  );
};
