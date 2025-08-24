import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';
import { CohortStudent } from '@/types/cohort';
import { uploadMultipleReceipts } from '../utils/receiptUploadService';
import { StudentPaymentService } from '../services/StudentPaymentService';
import { PaymentTransactionService } from '../services/PaymentTransactionService';

interface PaymentResult {
  success: boolean;
  error?: string;
  paymentId?: string;
}

export class RegularPaymentHandler {
  /**
   * Handle regular (non-Razorpay) payment processing
   */
  static async handleRegularPayment(
    paymentData: PaymentSubmissionData,
    studentData?: CohortStudent
  ): Promise<PaymentResult> {
    try {
      Logger.getInstance().info('Starting regular payment submission', {
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
      });

      // 1. Upload receipt files to Supabase Storage if provided
      const receiptUrls = await uploadMultipleReceipts(
        {
          receiptFile: paymentData.receiptFile,
          proofOfPaymentFile: paymentData.proofOfPaymentFile,
          transactionScreenshotFile: paymentData.transactionScreenshotFile,
        },
        paymentData.paymentId
      );

      // 2. Get or create a student_payments record
      const studentPaymentResult = await StudentPaymentService.getOrCreateStudentPayment(
        paymentData,
        studentData
      );

      if (!studentPaymentResult.success || !studentPaymentResult.studentPaymentId) {
        return {
          success: false,
          error: studentPaymentResult.error || 'Failed to create student payment record',
        };
      }

      // 3. Create a payment transaction record
      const transactionResult = await PaymentTransactionService.createPaymentTransaction(
        paymentData,
        studentPaymentResult.studentPaymentId,
        receiptUrls,
        studentData
      );

      if (!transactionResult.success) {
        return {
          success: false,
          error: transactionResult.error || 'Failed to create payment transaction',
        };
      }

      // 4. Update the student_payments record timestamp
      await StudentPaymentService.updateStudentPaymentTimestamp(
        studentPaymentResult.studentPaymentId
      );

      Logger.getInstance().info('Payment submission completed successfully', {
        paymentId: transactionResult.paymentId,
        amount: paymentData.amount,
        isAdminRecorded: paymentData.isAdminRecorded,
        recordedByUserId: paymentData.recordedByUserId,
      });

      // Show appropriate success message
      const isAdminRecorded = paymentData.isAdminRecorded === true;
      if (isAdminRecorded) {
        toast.success(
          'Payment recorded successfully! The installment has been marked as paid.'
        );
      } else {
        toast.success(
          'Payment submitted for verification! You will be notified once verified.'
        );
      }

      return {
        success: true,
        paymentId: transactionResult.paymentId,
      };
    } catch (error) {
      Logger.getInstance().error('Payment submission failed', {
        error,
        paymentData,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment submission failed',
      };
    }
  }
}
