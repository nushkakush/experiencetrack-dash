import React from 'react';
import { PaymentForm } from '@/components/common/payments';
import { CohortStudent } from '@/types/cohort';
import { PaymentSubmissionData, PaymentBreakdown, Installment } from '@/types/payments';

interface PaymentSubmissionFormV2Props {
  paymentSubmissions: Map<string, PaymentSubmissionData>;
  submittingPayments: Set<string>;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  studentData: CohortStudent;
  selectedPaymentPlan?: string;
  paymentBreakdown?: PaymentBreakdown;
  selectedInstallment?: Installment;
}

export const PaymentSubmissionFormV2 = React.memo<PaymentSubmissionFormV2Props>(({
  paymentSubmissions,
  submittingPayments,
  onPaymentSubmission,
  studentData,
  selectedPaymentPlan,
  paymentBreakdown,
  selectedInstallment,
}) => {
  return (
    <PaymentForm
      paymentSubmissions={paymentSubmissions}
      submittingPayments={submittingPayments}
      onPaymentSubmission={onPaymentSubmission}
      studentData={studentData}
      selectedPaymentPlan={selectedPaymentPlan}
      paymentBreakdown={paymentBreakdown}
      selectedInstallment={selectedInstallment}
    />
  );
});

PaymentSubmissionFormV2.displayName = 'PaymentSubmissionFormV2';

export default PaymentSubmissionFormV2;
