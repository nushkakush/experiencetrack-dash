import React from 'react';

export interface PaymentOptionsSectionProps {
  selectedPaymentPlan?: any;
  studentPayments?: any[];
}

export const PaymentOptionsSection: React.FC<PaymentOptionsSectionProps> = ({
  selectedPaymentPlan,
  studentPayments
}) => {
  return (
    <div>
      {/* Bank details will be shown conditionally when student selects Bank Transfer or Check payment mode */}
    </div>
  );
};
