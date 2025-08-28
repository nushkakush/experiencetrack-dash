import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { roundToRupee } from './calculations.ts';

// Partial payment calculation helpers
export const calculatePartialPaymentSummary = async (
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  installmentId: string
): Promise<{
  installmentId: string;
  originalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  nextPaymentAmount: number;
  canMakeAnotherPayment: boolean;
  partialPaymentHistory: Array<{
    id: string;
    sequenceNumber: number;
    amount: number;
    status: string;
    paymentDate?: string;
    verifiedAt?: string;
    notes?: string;
    rejectionReason?: string;
  }>;
  restrictions: {
    maxPartialPayments: number;
    currentCount: number;
    remainingPayments: number;
  };
}> => {
  // Get the payment record
  const { data: paymentRecord } = await supabase
    .from('student_payments')
    .select('id')
    .eq('student_id', studentId)
    .single();

  if (!paymentRecord) {
    throw new Error('Payment record not found');
  }

  // Get all transactions for this installment
  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select(
      'id, amount, verification_status, partial_payment_sequence, created_at, verified_at, notes, rejection_reason'
    )
    .eq('payment_id', paymentRecord.id)
    .eq('installment_id', installmentId)
    .order('partial_payment_sequence', { ascending: true });

  const partialPayments = transactions || [];

  // Calculate totals
  const totalPaid = partialPayments
    .filter(
      t =>
        t.verification_status === 'approved' ||
        t.verification_status === 'partially_approved'
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Get original installment amount (this would need to be calculated from fee structure)
  // For now, using a placeholder - in real implementation, this would call the breakdown calculation
  const originalAmount = 10000; // TODO: Calculate from fee structure

  const pendingAmount = roundToRupee(originalAmount - totalPaid);
  const currentCount = partialPayments.length;
  const maxPartialPayments = 2; // As per requirements
  const canMakeAnotherPayment =
    currentCount < maxPartialPayments && pendingAmount > 0;

  return {
    installmentId,
    originalAmount,
    totalPaid,
    pendingAmount,
    nextPaymentAmount: canMakeAnotherPayment ? 0 : pendingAmount, // 0 means student can choose amount
    canMakeAnotherPayment,
    partialPaymentHistory: partialPayments.map(t => ({
      id: t.id,
      sequenceNumber: t.partial_payment_sequence || 1,
      amount: t.amount || 0,
      status: t.verification_status || 'pending',
      paymentDate: t.created_at,
      verifiedAt: t.verified_at,
      notes: t.notes,
      rejectionReason: t.rejection_reason,
    })),
    restrictions: {
      maxPartialPayments,
      currentCount,
      remainingPayments: Math.max(0, maxPartialPayments - currentCount),
    },
  };
};

export const processAdminPartialApproval = async (
  supabase: ReturnType<typeof createClient>,
  transactionId: string,
  approvalType: 'full' | 'partial' | 'reject',
  approvedAmount?: number,
  adminNotes?: string,
  rejectionReason?: string
): Promise<{
  success: boolean;
  newTransactionId?: string;
  message?: string;
}> => {
  if (approvalType === 'reject') {
    // Reject the transaction
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        verification_status: 'rejected',
        rejection_reason: rejectionReason,
        verified_at: new Date().toISOString(),
        verification_notes: adminNotes,
      })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true, message: 'Transaction rejected successfully' };
  }

  if (approvalType === 'full') {
    // Approve the full transaction
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verification_notes: adminNotes,
      })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true, message: 'Transaction approved successfully' };
  }

  if (approvalType === 'partial' && approvedAmount) {
    // Get the original transaction
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !originalTransaction) {
      throw new Error('Original transaction not found');
    }

    const originalAmount = originalTransaction.amount;
    const remainingAmount = roundToRupee(originalAmount - approvedAmount);

    if (approvedAmount <= 0 || approvedAmount >= originalAmount) {
      throw new Error('Invalid approved amount for partial approval');
    }

    // Update original transaction to partially approved with approved amount
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        amount: approvedAmount,
        verification_status: 'partially_approved',
        verified_at: new Date().toISOString(),
        verification_notes: adminNotes,
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

    // Create new pending transaction for remaining amount
    const { data: newTransaction, error: createError } = await supabase
      .from('payment_transactions')
      .insert({
        payment_id: originalTransaction.payment_id,
        transaction_type: originalTransaction.transaction_type,
        amount: remainingAmount,
        payment_method: originalTransaction.payment_method,
        status: 'pending',
        verification_status: 'pending',
        installment_id: originalTransaction.installment_id,
        semester_number: originalTransaction.semester_number,
        partial_payment_sequence:
          (originalTransaction.partial_payment_sequence || 1) + 1,
        notes: `Remaining amount from partial approval of transaction ${transactionId}`,
        created_by: originalTransaction.created_by,
        recorded_by_user_id: originalTransaction.recorded_by_user_id,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    return {
      success: true,
      newTransactionId: newTransaction.id,
      message: `Transaction partially approved. ₹${approvedAmount} approved, ₹${remainingAmount} remains pending.`,
    };
  }

  throw new Error('Invalid approval type or missing required parameters');
};

export const updatePartialPaymentConfig = async (
  supabase: ReturnType<typeof createClient>,
  studentPaymentId: string,
  installmentKey: string,
  allowPartialPayments: boolean
): Promise<{ success: boolean; message?: string }> => {
  // Get current config
  const { data: currentData, error: fetchError } = await supabase
    .from('student_payments')
    .select('allow_partial_payments_json')
    .eq('id', studentPaymentId)
    .single();

  if (fetchError) throw fetchError;

  // Update the specific installment setting
  const currentConfig = currentData?.allow_partial_payments_json || {};
  const updatedConfig = {
    ...currentConfig,
    [installmentKey]: allowPartialPayments,
  };

  const { error } = await supabase
    .from('student_payments')
    .update({ allow_partial_payments_json: updatedConfig })
    .eq('id', studentPaymentId);

  if (error) throw error;

  return {
    success: true,
    message: `Partial payments ${allowPartialPayments ? 'enabled' : 'disabled'} for installment ${installmentKey}`,
  };
};

export const getPartialPaymentConfig = async (
  supabase: ReturnType<typeof createClient>,
  studentPaymentId: string,
  installmentKey: string
): Promise<{ allowPartialPayments: boolean }> => {
  const { data, error } = await supabase
    .from('student_payments')
    .select('allow_partial_payments_json')
    .eq('id', studentPaymentId)
    .single();

  if (error) throw error;

  const config = data?.allow_partial_payments_json || {};
  const result = config[installmentKey] || false;
  console.log('🔍 [getPartialPaymentConfig] Debug:', {
    studentPaymentId,
    installmentKey,
    config,
    result,
    configType: typeof config,
    configKeys: Object.keys(config || {}),
    configValues: Object.values(config || {}),
    directLookup: config?.[installmentKey],
    directLookupType: typeof config?.[installmentKey],
  });
  return { allowPartialPayments: result };
};
