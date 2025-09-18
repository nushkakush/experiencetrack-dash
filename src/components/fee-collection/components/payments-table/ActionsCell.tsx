import React, { forwardRef, useImperativeHandle } from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary } from '@/types/fee';
import { StudentDetailsModal } from '@/components/fee-collection/StudentDetailsModal';
import { SimplePartialApprovalDialog } from '@/components/common/payments/SimplePartialApprovalDialog';
import { useActionsCell } from './hooks/useActionsCell';
import { ActionButtons } from './ActionButtons';
import { TransactionsDialog } from './TransactionsDialog';
import { RejectionDialog } from './RejectionDialog';
import { ResetConfirmationDialog } from './ResetConfirmationDialog';

interface ActionsCellProps {
  student: StudentPaymentSummary;
  onStudentSelect: (student: StudentPaymentSummary) => void;
  onVerificationUpdate?: () => void;
  onPendingCountUpdate?: () => void;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, unknown>;
    instalment_wise_dates?: Record<string, unknown>;
  };
}

export interface ActionsCellRef {
  openStudentDetails: () => void;
}

export const ActionsCell = forwardRef<ActionsCellRef, ActionsCellProps>(({
  student,
  onStudentSelect,
  onVerificationUpdate,
  onPendingCountUpdate,
  feeStructure,
}, ref) => {
  const {
    // State
    studentDetailsOpen,
    setStudentDetailsOpen,
    transactionsOpen,
    setTransactionsOpen,
    transactions,
    loading,
    verifyingId,
    rejectingId,
    rejectionReason,
    setRejectionReason,
    showRejectDialog,
    setShowRejectDialog,
    currentTransaction,
    setCurrentTransaction,
    showPartialApprovalDialog,
    setShowPartialApprovalDialog,
    partialApprovalTransaction,
    setPartialApprovalTransaction,
    expectedAmount,
    showResetConfirmation,
    setShowResetConfirmation,
    resetTransaction,
    setResetTransaction,
    studentPendingCount,

    // Actions
    fetchTransactions,
    handleVerify,
    handleRejectClick,
    handleRejectSubmit,
    handleResetClick,
    handleResetConfirm,
    handlePartialApprovalClick,
    handlePartialApprovalWrapper,
  } = useActionsCell({
    student,
    onPendingCountUpdate,
    onVerificationUpdate, // Pass onVerificationUpdate to the hook
    feeStructure,
  });

  // Expose the openStudentDetails function to parent components
  useImperativeHandle(ref, () => ({
    openStudentDetails: () => {
      console.log('ActionsCell: Opening student details modal, current state:', studentDetailsOpen);
      if (!studentDetailsOpen) {
        setStudentDetailsOpen(true);
      } else {
        console.log('ActionsCell: Modal is already open, ignoring request');
      }
    },
  }));

  // Debug logging for modal state changes
  React.useEffect(() => {
    console.log('ActionsCell: studentDetailsOpen changed to:', studentDetailsOpen);
  }, [studentDetailsOpen]);

  // Debug logging for when the modal is opened via ref
  React.useEffect(() => {
    if (studentDetailsOpen) {
      console.log('ActionsCell: Modal opened, student:', student.student?.first_name, student.student?.last_name);
    }
  }, [studentDetailsOpen, student.student?.first_name, student.student?.last_name]);

  const handleViewStudentDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStudentDetailsOpen(true);
  };

  const handleViewTransactions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetchTransactions();
    setTransactionsOpen(true);
  };

  const handleSendMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement send communication
  };

  const handleRejectCancel = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
    setCurrentTransaction(null);
  };

  const handleResetCancel = () => {
    setShowResetConfirmation(false);
    setResetTransaction(null);
  };

  return (
    <TableCell>
      <ActionButtons
        studentPendingCount={studentPendingCount}
        onViewStudentDetails={handleViewStudentDetails}
        onViewTransactions={handleViewTransactions}
        onSendMessage={handleSendMessage}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={student}
        open={studentDetailsOpen}
        onOpenChange={setStudentDetailsOpen}
        feeStructure={feeStructure}
      />

      {/* Payment Transactions Dialog */}
      <TransactionsDialog
        open={transactionsOpen}
        onOpenChange={setTransactionsOpen}
        loading={loading}
        transactions={transactions}
        studentName={`${student.student?.first_name || ''} ${student.student?.last_name || ''}`.trim()}
        expectedAmount={expectedAmount}
        verifyingId={verifyingId}
        rejectingId={rejectingId}
        onVerify={handleVerify}
        onRejectClick={handleRejectClick}
        onResetClick={handleResetClick}
        onPartialApprovalClick={handlePartialApprovalClick}
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onSubmit={handleRejectSubmit}
        onCancel={handleRejectCancel}
        loading={verifyingId === currentTransaction?.id}
      />

      {/* Reset Confirmation Dialog */}
      <ResetConfirmationDialog
        open={showResetConfirmation}
        onOpenChange={setShowResetConfirmation}
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        loading={verifyingId === resetTransaction?.id}
      />

      {/* Simplified Partial Approval Dialog */}
      <SimplePartialApprovalDialog
        open={showPartialApprovalDialog}
        onOpenChange={setShowPartialApprovalDialog}
        studentName={`${student.student?.first_name || ''} ${student.student?.last_name || ''}`.trim()}
        submittedAmount={partialApprovalTransaction?.amount || 0}
        expectedAmount={expectedAmount}
        onApprove={handlePartialApprovalWrapper}
        onReject={() =>
          handleVerify(partialApprovalTransaction?.id || '', 'rejected')
        }
        loading={verifyingId === partialApprovalTransaction?.id}
      />
    </TableCell>
  );
});
