import React from 'react';
import { PaymentPlan } from '@/types/fee';
import { 
  PaymentPlanSelector, 
  FeeBreakdownCard, 
  SemesterCard, 
  PaymentSummary, 
  usePaymentBreakdown 
} from './payment-breakdown';
import { PaymentMethod, StudentPaymentData } from '@/types/payments';

interface PaymentBreakdownProps {
  paymentBreakdown: any;
  paymentMethods: PaymentMethod[];
  selectedPaymentPlan: PaymentPlan;
  onPaymentPlanSelection: (plan: PaymentPlan) => void;
  studentPayments?: StudentPaymentData[];
}

export const PaymentBreakdown = React.memo<PaymentBreakdownProps>(({
  paymentBreakdown,
  paymentMethods,
  selectedPaymentPlan,
  onPaymentPlanSelection,
  studentPayments,
}) => {
  const { toggleSemester, isSemesterExpanded } = usePaymentBreakdown({ paymentBreakdown });

  if (!paymentBreakdown) {
    return <div>Loading payment breakdown...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Payment Plan Selection */}
      <PaymentPlanSelector
        selectedPaymentPlan={selectedPaymentPlan}
        onPaymentPlanSelection={onPaymentPlanSelection}
        studentPayments={studentPayments}
      />

      {/* Admission Fee */}
      <FeeBreakdownCard
        title="Admission Fee"
        baseAmount={paymentBreakdown.admissionFee.baseAmount}
        gstAmount={paymentBreakdown.admissionFee.gstAmount}
        totalPayable={paymentBreakdown.admissionFee.totalPayable}
        status="Pending"
        showDiscount={false}
      />

      {/* Semesters */}
      {paymentBreakdown.semesters.map((semester: any) => (
        <SemesterCard
          key={semester.semesterNumber}
          semester={semester}
          selectedPaymentPlan={selectedPaymentPlan}
          isExpanded={isSemesterExpanded(semester.semesterNumber)}
          onToggleExpansion={toggleSemester}
        />
      ))}

      {/* Overall Summary */}
      <PaymentSummary overallSummary={paymentBreakdown.overallSummary} />
    </div>
  );
});

PaymentBreakdown.displayName = 'PaymentBreakdown';

export default PaymentBreakdown;
