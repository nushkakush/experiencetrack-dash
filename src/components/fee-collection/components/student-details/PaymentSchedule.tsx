import React from 'react';
import { Separator } from '@/components/ui/separator';
import { StudentPaymentSummary } from '@/types/fee';
import { AdminPaymentRecordingDialog } from './AdminPaymentRecordingDialog';
import { usePaymentSchedule } from './hooks/usePaymentSchedule';
import {
  PaymentScheduleItem,
  PaymentScheduleEmptyState,
  PaymentScheduleLoadingState,
  PaymentScheduleNoPaymentsState,
} from './components';

interface PaymentScheduleProps {
  student: StudentPaymentSummary;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, string | Record<string, unknown>>;
    instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
  };
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  student,
  feeStructure,
}) => {
  const {
    // State
    paymentSchedule,
    loading,
    recordingPayment,
    selectedPaymentItem,
    showRecordingDialog,
    hasPaymentPlan,

    // Actions
    getRelevantTransactions,
    handleRecordPayment,
    handlePaymentRecorded,
    handleCloseRecordingDialog,
    canRecordPayment,
  } = usePaymentSchedule({
    student,
    feeStructure,
  });

  if (loading) {
    return <PaymentScheduleLoadingState />;
  }

  // Empty state when no payment plan is selected
  if (!hasPaymentPlan) {
    return <PaymentScheduleEmptyState />;
  }

  return (
    <>
      <div>
        {paymentSchedule.length > 0 ? (
          <div className='space-y-3'>
            {paymentSchedule.map(item => (
              <PaymentScheduleItem
                key={item.id}
                item={item}
                student={student}
                recordingPayment={recordingPayment}
                canRecordPayment={canRecordPayment}
                onRecordPayment={handleRecordPayment}
                getRelevantTransactions={getRelevantTransactions}
              />
            ))}
          </div>
        ) : (
          <PaymentScheduleNoPaymentsState />
        )}
      </div>
      <Separator className='bg-border' />

      {/* Admin Payment Recording Dialog */}
      <AdminPaymentRecordingDialog
        open={showRecordingDialog}
        onOpenChange={handleCloseRecordingDialog}
        student={student}
        paymentItem={selectedPaymentItem}
        onPaymentRecorded={handlePaymentRecorded}
        feeStructure={feeStructure}
      />
    </>
  );
};
