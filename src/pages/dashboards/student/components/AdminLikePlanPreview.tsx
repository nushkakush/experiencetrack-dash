import React from 'react';
import {
  PaymentPlan,
  Scholarship,
  StudentScholarshipWithDetails,
  FeeStructure,
} from '@/types/fee';
import { supabase } from '@/integrations/supabase/client';
import { AdmissionFeeSection } from '@/components/fee-collection/components/AdmissionFeeSection';
import { OneShotPaymentSection } from '@/components/fee-collection/components/OneShotPaymentSection';
import { SemesterSection } from '@/components/fee-collection/components/SemesterSection';
import { OverallSummary } from '@/components/fee-collection/components/OverallSummary';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';

// Type definitions for the fee structure review
interface OneShotPaymentData {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  amountPayable: number;
}

interface SemesterData {
  semesterNumber: number;
  instalments: Array<{
    baseAmount: number;
    gstAmount: number;
    scholarshipAmount: number;
    amountPayable: number;
    paymentDate: string;
  }>;
  total: {
    baseAmount: number;
    gstAmount: number;
    scholarshipAmount: number;
    totalPayable: number;
  };
}

interface OverallSummaryData {
  totalProgramFee: number;
  admissionFee: number;
  totalGST: number;
  totalDiscount: number;
  totalScholarship: number;
  totalAmountPayable: number;
}

interface AdminLikePlanPreviewProps {
  selectedPlan: PaymentPlan;
  feeStructure: FeeStructure;
  cohortStartDate: string;
  cohortId: string;
  selectedScholarshipId?: string; // 'no_scholarship' | scholarship id | 'detect'
  studentId?: string; // used when selectedScholarshipId === 'detect'
  studentScholarship?: StudentScholarshipWithDetails; // Add student scholarship data
}

export const AdminLikePlanPreview: React.FC<AdminLikePlanPreviewProps> = ({
  selectedPlan,
  feeStructure,
  cohortStartDate,
  cohortId,
  selectedScholarshipId = 'no_scholarship',
  studentId,
  studentScholarship,
}) => {
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [effectiveScholarshipId, setEffectiveScholarshipId] =
    React.useState<string>('no_scholarship');

  React.useEffect(() => {
    let isMounted = true;
    const loadScholarships = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cohort_scholarships')
          .select('*')
          .eq('cohort_id', cohortId)
          .order('amount_percentage', { ascending: true });
        if (error) throw error;
        if (isMounted)
          setScholarships((data || []) as unknown as Scholarship[]);
      } catch (_) {
        if (isMounted) setScholarships([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadScholarships();
    return () => {
      isMounted = false;
    };
  }, [cohortId]);

  // Detect student's scholarship assignment if requested
  React.useEffect(() => {
    let isMounted = true;
    const resolveScholarship = async () => {
      if (selectedScholarshipId && selectedScholarshipId !== 'detect') {
        if (isMounted) setEffectiveScholarshipId(selectedScholarshipId);
        return;
      }
      if (!studentId) {
        if (isMounted) setEffectiveScholarshipId('no_scholarship');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('student_scholarships')
          .select('scholarship_id')
          .eq('student_id', studentId)
          .maybeSingle();
        if (error) throw error;
        if (isMounted)
          setEffectiveScholarshipId(data?.scholarship_id || 'no_scholarship');
      } catch (_) {
        if (isMounted) setEffectiveScholarshipId('no_scholarship');
      }
    };
    resolveScholarship();
    return () => {
      isMounted = false;
    };
  }, [selectedScholarshipId, studentId]);

  const [feeReview, setFeeReview] = React.useState<any | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setReviewLoading(true);

        console.log('🎯 Student preview - Full fee structure received:', {
          feeStructure: feeStructure,
          hasOneShotDates: !!(feeStructure as any)?.one_shot_dates,
          hasSemWiseDates: !!(feeStructure as any)?.sem_wise_dates,
          hasInstalmentWiseDates: !!(feeStructure as any)
            ?.instalment_wise_dates,
          oneShotDatesValue: (feeStructure as any)?.one_shot_dates,
          semWiseDatesValue: (feeStructure as any)?.sem_wise_dates,
          instalmentWiseDatesValue: (feeStructure as any)
            ?.instalment_wise_dates,
        });

        console.log(
          '🎯 Student preview calling payment engine with saved database dates:',
          {
            cohortId: String(cohortId),
            paymentPlan: selectedPlan,
            scholarshipId:
              effectiveScholarshipId === 'no_scholarship'
                ? undefined
                : effectiveScholarshipId,
            additionalDiscountPercentage:
              studentScholarship?.additional_discount_percentage || 0,
            feeStructureData: {
              total_program_fee: feeStructure.total_program_fee,
              admission_fee: feeStructure.admission_fee,
              number_of_semesters: feeStructure.number_of_semesters,
              instalments_per_semester: feeStructure.instalments_per_semester,
              one_shot_discount_percentage:
                feeStructure.one_shot_discount_percentage,
              program_fee_includes_gst:
                (feeStructure as any).program_fee_includes_gst ?? true,
              equal_scholarship_distribution:
                (feeStructure as any).equal_scholarship_distribution ?? false,
              one_shot_dates: (feeStructure as any).one_shot_dates,
              sem_wise_dates: (feeStructure as any).sem_wise_dates,
              instalment_wise_dates: (feeStructure as any)
                .instalment_wise_dates,
            },
          }
        );

        const paymentResult = await getFullPaymentView({
          cohortId: String(cohortId),
          paymentPlan: selectedPlan,
          scholarshipId:
            effectiveScholarshipId === 'no_scholarship'
              ? undefined
              : effectiveScholarshipId,
          additionalDiscountPercentage:
            studentScholarship?.additional_discount_percentage || 0,
          // Pass complete fee structure data including saved dates to payment engine
          feeStructureData: {
            total_program_fee: feeStructure.total_program_fee,
            admission_fee: feeStructure.admission_fee,
            number_of_semesters: feeStructure.number_of_semesters,
            instalments_per_semester: feeStructure.instalments_per_semester,
            one_shot_discount_percentage:
              feeStructure.one_shot_discount_percentage,
            program_fee_includes_gst:
              (feeStructure as any).program_fee_includes_gst ?? true,
            equal_scholarship_distribution:
              (feeStructure as any).equal_scholarship_distribution ?? false,
            one_shot_dates: (feeStructure as any).one_shot_dates,
            sem_wise_dates: (feeStructure as any).sem_wise_dates,
            instalment_wise_dates: (feeStructure as any).instalment_wise_dates,
          },
        });

        const { breakdown } = paymentResult;

        console.log('🎯 Payment engine RESPONSE breakdown received:', {
          breakdown: breakdown,
          admissionFeeDate: breakdown?.admissionFee,
          oneShotPaymentDate: breakdown?.oneShotPayment?.paymentDate,
          oneShotPaymentFull: breakdown?.oneShotPayment,
          firstSemesterFirstInstallment:
            breakdown?.semesters?.[0]?.instalments?.[0]?.paymentDate,
          allSemesterDates: breakdown?.semesters?.map(s => ({
            semesterNumber: s.semesterNumber,
            installmentDates: s.instalments?.map(inst => inst.paymentDate),
          })),
          debugInfoFromPaymentEngine: (paymentResult as any)?.debug,
        });

        if (!cancelled) setFeeReview(breakdown);
      } catch (err) {
        console.error('payment-engine preview failed', err);
        try {
          (await import('sonner')).toast?.error?.(
            'Failed to load fee preview.'
          );
        } catch (_) {
          /* Ignore toast error */
        }
        if (!cancelled) setFeeReview(null);
      } finally {
        if (!cancelled) setReviewLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    cohortId,
    selectedPlan,
    cohortStartDate,
    effectiveScholarshipId,
    studentScholarship?.additional_discount_percentage,
    feeStructure,
  ]);

  const noop = () => {};

  // Use payment engine results directly - no client-side overrides
  const reviewData = feeReview;

  if (loading && (!scholarships || scholarships.length === 0)) {
    return (
      <div className='space-y-4'>
        <div className='h-28 bg-gray-200 rounded animate-pulse' />
        <div className='h-28 bg-gray-200 rounded animate-pulse' />
        <div className='h-28 bg-gray-200 rounded animate-pulse' />
      </div>
    );
  }

  if (reviewLoading || !reviewData) {
    return (
      <div className='space-y-4'>
        <div className='h-24 bg-muted rounded animate-pulse' />
        <div className='h-24 bg-muted rounded animate-pulse' />
        <div className='h-24 bg-muted rounded animate-pulse' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <AdmissionFeeSection
        admissionFee={reviewData?.admissionFee}
        cohortStartDate={cohortStartDate}
        editablePaymentDates={{}}
        onPaymentDateChange={noop}
        isReadOnly
      />

      {selectedPlan === 'one_shot' && reviewData?.oneShotPayment && (
        <>
          {console.log('🎯 UI RENDERING One Shot Payment with date:', {
            paymentDate: reviewData?.oneShotPayment?.paymentDate,
            cohortStartDate: cohortStartDate,
            oneShotPaymentFull: reviewData?.oneShotPayment,
            expectedCustomDate: '2025-08-19',
            actualDateBeingRendered: reviewData?.oneShotPayment?.paymentDate,
          })}
          <OneShotPaymentSection
            oneShotPayment={reviewData?.oneShotPayment as OneShotPaymentData}
            scholarships={scholarships}
            selectedScholarshipId={effectiveScholarshipId}
            cohortStartDate={cohortStartDate}
            editablePaymentDates={{}}
            onPaymentDateChange={noop}
            isReadOnly
          />
        </>
      )}

      {(selectedPlan === 'sem_wise' || selectedPlan === 'instalment_wise') && (
        <>
          {console.log(
            '🎯 UI RENDERING Semester/Installment Payment with dates:',
            {
              selectedPlan: selectedPlan,
              semesters: reviewData?.semesters,
              firstSemesterDates: reviewData?.semesters?.[0]?.instalments?.map(
                inst => ({
                  installmentNumber: inst.installmentNumber || 'unknown',
                  paymentDate: inst.paymentDate,
                })
              ),
              expectedCustomDates:
                selectedPlan === 'instalment_wise'
                  ? ['2025-08-18', '2025-08-19', '2025-08-20']
                  : 'sem_wise_dates',
              allSemesterInstallmentDates: reviewData?.semesters?.map(s => ({
                semester: s.semesterNumber,
                installments: s.instalments?.map(inst => inst.paymentDate),
              })),
            }
          )}
          {reviewData?.semesters.map((semester: SemesterData) => (
            <SemesterSection
              key={semester.semesterNumber}
              semester={semester}
              scholarships={scholarships}
              selectedScholarshipId={effectiveScholarshipId}
              editablePaymentDates={{}}
              onPaymentDateChange={noop}
              isReadOnly
            />
          ))}
        </>
      )}

      <OverallSummary
        overallSummary={reviewData?.overallSummary as OverallSummaryData}
        feeStructure={feeStructure}
        selectedPaymentPlan={selectedPlan}
        scholarships={scholarships}
        selectedScholarshipId={effectiveScholarshipId}
      />
    </div>
  );
};

export default AdminLikePlanPreview;
