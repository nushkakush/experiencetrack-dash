import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';
import { CohortStudent } from '@/types/cohort';
import { normalizePaymentTargeting, validatePaymentTargeting } from '../utils/paymentUtils';

interface CreateTransactionResult {
  success: boolean;
  error?: string;
  paymentId?: string;
}

interface TransactionRecordData {
  payment_id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  status: string;
  notes: string;
  created_by?: string;
  verification_status: string;
  receipt_url: string;
  proof_of_payment_url: string;
  transaction_screenshot_url: string;
  bank_name: string;
  bank_branch: string;
  utr_number: string;
  payer_upi_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  payment_date: string;
  transfer_date: string;
  installment_id: string | null;
  semester_number: number | null;
  recorded_by_user_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
}

export class PaymentTransactionService {
  /**
   * Create a payment transaction record
   */
  static async createPaymentTransaction(
    paymentData: PaymentSubmissionData,
    studentPaymentId: string,
    receiptUrls: {
      receiptUrl: string;
      proofOfPaymentUrl: string;
      transactionScreenshotUrl: string;
    },
    studentData?: CohortStudent
  ): Promise<CreateTransactionResult> {
    try {
      console.log('🔍 [DEBUG] Creating transaction record with FULL payment data:', paymentData);

      // Normalize and validate installment targeting
      const { normalizedInstallmentId, normalizedSemesterNumber } =
        normalizePaymentTargeting(paymentData.installmentId, paymentData.semesterNumber);

      console.log('🔍 [DEBUG] Normalized targeting:', {
        normalizedInstallmentId,
        normalizedSemesterNumber,
        originalInstallmentId: paymentData.installmentId,
      });

      // Validate targeting
      const validation = validatePaymentTargeting(
        normalizedInstallmentId,
        normalizedSemesterNumber
      );

      if (!validation.isValid) {
        Logger.getInstance().error('Missing installment/semester targeting on payment', {
          paymentData,
          normalizedInstallmentId,
          normalizedSemesterNumber,
        });
        return { success: false, error: validation.error };
      }

      // Determine if this is an admin-recorded payment
      const isAdminRecorded = paymentData.isAdminRecorded === true;
      const recordedByUserId = paymentData.recordedByUserId;

      const transactionRecord: TransactionRecordData = {
        payment_id: studentPaymentId, // Use the UUID from student_payments
        transaction_type: 'payment',
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber || '',
        status: isAdminRecorded ? 'success' : 'pending', // Admin payments are immediately successful
        notes: paymentData.notes || '',
        created_by: paymentData.studentUserId || studentData?.user_id,
        verification_status: isAdminRecorded ? 'approved' : 'verification_pending', // Admin payments skip verification
        receipt_url: receiptUrls.receiptUrl,
        proof_of_payment_url: receiptUrls.proofOfPaymentUrl,
        transaction_screenshot_url: receiptUrls.transactionScreenshotUrl,
        bank_name: paymentData.bankName || '',
        bank_branch: paymentData.bankBranch || '',
        utr_number: paymentData.referenceNumber || '',
        payer_upi_id: paymentData.upiId || '',
        razorpay_payment_id: paymentData.razorpayPaymentId || '',
        razorpay_order_id: paymentData.razorpayOrderId || '',
        payment_date:
          paymentData.paymentDate ||
          paymentData.transferDate ||
          new Date().toISOString().split('T')[0],
        transfer_date:
          paymentData.transferDate || new Date().toISOString().split('T')[0],
        // Add installment identification fields (normalized)
        installment_id: normalizedInstallmentId,
        semester_number: normalizedSemesterNumber,
        // Add admin tracking fields
        recorded_by_user_id: recordedByUserId || null,
        verified_by: isAdminRecorded ? recordedByUserId : null, // Auto-verify admin payments
        verified_at: isAdminRecorded ? new Date().toISOString() : null, // Auto-verify admin payments
      };

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert([transactionRecord])
        .select()
        .single();

      if (error) {
        Logger.getInstance().error('Failed to create payment transaction record', {
          error,
          paymentData,
        });
        return {
          success: false,
          error: `Failed to create payment transaction record: ${error.message}`,
        };
      }

      Logger.getInstance().info('Payment transaction created successfully', {
        paymentId: data.id,
        amount: paymentData.amount,
        isAdminRecorded,
        recordedByUserId,
      });

      return {
        success: true,
        paymentId: data.id,
      };
    } catch (error) {
      Logger.getInstance().error('Error creating payment transaction', {
        error,
        paymentData,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction',
      };
    }
  }
}
