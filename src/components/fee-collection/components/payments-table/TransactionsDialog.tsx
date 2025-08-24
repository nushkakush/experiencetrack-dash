import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';
import { TransactionCard } from './TransactionCard';

interface TransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  transactions: PaymentTransactionRow[];
  studentName: string;
  studentData?: {
    avatar_url?: string | null;
    user_id?: string | null;
  };
  expectedAmount: number;
  verifyingId: string | null;
  rejectingId: string | null;
  onVerify: (transactionId: string, decision: 'approved' | 'rejected') => void;
  onRejectClick: (transaction: PaymentTransactionRow) => void;
  onResetClick: (transaction: PaymentTransactionRow) => void;
  onPartialApprovalClick: (transaction: PaymentTransactionRow) => void;
}

export const TransactionsDialog: React.FC<TransactionsDialogProps> = ({
  open,
  onOpenChange,
  loading,
  transactions,
  studentName,
  studentData,
  expectedAmount,
  verifyingId,
  rejectingId,
  onVerify,
  onRejectClick,
  onResetClick,
  onPartialApprovalClick,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-6xl max-h-[85vh] overflow-y-auto'
        aria-describedby='transactions-description'
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={null}
              name={studentName}
              size="md"
              userId={studentData?.user_id}
            />
            <div>
              <DialogTitle className='text-xl font-semibold'>
                Payment Transactions
              </DialogTitle>
              <p className='text-sm text-muted-foreground'>
                Review and verify payment submissions for {studentName}
              </p>
            </div>
          </div>
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
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  transactions={transactions}
                  expectedAmount={expectedAmount}
                  verifyingId={verifyingId}
                  rejectingId={rejectingId}
                  onVerify={onVerify}
                  onRejectClick={onRejectClick}
                  onResetClick={onResetClick}
                  onPartialApprovalClick={onPartialApprovalClick}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
