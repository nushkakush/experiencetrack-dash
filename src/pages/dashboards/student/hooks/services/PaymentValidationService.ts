import { toast } from 'sonner';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class PaymentValidationService {
  /**
   * Validate payment submission data
   */
  static validatePaymentSubmission(paymentData: PaymentSubmissionData): ValidationResult {
    const { paymentMethod, amount } = paymentData;

    console.log('🔍 [DEBUG] PaymentValidationService - validating payment:', {
      paymentMethod,
      paymentMethodType: typeof paymentMethod,
      paymentMethodTruthy: !!paymentMethod,
      amount,
    });

    if (!paymentMethod) {
      console.log('❌ [DEBUG] Payment method validation failed');
      toast.error('Please select a payment method');
      return {
        isValid: false,
        error: 'Please select a payment method',
      };
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return {
        isValid: false,
        error: 'Please enter a valid amount',
      };
    }

    // Only require file uploads for non-online payment methods
    // Skip file requirement for admin-recorded online payments (when Payment ID is provided)
    if (paymentMethod !== 'razorpay' && !paymentData.isAdminRecorded) {
      if (
        !paymentData.receiptFile &&
        !paymentData.proofOfPaymentFile &&
        !paymentData.transactionScreenshotFile
      ) {
        toast.error('Please upload a receipt or payment proof');
        return {
          isValid: false,
          error: 'Please upload a receipt or payment proof',
        };
      }
    }

    return {
      isValid: true,
    };
  }
}
