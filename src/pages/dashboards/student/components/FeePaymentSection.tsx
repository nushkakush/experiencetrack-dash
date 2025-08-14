import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentPlanSelection from './PaymentPlanSelection';
import { PaymentDashboard } from './PaymentDashboard';
import { usePaymentSubmissions } from '../hooks/usePaymentSubmissions';
import { usePaymentPlanManagement } from '../hooks/usePaymentPlanManagement';
import { useStudentData } from '../hooks/useStudentData';
import { generateFeeStructureReview } from '@/utils/fee-calculations';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent, Cohort } from '@/types/cohort';
import { toast } from 'sonner';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/payments/PaymentCalculationTypes';
import { Scholarship } from '@/types/fee';

interface FeePaymentSectionProps {
  studentData: CohortStudent;
  cohortData: Cohort;
}

export const FeePaymentSection = React.memo<FeePaymentSectionProps>(
  ({ studentData, cohortData }) => {
    const { studentPayments, feeStructure, scholarships, loading, refetch } =
      useStudentData();
    const localPlanKey = React.useMemo(
      () => `selectedPaymentPlan_${studentData?.id}_${studentData?.cohort_id}`,
      [studentData?.id, studentData?.cohort_id]
    );
    const localStoredPlan =
      typeof window !== 'undefined'
        ? localStorage.getItem(localPlanKey) || undefined
        : undefined;
    const serverPlan =
      (studentPayments && studentPayments[0]?.payment_plan) || undefined;
    const derivedPlan = serverPlan || localStoredPlan || 'not_selected';
    const [selectedPaymentPlan, setSelectedPaymentPlan] =
      React.useState<string>(derivedPlan);
    React.useEffect(() => {
      setSelectedPaymentPlan(derivedPlan);
    }, [derivedPlan]);
    const { handlePaymentPlanSelection, getPaymentMethods } =
      usePaymentPlanManagement({
        studentData,
        selectedPaymentPlan,
        setSelectedPaymentPlan: (plan: string) => setSelectedPaymentPlan(plan),
        reloadStudentPayments: refetch,
      });

    const paymentBreakdown = React.useMemo(() => {
      if (!feeStructure) return undefined;
      const scholarshipId =
        studentPayments && studentPayments[0]?.scholarship_id
          ? String(studentPayments[0].scholarship_id)
          : undefined;
      const totalAmountPaid =
        studentPayments && studentPayments[0]?.total_amount_paid
          ? Number(studentPayments[0].total_amount_paid)
          : 0;
      const startDate =
        cohortData?.start_date || new Date().toISOString().split('T')[0];
      return generateFeeStructureReview(
        feeStructure as FeeStructure,
        (scholarships as Scholarship[]) || [],
        selectedPaymentPlan as PaymentPlan,
        totalAmountPaid,
        startDate,
        scholarshipId
      );
    }, [
      feeStructure,
      scholarships,
      selectedPaymentPlan,
      studentPayments,
      cohortData?.start_date,
    ]);

    // feeStructure already from hook above

    const { paymentSubmissions, submittingPayments, handlePaymentSubmission } =
      usePaymentSubmissions(studentData, refetch);

    const [isSelectingPlan, setIsSelectingPlan] = React.useState(false);

    const handlePlanSelection = async (plan: PaymentPlan) => {
      setIsSelectingPlan(true);
      try {
        // Immediately update the local state to show the payment dashboard
        setSelectedPaymentPlan(plan);
        if (typeof window !== 'undefined') {
          localStorage.setItem(localPlanKey, plan);
        }

        await handlePaymentPlanSelection(plan);
        toast.success(
          `Payment plan "${plan}" selected successfully! Your payment schedule is now available.`
        );
        // Force refresh to pull the new plan from server, then clear local cache once confirmed
        await refetch();
        const confirmedPlan =
          (studentPayments && studentPayments[0]?.payment_plan) || plan;
        if (confirmedPlan && typeof window !== 'undefined') {
          localStorage.setItem(localPlanKey, confirmedPlan);
        }
      } catch (error) {
        console.error('Error selecting payment plan:', error);
        toast.error('Failed to select payment plan. Please try again.');
        // Revert the local state if there was an error
        setSelectedPaymentPlan(derivedPlan);
        if (typeof window !== 'undefined') {
          localStorage.setItem(localPlanKey, derivedPlan);
        }
      } finally {
        setIsSelectingPlan(false);
      }
    };

    if (loading) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
              Manage your fee payments and view payment history
            </p>
            <div className='space-y-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-10 w-full' />
              <div className='space-y-2'>
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-20 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-20 w-full' />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show payment plan selection if no plan is selected
    if (selectedPaymentPlan === 'not_selected') {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
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
    if (!paymentBreakdown) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
              Loading payment schedule...
            </p>
            <div className='space-y-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-10 w-full' />
              <div className='space-y-2'>
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-20 w-full' />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <PaymentDashboard
        paymentBreakdown={paymentBreakdown}
        selectedPaymentPlan={selectedPaymentPlan as PaymentPlan}
        onPaymentPlanSelection={handlePaymentPlanSelection}
        studentPayments={studentPayments}
        cohortData={
          cohortData
            ? {
                id: cohortData.id,
                name: cohortData.name,
                startDate: cohortData.start_date,
                endDate: cohortData.end_date,
                durationMonths: cohortData.duration_months,
                sessionsPerDay: cohortData.sessions_per_day,
              }
            : undefined
        }
        studentData={studentData}
        paymentSubmissions={paymentSubmissions}
        submittingPayments={submittingPayments}
        onPaymentSubmission={handlePaymentSubmission}
      />
    );
  }
);
