import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentPlanSelection from './PaymentPlanSelection';
import { PaymentDashboard } from './PaymentDashboard';
import { usePaymentSubmissions } from '../hooks/usePaymentSubmissions';
import { usePaymentCalculations } from '../hooks/usePaymentCalculationsRefactored';
import { useStudentData } from '../hooks/useStudentData';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent } from '@/types/cohort';
import { toast } from 'sonner';


interface FeePaymentSectionProps {
  studentData: CohortStudent;
  cohortData: any;
}

export const FeePaymentSection = React.memo<FeePaymentSectionProps>(({ studentData, cohortData }) => {
  const { 
    paymentBreakdown, 
    selectedPaymentPlan, 
    handlePaymentPlanSelection,
    getPaymentMethods,
    loading,
    studentPayments,
    hasPaymentSchedule,
    refetch
  } = usePaymentCalculations({ studentData });

  const { feeStructure } = useStudentData();

  const { paymentSubmissions, submittingPayments, handlePaymentSubmission } = usePaymentSubmissions(studentData, refetch);

  const [isSelectingPlan, setIsSelectingPlan] = React.useState(false);

  const handlePlanSelection = async (plan: any) => {
    setIsSelectingPlan(true);
    try {
      await handlePaymentPlanSelection(plan);
      toast.success(`Payment plan "${plan}" selected successfully! Your payment schedule is now available.`);
    } catch (error) {
      console.error('Error selecting payment plan:', error);
      toast.error('Failed to select payment plan. Please try again.');
    } finally {
      setIsSelectingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Fee Payment</h1>
          <p className="text-muted-foreground mb-4">
            Manage your fee payments and view payment history
          </p>
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
        </div>
      </div>
    );
  }

  // Show payment plan selection if no plan is selected or if there are any issues
  if (selectedPaymentPlan === 'not_selected' || !studentPayments || studentPayments.length === 0 || !paymentBreakdown) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Fee Payment</h1>
          <p className="text-muted-foreground mb-4">
            Choose your payment plan to get started with fee payments
          </p>
          <PaymentPlanSelection 
            onPlanSelected={handlePlanSelection}
            isSubmitting={isSelectingPlan}
            feeStructure={feeStructure}
            studentData={studentData}
            cohortData={cohortData}
          />
        </div>
      </div>
    );
  }

  // Show payment dashboard if plan is selected and payment breakdown is available
  return (
    <PaymentDashboard
      paymentBreakdown={paymentBreakdown as any}
      selectedPaymentPlan={selectedPaymentPlan as any}
      onPaymentPlanSelection={handlePaymentPlanSelection}
      studentPayments={studentPayments as any}
      cohortData={cohortData ? {
        id: cohortData.id,
        name: cohortData.name,
        startDate: cohortData.start_date,
        endDate: cohortData.end_date,
        durationMonths: cohortData.duration_months,
        sessionsPerDay: cohortData.sessions_per_day
      } : undefined}
      studentData={studentData as any}
      paymentSubmissions={paymentSubmissions}
      submittingPayments={submittingPayments}
      onPaymentSubmission={handlePaymentSubmission as any}
    />
  );
});
