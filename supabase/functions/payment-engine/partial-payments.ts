import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { roundToRupee } from './calculations.ts';

// Email notification function
async function sendEmailNotification(emailData: {
  type: string;
  recipient: { email: string; name: string };
  subject: string;
  content: string;
  context: any;
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Log the email to email_logs table
    const { error: logError } = await supabase.from('email_logs').insert({
      type: emailData.type,
      subject: emailData.subject,
      content: emailData.content,
      recipient_email: emailData.recipient.email,
      recipient_name: emailData.recipient.name,
      context: emailData.context,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('Failed to log email:', logError);
    }

    // Call the send-email edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(
        `Email service responded with status: ${response.status}`
      );
    }

    console.log(
      `Email notification sent successfully for type: ${emailData.type}`
    );
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

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
    // Get transaction details for communication
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select(
        `
        *,
        student_payments!inner (
          id,
          student_id,
          cohort_students (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `
      )
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;
    if (!transaction) throw new Error('Transaction not found');

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

    // 🚀 TRIGGER 3: Payment Rejected Notification
    if (transaction.student_payments?.cohort_students) {
      const student = transaction.student_payments.cohort_students;
      try {
        await sendEmailNotification({
          type: 'payment_rejected',
          recipient: {
            email: student.email,
            name: `${student.first_name} ${student.last_name}`,
          },
          subject: 'Payment Rejected - Action Required',
          content: `Dear ${student.first_name} ${student.last_name},

Your payment of ₹${transaction.amount} has been rejected.

Rejection Details:
- Submitted Amount: ₹${transaction.amount}
- Reference: ${transaction.reference_number || 'N/A'}
- Rejection Date: ${new Date().toISOString()}
- Reason: ${rejectionReason || 'Payment verification failed'}

Please review the rejection reason and submit a new payment with the correct details.

If you have any questions, please contact our support team.

Payments Team,
LIT School`,
          context: {
            amount: transaction.amount,
            referenceNumber: transaction.reference_number || '',
            rejectionDate: new Date().toISOString(),
            rejectionReason: rejectionReason || 'Payment verification failed',
          },
        });
      } catch (communicationError) {
        console.error(
          'Failed to send payment rejection notification:',
          communicationError
        );
        // Don't fail the rejection if communication fails
      }
    }

    return { success: true, message: 'Transaction rejected successfully' };
  }

  if (approvalType === 'full') {
    // Get transaction details for communication
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select(
        `
        *,
        student_payments!inner (
          id,
          student_id,
          cohort_students (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `
      )
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;
    if (!transaction) throw new Error('Transaction not found');

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

    // 🚀 TRIGGER 2: Payment Approved Notification
    if (transaction.student_payments?.cohort_students) {
      const student = transaction.student_payments.cohort_students;
      try {
        // Send payment approved notification
        await sendEmailNotification({
          type: 'payment_approved',
          recipient: {
            email: student.email,
            name: `${student.first_name} ${student.last_name}`,
          },
          subject: 'Payment Approved - Receipt Generated',
          content: `Dear ${student.first_name} ${student.last_name},

Great news! Your payment of ₹${transaction.amount} has been approved.

Payment Details:
- Amount: ₹${transaction.amount}
- Method: ${transaction.payment_method}
- Reference: ${transaction.reference_number || 'N/A'}
- Approval Date: ${new Date().toISOString()}
- Installment: Payment

Your receipt has been generated and is available in your student portal.

Thank you for your payment!

Payments Team,
LIT School`,
          context: {
            amount: transaction.amount,
            paymentMethod: transaction.payment_method,
            referenceNumber: transaction.reference_number || '',
            approvalDate: new Date().toISOString(),
            installmentDescription: 'Payment',
          },
        });

        // 🚀 TRIGGER 6: All Payments Completed Notification (for direct full payments)
        try {
          // Check if this payment completes the installment
          const { data: studentPayment } = await supabase
            .from('student_payments')
            .select('total_amount_payable, total_amount_paid')
            .eq('id', transaction.student_payments.id)
            .single();

          if (studentPayment) {
            const totalPaidAfterThisPayment =
              (studentPayment.total_amount_paid || 0) + transaction.amount;
            const isInstallmentComplete =
              totalPaidAfterThisPayment >= studentPayment.total_amount_payable;

            if (isInstallmentComplete) {
              await sendEmailNotification({
                type: 'all_payments_completed',
                recipient: {
                  email: student.email,
                  name: `${student.first_name} ${student.last_name}`,
                },
                subject: 'Installment Completed - All Payments Approved',
                content: `Dear ${student.first_name} ${student.last_name},

Excellent! Your installment is now complete.

Payment Summary:
- Total Installment Amount: ₹${studentPayment.total_amount_payable}
- First Payment: ₹${studentPayment.total_amount_payable - transaction.amount} (approved on ${new Date().toISOString()})
- Second Payment: ₹${transaction.amount} (approved on ${new Date().toISOString()})
- Installment: Payment

Your receipt has been generated and is available in your student portal.

Thank you for completing your payment!

Payments Team,
LIT School`,
                context: {
                  totalAmount: studentPayment.total_amount_payable,
                  firstPaymentAmount:
                    studentPayment.total_amount_payable - transaction.amount,
                  firstApprovalDate: new Date().toISOString(),
                  secondPaymentAmount: transaction.amount,
                  secondApprovalDate: new Date().toISOString(),
                  installmentDescription: 'Payment',
                },
              });
            }
          }
        } catch (completionError) {
          console.error(
            'Failed to send all payments completed notification:',
            completionError
          );
          // Don't fail the approval if communication fails
        }
      } catch (communicationError) {
        console.error(
          'Failed to send payment approval notifications:',
          communicationError
        );
        // Don't fail the approval if communication fails
      }
    }

    return { success: true, message: 'Transaction approved successfully' };
  }

  if (approvalType === 'partial' && approvedAmount) {
    // Get the original transaction with student details
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select(
        `
        *,
        student_payments!inner (
          id,
          student_id,
          cohort_students (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        )
      `
      )
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

    // 🚀 TRIGGER 5: Payment Partially Approved Notification
    if (originalTransaction.student_payments?.cohort_students) {
      const student = originalTransaction.student_payments.cohort_students;
      try {
        await sendEmailNotification({
          type: 'payment_partially_approved',
          recipient: {
            email: student.email,
            name: `${student.first_name} ${student.last_name}`,
          },
          subject: 'Payment Partially Approved - Balance Due',
          content: `Dear ${student.first_name} ${student.last_name},

Your payment has been partially approved.

Payment Details:
- Submitted Amount: ₹${originalAmount}
- Approved Amount: ₹${approvedAmount}
- Remaining Balance: ₹${remainingAmount}
- Reference: ${originalTransaction.reference_number || 'N/A'}
- Approval Date: ${new Date().toISOString()}

Please submit the remaining amount of ₹${remainingAmount} to complete your payment.

You can make the remaining payment through your student portal.

Thank you!

Payments Team,
LIT School`,
          context: {
            submittedAmount: originalAmount,
            approvedAmount: approvedAmount,
            remainingAmount: remainingAmount,
            referenceNumber: originalTransaction.reference_number || '',
            approvalDate: new Date().toISOString(),
          },
        });
      } catch (communicationError) {
        console.error(
          'Failed to send partial approval notification:',
          communicationError
        );
        // Don't fail the partial approval if communication fails
      }
    }

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
