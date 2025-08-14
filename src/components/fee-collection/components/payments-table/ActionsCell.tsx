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
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { toast } from 'sonner';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';

interface ActionsCellProps {
  student: StudentPaymentSummary;
  onStudentSelect: (student: StudentPaymentSummary) => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  student,
  onStudentSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [transactions, setTransactions] = React.useState<
    PaymentTransactionRow[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

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
    decision: 'approved' | 'rejected'
  ) => {
    try {
      setVerifyingId(transactionId);
      const adminId = 'admin'; // TODO: wire to current admin user id
      const res = await paymentTransactionService.verifyPayment(
        transactionId,
        adminId,
        decision
      );
      if (res.success) {
        toast.success(
          decision === 'approved' ? 'Payment approved' : 'Payment rejected'
        );
        await fetchTransactions();
      } else {
        toast.error('Verification failed');
      }
    } catch (e) {
      toast.error('Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <TableCell>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='sm'
          onClick={async e => {
            e.stopPropagation();
            await fetchTransactions();
            setOpen(true);
          }}
          title='View & Verify'
        >
          <Eye className='h-4 w-4' />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Payment Transactions</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {loading ? (
              <div className='text-sm text-muted-foreground'>Loading...</div>
            ) : transactions.length === 0 ? (
              <div className='text-sm text-muted-foreground'>
                No transactions found
              </div>
            ) : (
              <div className='space-y-3'>
                {transactions.map(t => (
                  <div key={t.id} className='rounded-md border p-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Badge variant='secondary'>{t.payment_method}</Badge>
                        <Badge variant='outline'>
                          ₹{Number(t.amount).toLocaleString('en-IN')}
                        </Badge>
                        <span className='text-xs text-muted-foreground flex items-center gap-1'>
                          <Clock className='h-3 w-3' />{' '}
                          {new Date(t.created_at).toLocaleString()}
                        </span>
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
                        >
                          {t.verification_status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                    <Separator className='my-2' />
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      {t.reference_number && (
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4' /> Ref:{' '}
                          {t.reference_number}
                        </div>
                      )}
                      {t.bank_name && (
                        <div>
                          Bank: {t.bank_name}{' '}
                          {t.bank_branch ? `(${t.bank_branch})` : ''}
                        </div>
                      )}
                      {t.payer_upi_id && <div>UPI: {t.payer_upi_id}</div>}
                      {t.payment_date && (
                        <div>Payment Date: {t.payment_date}</div>
                      )}
                    </div>
                    {t.receipt_url && (
                      <div className='text-xs text-muted-foreground mt-2'>
                        Receipt:{' '}
                        <a
                          className='underline'
                          href={t.receipt_url}
                          target='_blank'
                          rel='noreferrer'
                        >
                          view
                        </a>
                      </div>
                    )}
                    {t.proof_of_payment_url && (
                      <div className='text-xs text-muted-foreground'>
                        Proof:{' '}
                        <a
                          className='underline'
                          href={t.proof_of_payment_url}
                          target='_blank'
                          rel='noreferrer'
                        >
                          view
                        </a>
                      </div>
                    )}

                    <div className='flex items-center gap-2 mt-3'>
                      <Button
                        size='sm'
                        variant='default'
                        disabled={verifyingId === t.id}
                        onClick={() => handleVerify(t.id, 'approved')}
                      >
                        <CheckCircle2 className='h-4 w-4 mr-1' /> Approve
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        disabled={verifyingId === t.id}
                        onClick={() => handleVerify(t.id, 'rejected')}
                      >
                        <XCircle className='h-4 w-4 mr-1' /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='secondary' onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableCell>
  );
};
