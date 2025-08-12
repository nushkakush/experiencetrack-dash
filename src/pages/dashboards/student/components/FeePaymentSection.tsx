import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentPlanSelection from './PaymentPlanSelection';
import { PaymentDashboard } from './PaymentDashboard';
import { usePaymentSubmissions } from '../hooks/usePaymentSubmissions';
import { usePaymentCalculations } from '../hooks/usePaymentCalculationsRefactored';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent } from '@/types/cohort';
import { toast } from 'sonner';


interface FeePaymentSectionProps {
  studentData: CohortStudent;
  cohortData: any;
}

export const FeePaymentSection = React.memo<FeePaymentSectionProps>(({ studentData, cohortData }) => {
  Logger.getInstance().debug('FeePaymentSection render', { studentData, cohortData });
  
  const { paymentSubmissions, submittingPayments, handlePaymentSubmission } = usePaymentSubmissions();
  const { 
    paymentBreakdown, 
    selectedPaymentPlan, 
    handlePaymentPlanSelection,
    getPaymentMethods,
    loading,
    studentPayments 
  } = usePaymentCalculations({ studentData });

  Logger.getInstance().debug('FeePaymentSection state', { loading, selectedPaymentPlan, studentPayments });

  const [isSelectingPlan, setIsSelectingPlan] = React.useState(false);

  const handlePlanSelection = async (plan: any) => {
    setIsSelectingPlan(true);
    try {
      await handlePaymentPlanSelection(plan);
      toast.success(`Payment plan "${plan}" selected successfully!`);
    } catch (error) {
      console.error('Error selecting payment plan:', error);
      toast.error('Failed to select payment plan. Please try again.');
    } finally {
      setIsSelectingPlan(false);
    }
  };

  if (loading) {
    Logger.getInstance().debug('FeePaymentSection - showing loading skeleton');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Payment</CardTitle>
            <CardDescription>
              Manage your fee payments and view payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment plan selection if no plan is selected or if there are any issues
  if (selectedPaymentPlan === 'not_selected' || !studentPayments || studentPayments.length === 0 || !paymentBreakdown) {
    Logger.getInstance().debug('FeePaymentSection - showing payment plan selection');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Payment</CardTitle>
            <CardDescription>
              Choose your payment plan to get started with fee payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentPlanSelection 
              onPlanSelected={handlePlanSelection}
              isSubmitting={isSelectingPlan}
              feeStructure={paymentBreakdown?.overallSummary}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the payment dashboard once a plan is selected
  Logger.getInstance().debug('FeePaymentSection - showing payment dashboard');
  return (
    <div className="space-y-6">
      {/* Payment Dashboard */}
      <PaymentDashboard
        paymentBreakdown={paymentBreakdown}
        selectedPaymentPlan={selectedPaymentPlan}
        onPaymentPlanSelection={handlePaymentPlanSelection}
        studentPayments={studentPayments}
        cohortData={cohortData}
        studentData={studentData}
        paymentSubmissions={paymentSubmissions}
        submittingPayments={submittingPayments}
        onPaymentSubmission={handlePaymentSubmission}
      />

      {/* Payment Submission Form - Now integrated into PaymentDashboard */}
    </div>
  );
});
