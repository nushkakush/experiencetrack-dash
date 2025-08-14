import React from 'react';
import { PaymentPlan, FeeStructure, Scholarship } from '@/types/fee';
import { supabase } from '@/integrations/supabase/client';
import { AdmissionFeeSection } from '@/components/fee-collection/components/AdmissionFeeSection';
import { OneShotPaymentSection } from '@/components/fee-collection/components/OneShotPaymentSection';
import { SemesterSection } from '@/components/fee-collection/components/SemesterSection';
import { OverallSummary } from '@/components/fee-collection/components/OverallSummary';
import { generateFeeStructureReview } from '@/utils/fee-calculations';

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
}

export const AdminLikePlanPreview: React.FC<AdminLikePlanPreviewProps> = ({
  selectedPlan,
  feeStructure,
  cohortStartDate,
  cohortId,
  selectedScholarshipId = 'no_scholarship',
  studentId,
}) => {
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([]);
  const [loading, setLoading] = React.useState(false);
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

  const feeReview = React.useMemo(() => {
    return generateFeeStructureReview(
      feeStructure,
      scholarships,
      selectedPlan,
      0,
      cohortStartDate,
      effectiveScholarshipId === 'no_scholarship'
        ? undefined
        : effectiveScholarshipId
    );
  }, [
    feeStructure,
    scholarships,
    selectedPlan,
    cohortStartDate,
    effectiveScholarshipId,
  ]);

  const noop = () => {};

  if (loading && !scholarships.length) {
    return (
      <div className='space-y-4'>
        <div className='h-28 bg-gray-200 rounded animate-pulse' />
        <div className='h-28 bg-gray-200 rounded animate-pulse' />
        <div className='h-28 bg-gray-200 rounded animate-pulse' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <AdmissionFeeSection
        admissionFee={feeReview.admissionFee}
        cohortStartDate={cohortStartDate}
        editablePaymentDates={{}}
        onPaymentDateChange={noop}
        isReadOnly
      />

      {selectedPlan === 'one_shot' && feeReview.oneShotPayment && (
        <OneShotPaymentSection
          oneShotPayment={feeReview.oneShotPayment as OneShotPaymentData}
          scholarships={scholarships}
          selectedScholarshipId={effectiveScholarshipId}
          cohortStartDate={cohortStartDate}
          editablePaymentDates={{}}
          onPaymentDateChange={noop}
          isReadOnly
        />
      )}

      {(selectedPlan === 'sem_wise' || selectedPlan === 'instalment_wise') && (
        <>
          {feeReview.semesters.map((semester: SemesterData) => (
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
        overallSummary={feeReview.overallSummary as OverallSummaryData}
        feeStructure={feeStructure}
        selectedPaymentPlan={selectedPlan}
        scholarships={scholarships}
        selectedScholarshipId={effectiveScholarshipId}
      />
    </div>
  );
};

export default AdminLikePlanPreview;
