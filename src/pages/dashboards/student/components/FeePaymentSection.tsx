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
import { usePaymentPlanState } from '../hooks/usePaymentPlanState';
import { useStudentData } from '../hooks/useStudentData';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent, Cohort } from '@/types/cohort';
import { toast } from 'sonner';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/fee';
import { Scholarship } from '@/types/fee';
import { StudentPaymentData, CohortData, StudentData } from '@/types/payments';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import type { PaymentPlan as EnginePaymentPlan } from '@/services/payments/paymentEngineClient';

interface FeePaymentSectionProps {
  studentData: CohortStudent;
  cohortData: Cohort;
}

export const FeePaymentSection = React.memo<FeePaymentSectionProps>(
  ({ studentData, cohortData }) => {
    const {
      studentPayments,
      paymentTransactions,
      feeStructure,
      scholarships,
      studentScholarship,
      loading,
      refetch,
    } = useStudentData();

    // Use the new payment plan state hook
    const {
      selectedPaymentPlan,
      hasSelectedPlan,
      isPlanSelectionComplete,
      updatePaymentPlan,
      isUpdatingPlan,
      error: planError,
      clearError: clearPlanError,
      clearLocalStorage,
    } = usePaymentPlanState({
      studentData,
      studentPayments,
      loading,
      refetch,
    });

    // Debug logging will be added after variables are declared

    // Check for localStorage/server mismatch
    const hasLocalStorageMismatch = React.useMemo(() => {
      if (!studentPayments || studentPayments.length === 0) {
        // No server data, but we might have localStorage
        const localStorageKey = `paymentPlan_${studentData?.id}_${studentData?.cohort_id}`;
        const storedPlan =
          typeof window !== 'undefined'
            ? localStorage.getItem(localStorageKey)
            : null;
        return storedPlan && storedPlan !== 'not_selected';
      }
      return false;
    }, [studentPayments, studentData?.id, studentData?.cohort_id]);

    // Generate payment breakdown based on selected plan
    const [paymentBreakdown, setPaymentBreakdown] = React.useState<PaymentBreakdown | undefined>(undefined);

    React.useEffect(() => {
      let cancelled = false;
      const compute = async () => {
        console.log('🔄 [FeePaymentSection] Payment breakdown calculation triggered:', {
          hasFeeStructure: !!feeStructure,
          hasSelectedPlan,
          selectedPaymentPlan,
          studentDataId: studentData?.id,
          cohortDataId: cohortData?.id,
        });
        
        if (!feeStructure || !hasSelectedPlan) {
          console.log('🔄 [FeePaymentSection] Skipping payment breakdown - missing data');
          setPaymentBreakdown(undefined);
          return;
        }

        let scholarshipId = undefined as string | undefined;
        if (studentScholarship && studentScholarship.scholarship) {
          scholarshipId = studentScholarship.scholarship_id;
        } else if (studentPayments && studentPayments[0]?.scholarship_id) {
          scholarshipId = String(studentPayments[0].scholarship_id);
        }

        try {
          const toEnginePlan = (p: PaymentPlan): EnginePaymentPlan | undefined => {
            if (p === 'one_shot' || p === 'sem_wise' || p === 'instalment_wise') return p as EnginePaymentPlan;
            return undefined;
          };
          const enginePlan = toEnginePlan(selectedPaymentPlan as PaymentPlan);
          if (!enginePlan) throw new Error('Invalid payment plan');
          const { breakdown } = await getFullPaymentView({
            studentId: studentData?.id,
            cohortId: String(cohortData?.id),
            paymentPlan: enginePlan,
            scholarshipId,
            additionalDiscountPercentage: studentScholarship?.additional_discount_percentage || 0,
            // Pass complete fee structure data including saved dates to payment engine
            feeStructureData: {
              total_program_fee: Number(feeStructure.total_program_fee),
              admission_fee: Number(feeStructure.admission_fee),
              number_of_semesters: (feeStructure as any).number_of_semesters,
              instalments_per_semester: (feeStructure as any).instalments_per_semester,
              one_shot_discount_percentage: (feeStructure as any).one_shot_discount_percentage,

              one_shot_dates: (feeStructure as any).one_shot_dates,
              sem_wise_dates: (feeStructure as any).sem_wise_dates,
              instalment_wise_dates: (feeStructure as any).instalment_wise_dates,
            }
          });
          console.log('🔄 [FeePaymentSection] Payment breakdown calculated successfully:', {
            hasBreakdown: !!breakdown,
            breakdownType: typeof breakdown,
          });
          if (!cancelled) setPaymentBreakdown(breakdown as unknown as PaymentBreakdown);
        } catch (err) {
          console.error('🔄 [FeePaymentSection] Payment engine call failed:', err);
          if (!cancelled) {
            setPaymentBreakdown(undefined);
            toast.error('Failed to load payment schedule. Please try again.');
          }
        }
      };
      compute();
      return () => {
        cancelled = true;
      };
    }, [
      feeStructure,
      scholarships,
      studentScholarship,
      selectedPaymentPlan,
      studentPayments,

      hasSelectedPlan,
      studentData?.id,
      cohortData?.id,
    ]);

    // Payment submissions hook
    const { paymentSubmissions, submittingPayments, handlePaymentSubmission } =
      usePaymentSubmissions(studentData, refetch);

    // Convert student payments to the expected format - ALWAYS call this hook
    const convertedStudentPayments: StudentPaymentData[] = React.useMemo(() => {
      if (!studentPayments) return [];

      return studentPayments.map(payment => ({
        id: payment.id,
        studentId: payment.student_id,
        cohortId: payment.cohort_id,
        paymentType: 'program_fee',
        paymentPlan: payment.payment_plan as PaymentPlan,
        amountPayable: 0, // Will be calculated dynamically
        amountPaid: 0, // Will be calculated from payment transactions
        dueDate: new Date().toISOString(), // Will be calculated based on payment plan
        status: 'pending', // Default status since we removed payment_status
        notes: '', // Removed notes column
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        student: {
          id: studentData.id,
          firstName: studentData.first_name || '',
          lastName: studentData.last_name || '',
          email: studentData.email,
        },
      }));
    }, [studentPayments, studentData]);

    // Convert cohort data to the expected format - ALWAYS call this hook
    const convertedCohortData: CohortData = React.useMemo(() => {
      return {
        id: cohortData.id,
        name: cohortData.name,
        startDate: cohortData.start_date,
        endDate: cohortData.end_date,
        durationMonths: cohortData.duration_months,
        sessionsPerDay: cohortData.sessions_per_day,
        cohort_id: cohortData.id,
      };
    }, [cohortData]);

    // Convert student data to the expected format - ALWAYS call this hook
    const convertedStudentData: StudentData = React.useMemo(() => {
      return {
        id: studentData.id,
        firstName: studentData.first_name || '',
        lastName: studentData.last_name || '',
        email: studentData.email,
        phone: studentData.phone || undefined,
        avatarUrl: studentData.avatar_url || undefined,
        inviteStatus: studentData.invite_status,
        invitedAt: studentData.invited_at || undefined,
        acceptedAt: studentData.accepted_at || undefined,
        createdAt: studentData.created_at,
        updatedAt: studentData.updated_at,
      };
    }, [studentData]);

    // Debug logging
    React.useEffect(() => {
      console.log('🔄 FeePaymentSection Debug:', {
        selectedPaymentPlan,
        hasSelectedPlan,
        isPlanSelectionComplete,
        isUpdatingPlan,
        planError,
        hasStudentPayments: !!studentPayments && studentPayments.length > 0,
        studentPaymentsCount: studentPayments?.length || 0,
        serverPlan: studentPayments?.[0]?.payment_plan,
        loading,
        hasFeeStructure: !!feeStructure,
        hasLocalStorageMismatch,
        currentRenderState: (() => {
          if (loading) return 'loading';
          if (planError) return 'error';
          if (hasLocalStorageMismatch) return 'localStorage_mismatch';
          if (!hasSelectedPlan) return 'no_plan_selected';
          if (!isPlanSelectionComplete) return 'plan_selection_incomplete';
          if (!paymentBreakdown) return 'no_payment_breakdown';
          return 'payment_dashboard';
        })(),
      });
    }, [
      selectedPaymentPlan,
      hasSelectedPlan,
      isPlanSelectionComplete,
      isUpdatingPlan,
      planError,
      studentPayments,
      loading,
      feeStructure,
      hasLocalStorageMismatch,
      paymentBreakdown,
    ]);

    // Handle payment plan selection
    const handlePlanSelection = async (plan: PaymentPlan) => {
      try {
        clearPlanError();
        console.log('🔄 Starting payment plan selection:', { plan });
        await updatePaymentPlan(plan);
        toast.success(
          `Payment plan "${plan}" selected successfully! Your payment schedule is now available.`
        );
        console.log('🔄 Payment plan selection completed successfully');
      } catch (error) {
        console.error('Error selecting payment plan:', error);
        toast.error('Failed to select payment plan. Please try again.');
      }
    };

    // Show loading state
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

    // Show error state if there's a plan error
    if (planError) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
              Manage your fee payments and view payment history
            </p>
            <Card className='border-red-200 bg-red-50'>
              <CardContent className='pt-6'>
                <div className='text-red-600'>
                  <p className='font-medium'>Error with payment plan:</p>
                  <p className='text-sm mt-1'>{planError}</p>
                  <button
                    onClick={clearPlanError}
                    className='text-sm underline mt-2 hover:no-underline'
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Show localStorage mismatch warning (for debugging)
    if (hasLocalStorageMismatch) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
              Manage your fee payments and view payment history
            </p>
            <Card className='border-yellow-200 bg-yellow-50'>
              <CardContent className='pt-6'>
                <div className='text-yellow-800'>
                  <p className='font-medium'>
                    ⚠️ localStorage Mismatch Detected
                  </p>
                  <p className='text-sm mt-1'>
                    No payment plan found in database, but localStorage contains
                    a previously selected plan. This might be due to deleted
                    database records.
                  </p>
                  <button
                    onClick={clearLocalStorage}
                    className='text-sm underline mt-2 hover:no-underline text-blue-600'
                  >
                    Clear localStorage and refresh
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Show payment plan selection if no plan is selected
    if (!hasSelectedPlan) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
              Choose your payment plan to get started with fee payments
            </p>
            <PaymentPlanSelection
              onPlanSelected={handlePlanSelection}
              isSubmitting={isUpdatingPlan}
              feeStructure={feeStructure}
              studentData={studentData}
              cohortData={cohortData}
              studentPayments={studentPayments}
              scholarships={scholarships}
              studentScholarship={studentScholarship}
            />
          </div>
        </div>
      );
    }

    // Show loading state while plan selection is being processed
    if (!isPlanSelectionComplete) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Fee Payment</h1>
            <p className='text-muted-foreground mb-4'>
              Setting up your payment schedule...
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

    // Show the payment dashboard
    return (
      <PaymentDashboard
        paymentBreakdown={paymentBreakdown}
        selectedPaymentPlan={selectedPaymentPlan as PaymentPlan}
        onPaymentPlanSelection={updatePaymentPlan}
        studentPayments={convertedStudentPayments}
        paymentTransactions={paymentTransactions}
        cohortData={convertedCohortData}
        studentData={convertedStudentData}
        paymentSubmissions={paymentSubmissions}
        submittingPayments={submittingPayments}
        onPaymentSubmission={handlePaymentSubmission}
      />
    );
  }
);

FeePaymentSection.displayName = 'FeePaymentSection';
