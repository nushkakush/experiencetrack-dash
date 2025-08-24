import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';
import { CohortStudent } from '@/types/cohort';
import { PaymentValidationService } from './services/PaymentValidationService';
import { RazorpayPaymentHandler } from './handlers/RazorpayPaymentHandler';
import { RegularPaymentHandler } from './handlers/RegularPaymentHandler';

interface PaymentSubmission {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  receiptFile?: File;
  receiptUrl?: string;
  notes?: string;
  submittedAt: Date;
}

export const usePaymentSubmissions = (
  studentData?: CohortStudent,
  onPaymentSuccess?: () => Promise<void>
) => {
  const [paymentSubmissions, setPaymentSubmissions] = useState<
    Map<string, PaymentSubmission>
  >(new Map());
  const [submittingPayments, setSubmittingPayments] = useState<Set<string>>(
    new Set()
  );

  const handlePaymentSubmission = useCallback(
    async (paymentData: PaymentSubmissionData) => {
      console.log('🔍 [DEBUG] usePaymentSubmissions - handlePaymentSubmission called');
      console.log('🔍 [DEBUG] usePaymentSubmissions - paymentData:', paymentData);

      const { paymentId, paymentMethod } = paymentData;

      // Validate payment data
      const validation = PaymentValidationService.validatePaymentSubmission(paymentData);
      if (!validation.isValid) {
        return;
      }

      try {
        setSubmittingPayments(new Set([...submittingPayments, paymentId]));

        let result;

        // Admin-recorded payments (including Razorpay) go straight to "Paid" status
        // Only student-initiated Razorpay payments use the online gateway
        if (paymentMethod === 'razorpay' && !paymentData.isAdminRecorded) {
          console.log('🔍 [DEBUG] Student Razorpay payment - using online gateway');
          result = await RazorpayPaymentHandler.handleRazorpayPayment(
            paymentData,
            studentData,
            onPaymentSuccess
          );
        } else {
          console.log('🔍 [DEBUG] Regular payment flow - direct to paid status', {
            paymentMethod,
            isAdminRecorded: paymentData.isAdminRecorded,
          });
          result = await RegularPaymentHandler.handleRegularPayment(paymentData, studentData);
        }

        if (result.success) {
          toast.success('Payment submitted successfully!');

          // Remove from submissions after successful submission
          const newSubmissions = new Map(paymentSubmissions);
          newSubmissions.delete(paymentId);
          setPaymentSubmissions(newSubmissions);

          // Call the success callback to refresh data
          if (onPaymentSuccess) {
            console.log('🔄 [DEBUG] Calling onPaymentSuccess callback to refresh UI data');
            await onPaymentSuccess();
          } else {
            console.log('⚠️ [DEBUG] No onPaymentSuccess callback provided - UI may not refresh');
          }
        } else {
          toast.error(result.error || 'Failed to submit payment');
        }
      } catch (error) {
        Logger.getInstance().error('Error submitting payment', {
          error,
          paymentData,
        });
        toast.error('Failed to submit payment. Please try again.');
      } finally {
        setSubmittingPayments(
          new Set([...submittingPayments].filter(id => id !== paymentId))
        );
      }
    },
    [paymentSubmissions, submittingPayments, onPaymentSuccess, studentData]
  );



  return {
    paymentSubmissions,
    submittingPayments,
    handlePaymentSubmission,
  };
};
