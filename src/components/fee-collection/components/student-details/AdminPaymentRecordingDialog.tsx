import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StudentPaymentSummary } from '@/types/fee';
import { PaymentForm } from '@/components/common/payments/PaymentForm';
import { useAdminPaymentRecording } from './hooks/useAdminPaymentRecording';
import { PaymentBreakdownCard, AdminDialogHeader } from './components';

interface PaymentScheduleItem {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status:
    | 'pending'
    | 'pending_10_plus_days'
    | 'verification_pending'
    | 'paid'
    | 'overdue'
    | 'partially_paid_days_left'
    | 'partially_paid_overdue'
    | 'partially_paid_verification_pending'
    | 'waived'
    | 'partially_waived';
  paymentDate?: string;
  // FIXED: Remove verificationStatus field - payment engine status is the single source of truth
  semesterNumber?: number;
  installmentNumber?: number;
}

interface AdminPaymentRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentPaymentSummary;
  paymentItem: PaymentScheduleItem | null;
  onPaymentRecorded?: () => void; // Callback to refresh the payment schedule
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

interface AdminPaymentBreakdown {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
}

export const AdminPaymentRecordingDialog: React.FC<
  AdminPaymentRecordingDialogProps
> = ({
  open,
  onOpenChange,
  student,
  paymentItem,
  onPaymentRecorded,
  feeStructure,
}) => {
  const {
    // State
    adminPaymentBreakdown,
    studentPaymentBreakdown,
    loading,
    existingTransactions,
    pendingAmount,
    studentData,
    selectedInstallment,
    paymentBreakdownForForm,
    submittingPayments,

    // Actions
    handlePaymentSubmission,
  } = useAdminPaymentRecording({
    open,
    student,
    paymentItem,
    onPaymentRecorded,
    onOpenChange,
    feeStructure,
  });

  if (!paymentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <AdminDialogHeader
          studentName={`${student.student?.first_name || ''} ${student.student?.last_name || ''}`}
          paymentItemType={paymentItem.type}
          onClose={() => onOpenChange(false)}
        />

        <div className='space-y-6'>
          {/* Payment Breakdown Card */}
          <PaymentBreakdownCard
            loading={loading}
            adminPaymentBreakdown={adminPaymentBreakdown}
            paymentItem={paymentItem}
            pendingAmount={pendingAmount}
          />

          {/* Payment Form */}
          <div className='space-y-4'>
            {console.log(
              '🔍 [AdminPaymentDialog] Passing selectedInstallment to PaymentForm:',
              {
                selectedInstallmentDetails: selectedInstallment
                  ? {
                      id: selectedInstallment.id,
                      semesterNumber: selectedInstallment.semesterNumber,
                      installmentNumber: selectedInstallment.installmentNumber,
                      amount: selectedInstallment.amount,
                      status: selectedInstallment.status,
                    }
                  : null,
                pendingAmountCalculated: pendingAmount,
                adminPaymentBreakdownTotalAmount:
                  adminPaymentBreakdown?.totalAmount,
                paymentBreakdownForForm: paymentBreakdownForForm
                  ? {
                      totalAmount: paymentBreakdownForForm.totalAmount,
                      pendingAmount: paymentBreakdownForForm.pendingAmount,
                    }
                  : null,
              }
            )}
            <PaymentForm
              paymentSubmissions={new Map()}
              submittingPayments={submittingPayments}
              onPaymentSubmission={handlePaymentSubmission}
              studentData={studentData}
              selectedPaymentPlan={student.payment_plan}
              paymentBreakdown={paymentBreakdownForForm}
              selectedInstallment={selectedInstallment}
              isAdminMode={true} // Enable admin mode to show payment ID fields for online payments
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
