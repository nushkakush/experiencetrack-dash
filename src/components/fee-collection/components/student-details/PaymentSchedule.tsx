import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { StudentPaymentSummary } from '@/types/fee';
import { AdminPaymentRecordingDialog } from './AdminPaymentRecordingDialog';
import { EmailComposerDialog } from '@/components/common/EmailComposerDialog';
import { usePaymentSchedule } from './hooks/usePaymentSchedule';
import { useCallCounts } from './hooks/useCallCounts';
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

  // Call counts hook
  const { getCallCount, refreshCallCounts } = useCallCounts(student.student_id);

  // Email composer state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedPaymentItemForEmail, setSelectedPaymentItemForEmail] =
    useState<any>(null);

  const handleCallRecorded = () => {
    // Refresh call counts when a call is recorded
    refreshCallCounts();
  };

  const handleSendMail = (item: any) => {
    setSelectedPaymentItemForEmail(item);
    setShowEmailDialog(true);
  };

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
                onRecordCall={handleCallRecorded}
                onSendMail={handleSendMail}
                getRelevantTransactions={getRelevantTransactions}
                callCount={getCallCount(
                  item.semesterNumber || 1,
                  item.installmentNumber || 0
                )}
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

      {/* Email Composer Dialog */}
      {selectedPaymentItemForEmail && (
        <EmailComposerDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          recipient={{
            email: student.student?.email || '',
            name: `${student.student?.first_name || ''} ${student.student?.last_name || ''}`.trim(),
          }}
          context={{
            type: 'payment_reminder',
            paymentData: {
              amount: selectedPaymentItemForEmail.amount,
              dueDate: selectedPaymentItemForEmail.dueDate,
              installmentNumber:
                selectedPaymentItemForEmail.installmentNumber || 1,
              studentName:
                `${student.student?.first_name || ''} ${student.student?.last_name || ''}`.trim(),
            },
          }}
        />
      )}
    </>
  );
};
