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
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  onRefresh?: () => Promise<void>; // Add refresh callback
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
    onRefresh,
  }) => {
    // Debug logging for payment transactions
    console.log('🔍 [PaymentDashboard] Component props:', {
      hasPaymentBreakdown: !!paymentBreakdown,
      selectedPaymentPlan,
      paymentTransactionsCount: paymentTransactions?.length || 0,
      paymentTransactions:
        paymentTransactions?.map(t => ({
          id: t.id,
          lit_invoice_id: t.lit_invoice_id,
          installment_id: t.installment_id,
          semester_number: t.semester_number,
          verification_status: t.verification_status,
        })) || [],
      hasStudentData: !!studentData,
      hasCohortData: !!cohortData,
    });

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
        <div className='flex items-center justify-between'>
          <PaymentDashboardHeader
            cohortName={cohortData?.name}
            cohortStartDate={cohortData?.startDate}
            selectedPaymentPlan={selectedPaymentPlan}
          />
          <div className='flex items-center gap-4'>
            <p className='text-muted-foreground'>
              {cohortData?.startDate
                ? new Date(cohortData.startDate).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Start date to be announced'}
            </p>
            {onRefresh && (
              <Button variant='outline' size='sm' onClick={onRefresh}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Refresh
              </Button>
            )}
          </div>
        </div>

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
          cohortData={cohortData}
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
