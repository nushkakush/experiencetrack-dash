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
  CreditCard,
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
import { SimplePartialApprovalDialog } from '@/components/common/payments/SimplePartialApprovalDialog';

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
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, unknown>;
    instalment_wise_dates?: Record<string, unknown>;
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
  const [showPartialApprovalDialog, setShowPartialApprovalDialog] = React.useState(false);
  const [partialApprovalTransaction, setPartialApprovalTransaction] = 
    React.useState<PaymentTransactionRow | null>(null);
  const [expectedAmount, setExpectedAmount] = React.useState(0);
  // Custom plan functionality temporarily removed

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

  const calculateExpectedAmount = async (transaction: PaymentTransactionRow): Promise<number> => {
    try {
      // Try to get the expected amount from the payment engine for accuracy
      if (student.student_id && student.student?.cohort_id && student.payment_plan && feeStructure) {
        try {
          // Import the payment engine client
          const { getFullPaymentView } = await import('@/services/payments/paymentEngineClient');
          
          // Get payment breakdown from payment engine
          const { breakdown } = await getFullPaymentView({
            studentId: String(student.student_id),
            cohortId: String(student.student?.cohort_id),
            paymentPlan: student.payment_plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
            feeStructureData: {
              total_program_fee: feeStructure.total_program_fee,
              admission_fee: feeStructure.admission_fee,
              number_of_semesters: feeStructure.number_of_semesters,
              instalments_per_semester: feeStructure.instalments_per_semester,
              one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
              one_shot_dates: feeStructure.one_shot_dates,
              sem_wise_dates: feeStructure.sem_wise_dates,
              instalment_wise_dates: feeStructure.instalment_wise_dates,
            }
          });

          // Extract the expected amount based on payment plan
          if (student.payment_plan === 'one_shot' && breakdown.oneShotPayment) {
            return breakdown.oneShotPayment.amountPayable;
          } else if (student.payment_plan === 'sem_wise' && breakdown.semesters?.length > 0) {
            // For semester-wise, get the first semester's amount as they're typically equal
            return breakdown.semesters[0].total.totalPayable;
          } else if (student.payment_plan === 'instalment_wise' && breakdown.semesters?.length > 0) {
            // For installment-wise, get the first installment amount
            const firstInstallment = breakdown.semesters[0]?.instalments?.[0];
            if (firstInstallment) {
              return firstInstallment.amountPayable;
            }
          }
        } catch (paymentEngineError) {
          console.warn('Failed to get amount from payment engine, falling back to calculation:', paymentEngineError);
        }
      }

      // Fallback: Simple calculation if payment engine fails
      if (feeStructure && student.payment_plan) {
        if (student.payment_plan === 'one_shot') {
          return (feeStructure.total_program_fee - feeStructure.admission_fee) * 
                 (1 - feeStructure.one_shot_discount_percentage / 100);
        } else if (student.payment_plan === 'sem_wise') {
          return (feeStructure.total_program_fee - feeStructure.admission_fee) / 
                 feeStructure.number_of_semesters;
        } else if (student.payment_plan === 'instalment_wise') {
          const totalInstallments = feeStructure.number_of_semesters * feeStructure.instalments_per_semester;
          return (feeStructure.total_program_fee - feeStructure.admission_fee) / totalInstallments;
        }
      }
      
      // Final fallback: use transaction amount
      return Number(transaction.amount);
    } catch (error) {
      console.error('Error calculating expected amount:', error);
      return Number(transaction.amount);
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

  const handlePartialApprovalClick = async (transaction: PaymentTransactionRow) => {
    setPartialApprovalTransaction(transaction);
    
    // Calculate the correct expected amount
    const calculatedExpectedAmount = await calculateExpectedAmount(transaction);
    setExpectedAmount(calculatedExpectedAmount);
    
    console.log('🎯 [PartialApproval] Calculated expected amount:', {
      transactionId: transaction.id,
      studentSubmitted: transaction.amount,
      calculatedExpected: calculatedExpectedAmount,
      paymentPlan: student.payment_plan,
      feeStructure: feeStructure ? 'Available' : 'Not available'
    });
    
    setShowPartialApprovalDialog(true);
  };

  const handlePartialApprovalSubmit = async (
    transactionId: string,
    actualAmount: number
  ) => {
    try {
      setVerifyingId(transactionId);
      const adminId = profile?.user_id;
      if (!adminId) {
        toast.error('User not authenticated');
        return;
      }

      // Determine if this is a partial or full payment based on actual amount vs expected
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      // Use the calculated expected amount (not student's submitted amount)
      const isPartial = actualAmount < expectedAmount;
      
      console.log('🎯 [PartialApproval] Payment calculation:', {
        transactionId,
        studentSubmitted: Number(transaction.amount),
        actualExpected: expectedAmount,
        adminVerified: actualAmount,
        isPartial,
        remainingAmount: expectedAmount - actualAmount
      });
      
      const result = await paymentTransactionService.partialApproval(
        transactionId,
        adminId,
        isPartial ? 'partial' : 'full',
        actualAmount,
        `Actual amount received: ₹${actualAmount.toLocaleString('en-IN')}`,
        undefined
      );

      if (result.success && result.data) {
        const message = isPartial 
          ? `Partial payment of ₹${actualAmount.toLocaleString('en-IN')} approved`
          : `Full payment of ₹${actualAmount.toLocaleString('en-IN')} approved`;
        toast.success(message);
        await fetchTransactions();
        setShowPartialApprovalDialog(false);
        setPartialApprovalTransaction(null);
        onVerificationUpdate?.();
      } else {
        toast.error('Processing failed');
      }
    } catch (error) {
      console.error('Partial approval error:', error);
      toast.error('Processing failed');
    } finally {
      setVerifyingId(null);
    }
  };

  // Helper function to analyze partial payment context
  const getPartialPaymentContext = (transaction: PaymentTransactionRow) => {
    console.log('🔍 [ActionsCell] Analyzing partial payment context for transaction:', {
      id: transaction.id,
      amount: transaction.amount,
      partial_sequence: transaction.partial_payment_sequence,
      status: transaction.verification_status
    });

    // Check if this transaction has partial_payment_sequence
    const hasPartialSequence = transaction.partial_payment_sequence && transaction.partial_payment_sequence > 0;
    
    // Count how many transactions exist for this installment
    // Use installment_id if available, or fallback to semester_number if that's available
    const installmentKey = transaction.installment_id || `${transaction.semester_number || 'unknown'}`;
    const relatedTransactions = transactions.filter(t => {
      const tKey = t.installment_id || `${t.semester_number || 'unknown'}`;
      return tKey === installmentKey;
    });

    console.log('🔍 [ActionsCell] Related transactions for installment:', {
      installmentKey,
      relatedTransactionsCount: relatedTransactions.length,
      relatedTransactions: relatedTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.verification_status,
        partial_sequence: t.partial_payment_sequence
      }))
    });

    // Check if there are approved partial transactions
    const approvedPartials = relatedTransactions.filter(t => 
      t.verification_status === 'approved' && 
      t.partial_payment_sequence && 
      t.partial_payment_sequence > 0
    );

    // Calculate total amounts
    const totalAmount = relatedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const approvedAmount = approvedPartials.reduce((sum, t) => sum + Number(t.amount), 0);

    console.log('🔍 [ActionsCell] Amount calculations:', {
      totalAmount,
      approvedAmount,
      expectedAmount,
      approvedPartialsCount: approvedPartials.length
    });

    // Determine if this is actually a partial payment based on amounts
    let isActuallyPartial = false;
    
    if (hasPartialSequence) {
      // If this transaction covers the full expected amount, it's not partial
      if (transaction.amount >= expectedAmount) {
        isActuallyPartial = false;
        console.log('🔍 [ActionsCell] Transaction covers full expected amount - NOT partial');
      } else {
        // Check if the total approved amount equals or exceeds the expected amount
        isActuallyPartial = approvedAmount < expectedAmount;
        console.log('🔍 [ActionsCell] Transaction is partial based on approved amount:', {
          approvedAmount,
          expectedAmount,
          isActuallyPartial
        });
      }
    } else {
      // If no partial sequence, check if there are multiple transactions for this installment
      isActuallyPartial = relatedTransactions.length > 1 && approvedAmount < expectedAmount;
      console.log('🔍 [ActionsCell] No partial sequence, checking multiple transactions:', {
        relatedTransactionsCount: relatedTransactions.length,
        approvedAmount,
        expectedAmount,
        isActuallyPartial
      });
    }

    const result = {
      hasPartialSequence,
      partialSequence: transaction.partial_payment_sequence || 0,
      relatedTransactionCount: relatedTransactions.length,
      approvedPartialsCount: approvedPartials.length,
      totalApprovedAmount: approvedAmount,
      totalAmount,
      isPartialPayment: isActuallyPartial
    };

    console.log('🔍 [ActionsCell] Final result:', result);
    return result;
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
        {/* Custom plan and revert actions temporarily removed */}
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
      {/* Custom plan dialog temporarily removed */}
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
                {/* Transactions Cards */}
                {transactions.map((t, index) => {
                  const partialContext = getPartialPaymentContext(t);
                  
                  return (
                  <div
                    key={t.id}
                    className='border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors'
                  >
                    {/* Card Header */}
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-2 flex-wrap'>
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
                        
                        {/* Partial Payment Indicator */}
                        {partialContext.isPartialPayment && (
                          <Badge
                            variant='outline'
                            className='font-medium text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50'
                          >
                            <CreditCard className='h-3 w-3 mr-1' />
                            {partialContext.isPartialPayment 
                              ? (partialContext.hasPartialSequence 
                                  ? `Partial Payment ${partialContext.partialSequence}`
                                  : 'Related to Partial Payment')
                              : 'Payment'
                            }
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Partial Payment Context */}
                    {partialContext.isPartialPayment && (
                      <div className='mb-4 p-3 bg-orange-50/50 border border-orange-200/50 rounded-lg dark:bg-orange-950/20 dark:border-orange-800/50'>
                        <div className='flex items-center gap-2 mb-2'>
                          <CreditCard className='h-4 w-4 text-orange-600 dark:text-orange-400' />
                          <p className='text-sm font-medium text-orange-800 dark:text-orange-200'>Partial Payment Context</p>
                        </div>
                        <div className='space-y-1 text-xs text-orange-700 dark:text-orange-300'>
                          {partialContext.approvedPartialsCount > 0 && (
                            <p>
                              • {partialContext.approvedPartialsCount} partial payment(s) already approved 
                              (Total: ₹{partialContext.totalApprovedAmount.toLocaleString('en-IN')})
                            </p>
                          )}
                          {partialContext.hasPartialSequence && (
                            <p>
                              • This is partial payment #{partialContext.partialSequence} for this installment
                            </p>
                          )}
                          <p>
                            • {partialContext.relatedTransactionCount} total transaction(s) for this installment
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Card Content - Flexible Layout */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>
                      {/* Reference Info */}
                      {t.reference_number && (
                        <div className='space-y-1'>
                          <p className='text-xs text-muted-foreground font-medium'>Reference</p>
                          <p className='text-sm font-mono text-foreground'>
                            {t.reference_number}
                          </p>
                        </div>
                      )}

                      {/* Bank Info */}
                      {(t.bank_name || t.bank_branch || t.payer_upi_id) && (
                        <div className='space-y-1'>
                          <p className='text-xs text-muted-foreground font-medium'>Bank Info</p>
                          <div className='text-sm space-y-1'>
                            {t.bank_name && (
                              <div className='font-medium text-foreground'>{t.bank_name}</div>
                            )}
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
                        </div>
                      )}

                      {/* UTR Number */}
                      {t.utr_number && (
                        <div className='space-y-1'>
                          <p className='text-xs text-muted-foreground font-medium'>UTR Number</p>
                          <p className='text-sm font-mono text-foreground'>
                            {t.utr_number}
                          </p>
                        </div>
                      )}

                      {/* Payment Date */}
                      {t.payment_date && (
                        <div className='space-y-1'>
                          <p className='text-xs text-muted-foreground font-medium'>Payment Date</p>
                          <p className='text-sm text-foreground'>
                            {t.payment_date}
                          </p>
                        </div>
                      )}

                      {/* Submitted Date */}
                      <div className='space-y-1'>
                        <p className='text-xs text-muted-foreground font-medium'>Submitted</p>
                        <p className='text-sm text-foreground'>
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
                        </p>
                      </div>

                      {/* Razorpay ID */}
                      {t.razorpay_order_id && (
                        <div className='space-y-1'>
                          <p className='text-xs text-muted-foreground font-medium'>Razorpay Order ID</p>
                          <p className='text-sm font-mono text-foreground'>
                            {t.razorpay_order_id}
                          </p>
                        </div>
                      )}

                      {/* Payment ID */}
                      {t.razorpay_payment_id && (
                        <div className='space-y-1'>
                          <p className='text-xs text-muted-foreground font-medium'>Payment ID</p>
                          <p className='text-sm font-mono text-foreground'>
                            {t.razorpay_payment_id}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {t.notes && (
                        <div className='space-y-1 md:col-span-2 lg:col-span-3'>
                          <p className='text-xs text-muted-foreground font-medium'>Notes</p>
                          <p className='text-sm text-foreground'>
                            {t.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Proof Documents */}
                    {(t.transaction_screenshot_url || t.proof_of_payment_url || t.receipt_url) && (
                      <div className='mb-4'>
                        <p className='text-xs text-muted-foreground font-medium mb-2'>Proof Documents</p>
                        <div className='flex items-center gap-2 flex-wrap'>
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
                      </div>
                    )}

                    {/* Action Buttons */}
                    <Separator className='mb-4' />
                    <div className='flex items-center justify-end gap-2 flex-wrap'>
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
                            variant='outline'
                            disabled={verifyingId === t.id}
                            onClick={() => handlePartialApprovalClick(t)}
                            className='min-w-[110px] h-8 text-xs'
                          >
                            {verifyingId === t.id ? (
                              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-primary'></div>
                            ) : (
                              <>
                                <Clock className='h-3 w-3 mr-1' />
                                Partial Approve
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
                  </div>
                  );
                })}
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

      {/* Simplified Partial Approval Dialog */}
      <SimplePartialApprovalDialog
        open={showPartialApprovalDialog}
        onOpenChange={setShowPartialApprovalDialog}
        transactionId={partialApprovalTransaction?.id || ''}
        studentName={`${student.student?.first_name || ''} ${student.student?.last_name || ''}`.trim()}
        submittedAmount={partialApprovalTransaction?.amount || 0}
        expectedAmount={expectedAmount} // Now using the correctly calculated expected amount
        onApprove={handlePartialApprovalSubmit}
        loading={verifyingId === partialApprovalTransaction?.id}
      />
    </TableCell>
  );
};
