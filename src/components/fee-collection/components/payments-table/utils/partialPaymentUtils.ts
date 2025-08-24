import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';

export interface PartialPaymentContext {
  hasPartialSequence: boolean;
  partialSequence: number;
  relatedTransactionCount: number;
  approvedPartialsCount: number;
  totalApprovedAmount: number;
  totalAmount: number;
  isPartialPayment: boolean;
}

export const getPartialPaymentContext = (
  transaction: PaymentTransactionRow,
  transactions: PaymentTransactionRow[],
  expectedAmount: number
): PartialPaymentContext => {
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
