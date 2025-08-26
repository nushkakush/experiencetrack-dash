import React from 'react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { InstallmentCard } from './InstallmentCard';
import { CohortStudent, Cohort } from '@/types/cohort';
import { PaymentSubmissionData } from '@/types/payments';
import { Logger } from '@/lib/logging/Logger';
import {
  StudentPaymentRow,
  PaymentTransactionRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { PaymentBreakdown as PaymentBreakdownType } from '@/types/payments';
import { useSemesterBreakdown } from './hooks/useSemesterBreakdown';
import { AdmissionFeeCard, SemesterCard, NoPaymentScheduleCard } from './index';

// Define the installment type that includes scholarship amounts
interface DatabaseInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  amountPaid: number;
  amountPending: number;
  semesterNumber?: number;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
  totalPayable: number;
  paymentDate: string | null;
}

// Define the semester type close to engine output
type EngineSemester = {
  semesterNumber: number;
  total?: {
    totalPayable?: number;
    totalPaid?: number;
    totalPending?: number;
  };
  totalPayable?: number;
  instalments?: DatabaseInstallment[];
};

// Minimal engine breakdown shape consumed here
type EnginePaymentBreakdown = {
  admissionFee?: { totalPayable?: number } | null;
  oneShotPayment?: {
    amountPayable?: number;
    baseAmount?: number;
    discountAmount?: number;
    scholarshipAmount?: number;
    gstAmount?: number;
    paymentDate?: string;
  } | null;
  semesters?: EngineSemester[];
  overallSummary?: { totalAmountPayable?: number } | null;
};

export interface SemesterBreakdownProps {
  paymentBreakdown: EnginePaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
  expandedSemesters: Set<number>;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: CohortStudent;
  cohortData?: Cohort;
  studentPayments?: StudentPaymentRow[];
  paymentTransactions?: PaymentTransactionRow[];
  onToggleSemester: (semesterNumber: number) => void;
  onInstallmentClick: (
    installment: DatabaseInstallment,
    semesterNumber: number,
    installmentIndex: number
  ) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

export const SemesterBreakdown: React.FC<SemesterBreakdownProps> = ({
  paymentBreakdown,
  selectedPaymentPlan,
  expandedSemesters,
  selectedInstallmentKey,
  showPaymentForm,
  paymentSubmissions,
  submittingPayments,
  studentData,
  cohortData,
  studentPayments,
  paymentTransactions,
  onToggleSemester,
  onInstallmentClick,
  onPaymentSubmission,
}) => {
  // Debug logging for payment transactions
  console.log('🔍 [SemesterBreakdown] Component props:', {
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
    semestersCount: paymentBreakdown?.semesters?.length || 0,
  });

  const {
    formatCurrency,
    isSemesterCompleted,
    computeInstallmentStatus,
    createOneShotInstallment,
    hasSemesters,
    shouldShowOneShot,
  } = useSemesterBreakdown({
    paymentBreakdown,
    selectedPaymentPlan,
    paymentTransactions,
  });

  Logger.getInstance().debug('SemesterBreakdown render', {
    hasPaymentBreakdown: !!paymentBreakdown,
    semestersCount: paymentBreakdown?.semesters?.length || 0,
    selectedPaymentPlan,
    expandedSemestersCount: expandedSemesters.size,
  });

  if (!hasSemesters) {
    Logger.getInstance().debug('SemesterBreakdown - no semesters available');

    // For one-shot payments, show the one-shot payment card
    if (shouldShowOneShot && createOneShotInstallment) {
      return (
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Payment Breakdown</h2>

          {/* Admission Fee Card */}
          <AdmissionFeeCard
            admissionFeeAmount={
              paymentBreakdown.admissionFee?.totalPayable || 0
            }
            formatCurrency={formatCurrency}
          />

          {/* One-Shot Installment Card with status + payment form */}
          <InstallmentCard
            installment={createOneShotInstallment}
            semesterNumber={1}
            installmentIndex={0}
            selectedPaymentPlan={selectedPaymentPlan}
            selectedInstallmentKey={selectedInstallmentKey}
            showPaymentForm={showPaymentForm}
            paymentSubmissions={paymentSubmissions}
            submittingPayments={submittingPayments}
            studentData={studentData}
            cohortData={cohortData}
            paymentBreakdown={
              paymentBreakdown as unknown as PaymentBreakdownType
            }
            paymentTransactions={paymentTransactions}
            onInstallmentClick={onInstallmentClick}
            onPaymentSubmission={onPaymentSubmission}
          />
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Payment Breakdown</h2>
        <NoPaymentScheduleCard />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>Payment Breakdown</h2>

      {/* Admission Fee Card */}
      <AdmissionFeeCard
        admissionFeeAmount={paymentBreakdown.admissionFee?.totalPayable || 0}
        formatCurrency={formatCurrency}
      />

      {/* Semester Cards */}
      {paymentBreakdown.semesters?.map((semester: EngineSemester) => (
        <SemesterCard
          key={semester.semesterNumber}
          semester={semester}
          selectedPaymentPlan={selectedPaymentPlan}
          expandedSemesters={expandedSemesters}
          selectedInstallmentKey={selectedInstallmentKey}
          showPaymentForm={showPaymentForm}
          paymentSubmissions={paymentSubmissions}
          submittingPayments={submittingPayments}
          studentData={studentData}
          cohortData={cohortData}
          paymentTransactions={paymentTransactions}
          paymentBreakdown={paymentBreakdown}
          isSemesterCompleted={isSemesterCompleted}
          formatCurrency={formatCurrency}
          computeInstallmentStatus={computeInstallmentStatus}
          onToggleSemester={onToggleSemester}
          onInstallmentClick={onInstallmentClick}
          onPaymentSubmission={onPaymentSubmission}
        />
      ))}
    </div>
  );
};
