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
import { generateFeeStructureReview } from '@/utils/fee-calculations';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent, Cohort } from '@/types/cohort';
import { toast } from 'sonner';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/fee';
import { Scholarship } from '@/types/fee';
import { 
  StudentPaymentData, 
  CohortData, 
  StudentData
} from '@/types/payments';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';

interface FeePaymentSectionProps {
  studentData: CohortStudent;
  cohortData: Cohort;
}

export const FeePaymentSection = React.memo<FeePaymentSectionProps>(
  ({ studentData, cohortData }) => {
    const { studentPayments, feeStructure, scholarships, studentScholarship, loading, refetch } =
      useStudentData();

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
      });
    }, [selectedPaymentPlan, hasSelectedPlan, isPlanSelectionComplete, isUpdatingPlan, planError, studentPayments, loading, feeStructure]);

    // Check for localStorage/server mismatch
    const hasLocalStorageMismatch = React.useMemo(() => {
      if (!studentPayments || studentPayments.length === 0) {
        // No server data, but we might have localStorage
        const localStorageKey = `paymentPlan_${studentData?.id}_${studentData?.cohort_id}`;
        const storedPlan = typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;
        return storedPlan && storedPlan !== 'not_selected';
      }
      return false;
    }, [studentPayments, studentData?.id, studentData?.cohort_id]);

    // Generate payment breakdown based on selected plan
    const paymentBreakdown = React.useMemo(() => {
      if (!feeStructure || !hasSelectedPlan) return undefined;
      
      // Calculate total scholarship amount (base + additional)
      let totalScholarshipAmount = 0;
      let scholarshipId = undefined;
      
      if (studentScholarship && studentScholarship.scholarship) {
        // Use student scholarship data (includes additional discount)
        const baseScholarshipPercentage = studentScholarship.scholarship.amount_percentage || 0;
        const additionalDiscountPercentage = studentScholarship.additional_discount_percentage || 0;
        const totalDiscountPercentage = baseScholarshipPercentage + additionalDiscountPercentage;
        
        totalScholarshipAmount = (Number(feeStructure.total_program_fee) * totalDiscountPercentage) / 100;
        scholarshipId = studentScholarship.scholarship_id;
        
        console.log('💰 FeePaymentSection - Total Scholarship Calculation:', {
          baseScholarshipPercentage,
          additionalDiscountPercentage,
          totalDiscountPercentage,
          totalScholarshipAmount,
          scholarshipId
        });
      } else if (studentPayments && studentPayments[0]?.scholarship_id) {
        // Fallback: use student payments data
        scholarshipId = String(studentPayments[0].scholarship_id);
        const scholarship = scholarships?.find(s => s.id === scholarshipId);
        if (scholarship) {
          totalScholarshipAmount = (Number(feeStructure.total_program_fee) * scholarship.amount_percentage) / 100;
        }
      }
      
      const totalAmountPaid =
        studentPayments && studentPayments[0]?.total_amount_paid
          ? Number(studentPayments[0].total_amount_paid)
          : 0;
      const startDate =
        cohortData?.start_date || new Date().toISOString().split('T')[0];
      
      const breakdown = generateFeeStructureReview(
        feeStructure as unknown as FeeStructure,
        (scholarships as Scholarship[]) || [],
        selectedPaymentPlan as PaymentPlan,
        totalAmountPaid,
        startDate,
        scholarshipId
      );

      // Override the scholarship amount in the breakdown to use our calculated total
      if (totalScholarshipAmount > 0) {
        breakdown.overallSummary.totalScholarship = totalScholarshipAmount;
        
        // Recalculate the total amount payable with the correct scholarship amount
        const totalProgramFee = Number(feeStructure.total_program_fee);
        const admissionFee = Number(feeStructure.admission_fee);
        const totalDiscount = breakdown.overallSummary.totalDiscount;
        
        // Calculate amount after discount and scholarship
        const amountAfterDiscount = totalProgramFee - totalDiscount;
        const amountAfterScholarship = amountAfterDiscount - totalScholarshipAmount;
        
        // Calculate GST on the amount after scholarship and discount
        const totalBaseGST = (amountAfterScholarship * 18) / 100; // 18% GST
        
        // Calculate final payable amount
        breakdown.overallSummary.totalAmountPayable = Math.max(0, amountAfterScholarship + totalBaseGST);
      }

      // Convert to the expected PaymentBreakdown type
      return breakdown as unknown as PaymentBreakdown;
    }, [
      feeStructure,
      scholarships,
      studentScholarship,
      selectedPaymentPlan,
      studentPayments,
      cohortData?.start_date,
      hasSelectedPlan,
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
        amountPayable: payment.total_amount_payable,
        amountPaid: payment.total_amount_paid,
        dueDate: payment.next_due_date || new Date().toISOString(),
        status: payment.payment_status,
        notes: payment.notes || '',
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
                  <p className='font-medium'>⚠️ localStorage Mismatch Detected</p>
                  <p className='text-sm mt-1'>
                    No payment plan found in database, but localStorage contains a previously selected plan. 
                    This might be due to deleted database records.
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
