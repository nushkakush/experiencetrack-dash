import React from 'react';
import { PaymentPlan } from '@/types/fee';
import { 
  PaymentDashboardHeader,
  PaymentSummaryCards,
  PaymentOptionsSection,
  SemesterBreakdown,
  usePaymentDashboard
} from './index';
import { 
  PaymentBreakdown, 
  StudentPaymentData, 
  CohortData, 
  StudentData, 
  PaymentSubmissionData 
} from '@/types/payments';

interface PaymentDashboardProps {
  paymentBreakdown: PaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
  onPaymentPlanSelection: (plan: PaymentPlan) => void;
  studentPayments?: StudentPaymentData[];
  cohortData?: CohortData;
  studentData?: StudentData;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  onPaymentSubmission?: (paymentData: PaymentSubmissionData) => void;
}

export const PaymentDashboard = React.memo<PaymentDashboardProps>(({
  paymentBreakdown,
  selectedPaymentPlan,
  onPaymentPlanSelection,
  studentPayments,
  cohortData,
  studentData,
  paymentSubmissions,
  submittingPayments,
  onPaymentSubmission,
}) => {
  const {
    expandedSemesters,
    selectedInstallment,
    selectedInstallmentKey,
    showPaymentForm,
    toggleSemester,
    handleInstallmentClick,
    handlePaymentSubmit
  } = usePaymentDashboard({
    paymentBreakdown,
    onPaymentSubmission
  });



  if (!paymentBreakdown) {
    return <div>Loading payment dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <PaymentDashboardHeader
        cohortName={cohortData?.name}
        cohortStartDate={cohortData?.startDate}
      />

      {/* Payment Summary Cards */}
      <PaymentSummaryCards
        paymentBreakdown={paymentBreakdown}
        selectedPaymentPlan={selectedPaymentPlan}
      />

      {/* Payment Options Section */}
      <PaymentOptionsSection
        selectedPaymentPlan={selectedPaymentPlan}
        studentPayments={studentPayments}
      />

      {/* Semester/Installment Breakdown */}
      <SemesterBreakdown
        paymentBreakdown={paymentBreakdown}
        selectedPaymentPlan={selectedPaymentPlan}
        expandedSemesters={expandedSemesters}
        selectedInstallmentKey={selectedInstallmentKey}
        showPaymentForm={showPaymentForm}
        paymentSubmissions={paymentSubmissions}
        submittingPayments={submittingPayments}
        studentData={studentData}
        onToggleSemester={toggleSemester}
        onInstallmentClick={handleInstallmentClick}
        onPaymentSubmission={handlePaymentSubmit}
      />
    </div>
  );
});
