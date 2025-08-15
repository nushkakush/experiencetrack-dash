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

interface ActionsCellProps {
  student: StudentPaymentSummary;
  onStudentSelect: (student: StudentPaymentSummary) => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  student,
  onStudentSelect,
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
  const [currentTransaction, setCurrentTransaction] = React.useState<PaymentTransactionRow | null>(null);

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
      const action = currentTransaction.verification_status === 'approved' ? 'rejected' : 'rejected';
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
      <StudentDetailsModal
        student={student}
        open={studentDetailsOpen}
        onOpenChange={setStudentDetailsOpen}
      />

      {/* Payment Transactions Dialog */}
      <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
        <DialogContent className='max-w-4xl max-h-[85vh] overflow-y-auto' aria-describedby='transactions-description'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold'>Payment Transactions</DialogTitle>
            <p className='text-sm text-muted-foreground'>
              Review and verify payment submissions for {student.student?.first_name} {student.student?.last_name}
            </p>
          </DialogHeader>
          <div id='transactions-description' className='sr-only'>Payment transactions list with verification actions</div>
          
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
                <h3 className='font-medium text-foreground mb-1'>No transactions found</h3>
                <p className='text-sm text-muted-foreground'>
                  This student hasn't submitted any payment transactions yet.
                </p>
              </div>
            ) : (
              <div className='space-y-6'>
                {transactions.map(t => (
                  <div key={t.id} className='space-y-4'>
                    {/* Header Section */}
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-2'>
                          <Badge variant='secondary' className='font-medium'>
                            {t.payment_method?.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant='outline' className='font-semibold text-base'>
                            ₹{Number(t.amount).toLocaleString('en-IN')}
                          </Badge>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
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
                      </div>
                    </div>

                    {/* Transaction Details Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {t.reference_number && (
                        <div className='flex items-center gap-2 text-sm'>
                          <FileText className='h-4 w-4 text-muted-foreground' />
                          <span className='font-medium'>Reference:</span>
                          <span className='font-mono text-muted-foreground'>{t.reference_number}</span>
                        </div>
                      )}
                      
                      {t.bank_name && (
                        <div className='flex items-center gap-2 text-sm'>
                          <div className='h-4 w-4 text-muted-foreground'>🏦</div>
                          <span className='font-medium'>Bank:</span>
                          <span className='text-muted-foreground'>
                            {t.bank_name}
                            {t.bank_branch && <span className='text-xs ml-1'>({t.bank_branch})</span>}
                          </span>
                        </div>
                      )}
                      
                      {t.payer_upi_id && (
                        <div className='flex items-center gap-2 text-sm'>
                          <div className='h-4 w-4 text-muted-foreground'>📱</div>
                          <span className='font-medium'>UPI ID:</span>
                          <span className='font-mono text-muted-foreground'>{t.payer_upi_id}</span>
                        </div>
                      )}
                      
                      {t.payment_date && (
                        <div className='flex items-center gap-2 text-sm'>
                          <Clock className='h-4 w-4 text-muted-foreground' />
                          <span className='font-medium'>Payment Date:</span>
                          <span className='text-muted-foreground'>{t.payment_date}</span>
                        </div>
                      )}
                      
                      <div className='flex items-center gap-2 text-sm'>
                        <Clock className='h-4 w-4 text-muted-foreground' />
                        <span className='font-medium'>Submitted:</span>
                        <span className='text-muted-foreground'>
                          {new Date(t.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex items-center gap-3'>
                      {t.proof_of_payment_url && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1'
                          onClick={() => window.open(t.proof_of_payment_url, '_blank')}
                        >
                          <ExternalLink className='h-4 w-4 mr-2' />
                          View Payment Proof
                        </Button>
                      )}
                      
                      {t.receipt_url && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => window.open(t.receipt_url, '_blank')}
                        >
                          <FileText className='h-4 w-4 mr-2' />
                          View Receipt
                        </Button>
                      )}
                      
                      <div className='flex items-center gap-2 ml-auto'>
                        {t.verification_status === 'approved' ? (
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleRejectClick(t)}
                              className='min-w-[100px]'
                            >
                              <XCircle className='h-4 w-4 mr-2' />
                              Reset to Pending
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size='sm'
                              variant='default'
                              disabled={verifyingId === t.id}
                              onClick={() => handleVerify(t.id, 'approved')}
                              className='min-w-[100px]'
                            >
                              {verifyingId === t.id ? (
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                              ) : (
                                <>
                                  <CheckCircle2 className='h-4 w-4 mr-2' />
                                  Approve
                                </>
                              )}
                            </Button>
                            
                            <Button
                              size='sm'
                              variant='destructive'
                              disabled={verifyingId === t.id || rejectingId === t.id}
                              onClick={() => handleRejectClick(t)}
                              className='min-w-[100px]'
                            >
                              {rejectingId === t.id ? (
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                              ) : (
                                <>
                                  <XCircle className='h-4 w-4 mr-2' />
                                  Reject
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className='max-w-md' aria-describedby='rejection-dialog-description'>
          <DialogHeader>
            <DialogTitle>
              {currentTransaction?.verification_status === 'approved' ? 'Reset Payment Status' : 'Reject Payment'}
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
                  : 'Reason for Rejection *'
                }
              </Label>
              <Textarea
                id='rejection-reason'
                placeholder={
                  currentTransaction?.verification_status === 'approved'
                    ? 'Please provide a reason for resetting this payment status...'
                    : 'Please provide a reason for rejecting this payment...'
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
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
              disabled={!rejectionReason.trim() || rejectingId === currentTransaction?.id}
            >
              {currentTransaction?.verification_status === 'approved' ? 'Reset to Pending' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableCell>
  );
};
