import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Mail,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentSummary } from '@/types/fee';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { toast } from 'sonner';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';
import { StudentDetailsModal } from '@/components/fee-collection/StudentDetailsModal';
import { useAuth } from '@/hooks/useAuth';
import { FeeStructureService } from '@/services/feeStructure.service';
import { useStudentPendingVerifications } from '@/pages/fee-payment-dashboard/hooks/useStudentPendingVerifications';
import { cn } from '@/lib/utils';

interface ActionsCellProps {
  student: StudentPaymentSummary;
  onStudentSelect: (student: StudentPaymentSummary) => void;
  onVerificationUpdate?: () => void;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: any;
    sem_wise_dates?: any;
    instalment_wise_dates?: any;
  };
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  student,
  onStudentSelect,
  onVerificationUpdate,
  feeStructure,
}) => {
  const { profile } = useAuth();
  const [studentDetailsOpen, setStudentDetailsOpen] = React.useState(false);
  const [transactionsOpen, setTransactionsOpen] = React.useState(false);
  const [transactions, setTransactions] = React.useState<
    PaymentTransactionRow[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [currentTransaction, setCurrentTransaction] =
    React.useState<PaymentTransactionRow | null>(null);
  const [customPlanOpen, setCustomPlanOpen] = React.useState(false);
  const [savingCustom, setSavingCustom] = React.useState(false);
  const [customDates, setCustomDates] = React.useState<Record<string, string>>(
    {}
  );

  // Get student-specific pending verification count
  const studentPaymentId = (
    student as StudentPaymentSummary & { student_payment_id?: string }
  )?.student_payment_id;
  const { pendingCount: studentPendingCount } =
    useStudentPendingVerifications(studentPaymentId);

  const fetchTransactions = async () => {
    if (!student || !student.student_id) return;
    if (
      !(student as StudentPaymentSummary & { student_payment_id?: string })
        ?.student_payment_id
    )
      return;
    setLoading(true);
    try {
      const res = await paymentTransactionService.getByPaymentId(
        (student as StudentPaymentSummary & { student_payment_id?: string })
          .student_payment_id!
      );
      if (res.success) setTransactions(res.data || []);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (
    transactionId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      setVerifyingId(transactionId);
      const adminId = profile?.user_id;
      if (!adminId) {
        toast.error('User not authenticated');
        return;
      }
      const res = await paymentTransactionService.verifyPayment(
        transactionId,
        adminId,
        decision,
        notes,
        decision === 'rejected' ? notes : undefined
      );
      if (res.success) {
        toast.success(
          decision === 'approved' ? 'Payment approved' : 'Payment rejected'
        );
        await fetchTransactions();
        setShowRejectDialog(false);
        setRejectionReason('');
        setCurrentTransaction(null);
        // Call the callback to refresh pending verification count
        onVerificationUpdate?.();
      } else {
        toast.error('Verification failed');
      }
    } catch (e) {
      toast.error('Verification failed');
    } finally {
      setVerifyingId(null);
      setRejectingId(null);
    }
  };

  const handleRejectClick = (transaction: PaymentTransactionRow) => {
    setCurrentTransaction(transaction);
    setShowRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (currentTransaction) {
      const action =
        currentTransaction.verification_status === 'approved'
          ? 'rejected'
          : 'rejected';
      handleVerify(currentTransaction.id, action, rejectionReason);
    }
  };

  return (
    <TableCell>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='sm'
          onClick={e => {
            e.stopPropagation();
            setStudentDetailsOpen(true);
          }}
          title='View Student Details'
        >
          <Eye className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={e => {
            e.stopPropagation();
            setCustomPlanOpen(true);
          }}
        >
          Set Custom Plan
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={async e => {
            e.stopPropagation();
            try {
              // TODO: Implement revert to cohort plan functionality
              toast.info('Revert to cohort plan functionality coming soon');
            } catch {
              toast.error('Failed to revert to cohort plan');
            }
          }}
        >
          Revert to Cohort Plan
        </Button>
        <div className='relative'>
          <Button
            variant='ghost'
            size='sm'
            onClick={async e => {
              e.stopPropagation();
              await fetchTransactions();
              setTransactionsOpen(true);
            }}
            title='View Transactions'
          >
            <FileText className='h-4 w-4' />
          </Button>
          {studentPendingCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold'
            >
              {studentPendingCount > 99 ? '99+' : studentPendingCount}
            </Badge>
          )}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={e => {
            e.stopPropagation();
            // TODO: Implement send communication
          }}
          title='Message'
        >
          <Mail className='h-4 w-4' />
        </Button>
      </div>

      {/* Student Details Modal */}
      {/* Placeholder Custom Plan Dialog (UI only; save wired later) */}
      <Dialog open={customPlanOpen} onOpenChange={setCustomPlanOpen}>
        <DialogContent
          className='max-w-2xl'
          aria-describedby='custom-plan-description'
        >
          <DialogHeader>
            <DialogTitle>Set Custom Payment Plan</DialogTitle>
          </DialogHeader>
          <div id='custom-plan-description' className='sr-only'>
            Create a custom payment plan for this student
          </div>
          <div className='text-sm text-muted-foreground space-y-2'>
            <p>
              This will create a custom fee structure for this student in this
              cohort.
            </p>
            <div className='grid grid-cols-1 gap-2'>
              {/* Minimal date editor (flat keys) */}
              <div className='flex items-center gap-2'>
                <Label className='w-40'>One-shot date</Label>
                <input
                  type='date'
                  className='border rounded px-2 py-1'
                  value={customDates['one-shot'] || ''}
                  onChange={e =>
                    setCustomDates(prev => ({
                      ...prev,
                      ['one-shot']: e.target.value,
                    }))
                  }
                />
              </div>
              <div className='flex items-center gap-2'>
                <Label className='w-40'>Semester 1 - Installment 1</Label>
                <input
                  type='date'
                  className='border rounded px-2 py-1'
                  value={customDates['semester-1-instalment-0'] || ''}
                  onChange={e =>
                    setCustomDates(prev => ({
                      ...prev,
                      ['semester-1-instalment-0']: e.target.value,
                    }))
                  }
                />
              </div>
              <div className='flex items-center gap-2'>
                <Label className='w-40'>Semester 1 - Installment 2</Label>
                <input
                  type='date'
                  className='border rounded px-2 py-1'
                  value={customDates['semester-1-instalment-1'] || ''}
                  onChange={e =>
                    setCustomDates(prev => ({
                      ...prev,
                      ['semester-1-instalment-1']: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setCustomPlanOpen(false)}
            >
              Close
            </Button>
            <Button
              disabled={savingCustom}
              onClick={async () => {
                try {
                  setSavingCustom(true);
                  const cohortId = String(student.student?.cohort_id);
                  const studentId = String(student.student_id);
                  // TODO: Implement proper custom plan creation with dates
                  toast.info('Custom plan creation functionality coming soon');
                  setCustomPlanOpen(false);
                  setCustomDates({});
                } catch (e) {
                  toast.error('Failed to create custom plan');
                } finally {
                  setSavingCustom(false);
                }
              }}
            >
              {savingCustom ? 'Saving…' : 'Create Custom Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <StudentDetailsModal
        student={student}
        open={studentDetailsOpen}
        onOpenChange={setStudentDetailsOpen}
        feeStructure={feeStructure}
      />

      {/* Payment Transactions Dialog */}
      <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
        <DialogContent
          className='max-w-6xl max-h-[85vh] overflow-y-auto'
          aria-describedby='transactions-description'
        >
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold'>
              Payment Transactions
            </DialogTitle>
            <p className='text-sm text-muted-foreground'>
              Review and verify payment submissions for{' '}
              {student.student?.first_name} {student.student?.last_name}
            </p>
          </DialogHeader>
          <div id='transactions-description' className='sr-only'>
            Payment transactions table with verification actions
          </div>

          <div className='space-y-6'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex items-center gap-3 text-muted-foreground'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary'></div>
                  <span>Loading transactions...</span>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className='text-center py-12'>
                <div className='text-muted-foreground mb-2'>
                  <FileText className='h-12 w-12 mx-auto opacity-50' />
                </div>
                <h3 className='font-medium text-foreground mb-1'>
                  No transactions found
                </h3>
                <p className='text-sm text-muted-foreground'>
                  This student hasn't submitted any payment transactions yet.
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Transactions Table */}
                <div className='border rounded-lg overflow-hidden'>
                  <table className='w-full'>
                    <thead className='bg-muted/50'>
                      <tr>
                        <th className='text-left p-3 font-medium text-sm'>
                          Payment Details
                        </th>
                        <th className='text-left p-3 font-medium text-sm'>
                          Reference
                        </th>
                        <th className='text-left p-3 font-medium text-sm'>
                          Bank Info
                        </th>
                        <th className='text-left p-3 font-medium text-sm'>
                          Dates
                        </th>
                        <th className='text-left p-3 font-medium text-sm'>
                          Status
                        </th>
                        <th className='text-left p-3 font-medium text-sm'>
                          Proof
                        </th>
                        <th className='text-left p-3 font-medium text-sm'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {transactions.map(t => (
                        <tr key={t.id} className='hover:bg-muted/30'>
                          <td className='p-3'>
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  variant='secondary'
                                  className='font-medium text-xs'
                                >
                                  {t.payment_method
                                    ?.replace('_', ' ')
                                    .toUpperCase()}
                                </Badge>
                                <Badge
                                  variant='outline'
                                  className='font-semibold text-sm'
                                >
                                  ₹{Number(t.amount).toLocaleString('en-IN')}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className='p-3'>
                            {t.reference_number && (
                              <div className='text-sm'>
                                <span className='font-mono text-muted-foreground'>
                                  {t.reference_number}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className='p-3'>
                            {t.bank_name && (
                              <div className='text-sm'>
                                <div className='font-medium'>{t.bank_name}</div>
                                {t.bank_branch && (
                                  <div className='text-xs text-muted-foreground'>
                                    {t.bank_branch}
                                  </div>
                                )}
                                {t.payer_upi_id && (
                                  <div className='text-xs text-muted-foreground font-mono'>
                                    UPI: {t.payer_upi_id}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className='p-3'>
                            <div className='text-sm space-y-1'>
                              {t.payment_date && (
                                <div>
                                  <span className='text-muted-foreground'>
                                    Payment:
                                  </span>
                                  <div className='font-medium'>
                                    {t.payment_date}
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className='text-muted-foreground'>
                                  Submitted:
                                </span>
                                <div className='font-medium'>
                                  {new Date(t.created_at).toLocaleDateString(
                                    'en-IN',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='p-3'>
                            <Badge
                              variant={
                                t.verification_status === 'approved'
                                  ? 'default'
                                  : t.verification_status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className='font-medium'
                            >
                              {t.verification_status === 'verification_pending'
                                ? 'Verification Pending'
                                : t.verification_status === 'approved'
                                  ? '✅ Approved'
                                  : t.verification_status || 'Pending'}
                            </Badge>
                          </td>
                          <td className='p-3'>
                            <div className='flex items-center gap-2'>
                              {t.transaction_screenshot_url && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    window.open(
                                      t.transaction_screenshot_url,
                                      '_blank'
                                    )
                                  }
                                  className='h-8 px-2 text-xs'
                                >
                                  <ExternalLink className='h-3 w-3 mr-1' />
                                  Screenshot
                                </Button>
                              )}
                              {t.proof_of_payment_url && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    window.open(
                                      t.proof_of_payment_url,
                                      '_blank'
                                    )
                                  }
                                  className='h-8 px-2 text-xs'
                                >
                                  <ExternalLink className='h-3 w-3 mr-1' />
                                  Proof
                                </Button>
                              )}
                              {t.receipt_url && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    window.open(t.receipt_url, '_blank')
                                  }
                                  className='h-8 px-2 text-xs'
                                >
                                  <FileText className='h-3 w-3 mr-1' />
                                  Receipt
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className='p-3'>
                            <div className='flex items-center gap-2'>
                              {t.verification_status === 'approved' ? (
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleRejectClick(t)}
                                  className='min-w-[80px] h-8 text-xs'
                                >
                                  <XCircle className='h-3 w-3 mr-1' />
                                  Reset
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size='sm'
                                    variant='default'
                                    disabled={verifyingId === t.id}
                                    onClick={() =>
                                      handleVerify(t.id, 'approved')
                                    }
                                    className='min-w-[80px] h-8 text-xs'
                                  >
                                    {verifyingId === t.id ? (
                                      <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>
                                    ) : (
                                      <>
                                        <CheckCircle2 className='h-3 w-3 mr-1' />
                                        Approve
                                      </>
                                    )}
                                  </Button>

                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    disabled={
                                      verifyingId === t.id ||
                                      rejectingId === t.id
                                    }
                                    onClick={() => handleRejectClick(t)}
                                    className='min-w-[80px] h-8 text-xs'
                                  >
                                    {rejectingId === t.id ? (
                                      <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white'></div>
                                    ) : (
                                      <>
                                        <XCircle className='h-3 w-3 mr-1' />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent
          className='max-w-md'
          aria-describedby='rejection-dialog-description'
        >
          <DialogHeader>
            <DialogTitle>
              {currentTransaction?.verification_status === 'approved'
                ? 'Reset Payment Status'
                : 'Reject Payment'}
            </DialogTitle>
          </DialogHeader>
          <div id='rejection-dialog-description' className='sr-only'>
            Dialog for providing reason for payment status change
          </div>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='rejection-reason'>
                {currentTransaction?.verification_status === 'approved'
                  ? 'Reason for Reset *'
                  : 'Reason for Rejection *'}
              </Label>
              <Textarea
                id='rejection-reason'
                placeholder={
                  currentTransaction?.verification_status === 'approved'
                    ? 'Please provide a reason for resetting this payment status...'
                    : 'Please provide a reason for rejecting this payment...'
                }
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className='mt-2'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setCurrentTransaction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleRejectSubmit}
              disabled={
                !rejectionReason.trim() ||
                rejectingId === currentTransaction?.id
              }
            >
              {currentTransaction?.verification_status === 'approved'
                ? 'Reset to Pending'
                : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableCell>
  );
};
