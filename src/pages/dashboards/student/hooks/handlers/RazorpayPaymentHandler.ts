import { Logger } from '@/lib/logging/Logger';
import { razorpayService } from '@/services/razorpay.service';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';
import { CohortStudent } from '@/types/cohort';
import { StudentPaymentService } from '../services/StudentPaymentService';

interface PaymentResult {
  success: boolean;
  error?: string;
}

export class RazorpayPaymentHandler {
  /**
   * Handle Razorpay payment processing
   */
  static async handleRazorpayPayment(
    paymentData: PaymentSubmissionData,
    studentData?: CohortStudent,
    onPaymentSuccess?: () => Promise<void>
  ): Promise<PaymentResult> {
    try {
      // Use student data from paymentData if available (admin context), otherwise use studentData (student context)
      const effectiveStudentId = paymentData.studentId || studentData?.id;
      const effectiveCohortId = paymentData.cohortId || studentData?.cohort_id;

      console.log('🔍 [DEBUG] RazorpayPaymentHandler - effective IDs:', {
        effectiveStudentId,
        effectiveCohortId,
        paymentDataStudentId: paymentData.studentId,
        paymentDataCohortId: paymentData.cohortId,
        studentDataId: studentData?.id,
        studentDataCohortId: studentData?.cohort_id,
      });

      // Validate effective student data
      if (!effectiveStudentId || !effectiveCohortId) {
        console.error('❌ [DEBUG] Missing effective student data:', {
          effectiveStudentId,
          effectiveCohortId,
          paymentData,
          studentData,
        });
        throw new Error(
          'Student data is missing. Please refresh the page and try again.'
        );
      }

      // Get the payment plan from student data
      const paymentPlan = await StudentPaymentService.getStudentPaymentPlan(
        effectiveStudentId,
        effectiveCohortId
      );

      const razorpayData = {
        amount: paymentData.amount,
        studentId: effectiveStudentId || '',
        cohortId: effectiveCohortId || '',
        paymentPlan: paymentPlan,
        installmentId: paymentData.installmentId,
        semesterNumber: paymentData.semesterNumber,
        onSuccess: async () => {
          // Payment was successful, refresh data
          if (onPaymentSuccess) {
            await onPaymentSuccess();
          }
        },
        onError: (error: any) => {
          Logger.getInstance().error('Razorpay payment error', {
            error,
            paymentData,
          });
        },
      };

      console.log(
        '🔍 [DEBUG] RazorpayPaymentHandler - calling razorpayService.initiatePayment with:',
        razorpayData
      );

      await razorpayService.initiatePayment(razorpayData);

      return { success: true };
    } catch (error) {
      Logger.getInstance().error('Razorpay payment error', {
        error,
        paymentData,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }
}
