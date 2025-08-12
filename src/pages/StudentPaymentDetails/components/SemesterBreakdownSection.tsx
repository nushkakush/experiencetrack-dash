import React from 'react';
import { InstallmentItem } from './InstallmentItem';
import { PaymentBreakdown } from '@/types/payments/StudentPaymentDetailsTypes';

interface SemesterBreakdownSectionProps {
  paymentBreakdown: PaymentBreakdown;
}

export const SemesterBreakdownSection: React.FC<SemesterBreakdownSectionProps> = ({
  paymentBreakdown
}) => {
  if (!paymentBreakdown.semesters) {
    return null;
  }

  return (
    <div className="space-y-4">
      {paymentBreakdown.semesters.map((semester) => (
        <div key={semester.semesterNumber} className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">
            Semester {semester.semesterNumber}
          </h3>
          <div className="space-y-2">
            {semester.instalments.map((installment, index: number) => (
              <InstallmentItem
                key={index}
                installment={installment}
                index={index}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
