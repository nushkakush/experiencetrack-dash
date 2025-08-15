import React from 'react';
import { PaymentPlan } from '@/types/fee';
import {
  PaymentDashboardHeader,
  PaymentSummaryCards,
  PaymentOptionsSection,
  SemesterBreakdown,
  usePaymentDashboard,
} from './index';
import {
  StudentPaymentData,
  CohortData,
  StudentData,
  PaymentSubmissionData,
} from '@/types/payments';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { Logger } from '@/lib/logging/Logger';

interface PaymentDashboardProps {
  paymentBreakdown: PaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
  onPaymentPlanSelection: (plan: PaymentPlan) => void;
  studentPayments?: StudentPaymentData[];
  paymentTransactions?: any[];
  cohortData?: CohortData;
  studentData?: StudentData;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  onPaymentSubmission?: (paymentData: PaymentSubmissionData) => void;
}

export const PaymentDashboard = React.memo<PaymentDashboardProps>(
  ({
    paymentBreakdown,
    selectedPaymentPlan,
    onPaymentPlanSelection,
    studentPayments,
    paymentTransactions,
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
      handlePaymentSubmit,
    } = usePaymentDashboard({
      paymentBreakdown,
      onPaymentSubmission,
    });

    Logger.getInstance().debug('PaymentDashboard render', {
      hasPaymentBreakdown: !!paymentBreakdown,
      selectedPaymentPlan,
      semestersCount: paymentBreakdown?.semesters?.length || 0,
      expandedSemestersCount: expandedSemesters.size,
      hasStudentPayments: !!studentPayments && studentPayments.length > 0,
    });

    if (!paymentBreakdown) {
      Logger.getInstance().debug(
        'PaymentDashboard - no payment breakdown available'
      );
      return <div>Loading payment dashboard...</div>;
    }

    return (
      <div className='space-y-6 pb-8'>
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
          studentPayments={studentPayments}
          paymentTransactions={paymentTransactions}
          onToggleSemester={toggleSemester}
          onInstallmentClick={handleInstallmentClick}
          onPaymentSubmission={handlePaymentSubmit}
        />
      </div>
    );
  }
);
