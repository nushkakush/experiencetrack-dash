import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PartialPaymentToggle } from '@/components/common/payments/PartialPaymentToggle';
import { PartialPaymentHistory } from '@/components/common/payments/PartialPaymentHistory';
import { formatCurrency, formatDate, getStatusBadge } from './utils/paymentScheduleUtils';

interface PaymentScheduleItemProps {
  item: {
    id: string;
    type: string;
    amount: number;
    dueDate: string;
    status: string;
    paymentDate?: string;
    verificationStatus?: string;
    semesterNumber?: number;
    installmentNumber?: number;
  };
  student: {
    student_id: string;
  };
  recordingPayment: string | null;
  canRecordPayment: (status: string, verificationStatus?: string) => boolean;
  onRecordPayment: (item: any) => void;
  getRelevantTransactions: (item: any) => any[];
}

export const PaymentScheduleItem: React.FC<PaymentScheduleItemProps> = ({
  item,
  student,
  recordingPayment,
  canRecordPayment,
  onRecordPayment,
  getRelevantTransactions,
}) => {
  return (
    <div className='border border-border rounded-lg p-4 bg-card'>
      <div className='flex items-center justify-between mb-3'>
        <span className='font-medium text-sm text-foreground'>
          {item.type}
        </span>
        <div className='flex items-center gap-2'>
          {getStatusBadge(item.status, item.verificationStatus)}
          {canRecordPayment(item.status, item.verificationStatus) && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => onRecordPayment(item)}
              disabled={recordingPayment === item.id}
              className='h-6 px-2 text-xs'
            >
              <Plus className='h-3 w-3 mr-1' />
              {recordingPayment === item.id
                ? 'Recording...'
                : 'Record Payment'}
            </Button>
          )}
        </div>
      </div>

      {/* Partial Payment Toggle - Only show for program fee installments, not admission fee or waived payments */}
      {item.type !== 'Admission Fee' && item.status !== 'waived' && item.status !== 'partially_waived' && (
        <div className='mb-2 flex items-center justify-end'>
          <PartialPaymentToggle
            studentId={student.student_id}
            installmentKey={`${item.semesterNumber || 1}-${item.installmentNumber || 0}`}
            onToggle={(enabled) => {
              // No need to refresh payment schedule - partial payment toggle doesn't affect payment amounts or dates
              console.log('🔧 [PaymentSchedule] Partial payment toggle changed:', { 
                installmentKey: `${item.semesterNumber || 1}-${item.installmentNumber || 0}`, 
                enabled 
              });
            }}
          />
        </div>
      )}

      <div className='space-y-2 text-xs text-muted-foreground'>
        <div className='flex justify-between'>
          <span>Amount Payable:</span>
          <span className='text-foreground'>
            {formatCurrency(item.amount)}
          </span>
        </div>
        <div className='flex justify-between'>
          <span>Due:</span>
          <span className='text-foreground'>
            {formatDate(item.dueDate)}
          </span>
        </div>
        {item.paymentDate && (
          <div className='flex justify-between'>
            <span>Paid:</span>
            <span className='text-foreground'>
              {formatDate(item.paymentDate)}
            </span>
          </div>
        )}
        {item.verificationStatus === 'verification_pending' && (
          <div className='text-yellow-600 text-xs mt-2'>
            Payment proof submitted, awaiting verification
          </div>
        )}
      </div>

      {/* Payment Transaction History - Only show if there are partial payments or multiple transactions */}
      {(() => {
        const transactions = getRelevantTransactions(item);
        const totalPaid = transactions
          .filter(t => t.verification_status === 'approved' || t.verification_status === 'partially_approved')
          .reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0);
        
        // Only show payment history if:
        // 1. There are multiple transactions, OR
        // 2. There's a partial payment (amount paid < expected amount)
        // NOTE: We do NOT show for single complete payments, even if pending verification
        const hasMultipleTransactions = transactions.length > 1;
        const hasPartialPayment = totalPaid > 0 && totalPaid < item.amount;
        
        // For single transactions, check if it's a complete payment (regardless of status)
        const isSingleCompletePayment = transactions.length === 1 && 
          transactions[0].amount >= item.amount;
        
        const shouldShowHistory = hasMultipleTransactions || hasPartialPayment;
        
        // DEBUG LOGGING
        console.log('🔍 [PaymentSchedule] Payment History Visibility Check:', {
          installmentKey: `${item.semesterNumber || 1}-${item.installmentNumber || 0}`,
          transactionsCount: transactions.length,
          totalPaid,
          expectedAmount: item.amount,
          hasMultipleTransactions,
          hasPartialPayment,
          isSingleCompletePayment,
          shouldShowHistory,
          transactions: transactions.map(t => ({
            id: t.id,
            amount: t.amount,
            status: t.verification_status,
            partial_sequence: t.partial_payment_sequence
          }))
        });
        
        if (!shouldShowHistory) {
          console.log('✅ [PaymentSchedule] HIDING Payment History - Single complete payment');
          return null;
        }
        
        console.log('📋 [PaymentSchedule] SHOWING Payment History - Complex payment scenario');
        return (
          <div className='mt-3 pt-3 border-t'>
            <PartialPaymentHistory
              transactions={transactions}
              totalExpectedAmount={item.amount}
              totalPaid={totalPaid}
              remainingAmount={item.amount - totalPaid}
              totalPending={transactions
                .filter(t => t.verification_status === 'verification_pending' || t.verification_status === 'pending')
                .reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0)}
            />
          </div>
        );
      })()}
    </div>
  );
};
