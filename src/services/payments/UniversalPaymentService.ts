import { razorpayService } from '../razorpay.service';
import { Logger } from '@/lib/logging/Logger';
import { toast } from 'sonner';

export interface PaymentRequest {
  amount: number;
  currency?: string;
  description: string;
  metadata: {
    type: 'application_fee' | 'installment' | 'admission_fee' | 'other';
    cohortId?: string;
    studentId?: string;
    profileId?: string;
    applicationId?: string;
    installmentId?: string;
    semesterNumber?: number;
    paymentPlan?: string;
    [key: string]: any;
  };
  onSuccess?: () => Promise<void> | void;
  onError?: (error: string) => void;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  paymentId?: string;
}

export class UniversalPaymentService {
  /**
   * Handle any type of payment using Razorpay
   * This is a unified service that can be used across the application
   */
  static async initiatePayment(
    request: PaymentRequest
  ): Promise<PaymentResult> {
    try {
      console.log(
        '🔍 [DEBUG] UniversalPaymentService - initiating payment:',
        request
      );

      const {
        amount,
        currency = 'INR',
        description,
        metadata,
        onSuccess,
        onError,
      } = request;

      // Validate required fields based on payment type
      if (!this.validatePaymentRequest(request)) {
        return {
          success: false,
          error: 'Invalid payment request: missing required fields',
        };
      }

      // Create Razorpay order
      console.log(
        '🔍 [DEBUG] UniversalPaymentService - creating order with amount:',
        amount
      );
      const orderResponse = await razorpayService.createOrder({
        amount,
        currency,
        receipt: `payment_${metadata.type}_${Date.now()}`,
        notes: {
          paymentType: metadata.type,
          description,
          ...metadata,
        },
        studentId: metadata.studentId || metadata.profileId || '',
        cohortId: metadata.cohortId || '',
        paymentPlan: metadata.paymentPlan || 'one_shot',
        installmentId: metadata.installmentId,
        semesterNumber: metadata.semesterNumber,
      });

      console.log('🔍 [DEBUG] UniversalPaymentService - order response:', {
        orderAmount: orderResponse.order.amount,
        orderCurrency: orderResponse.order.currency,
        orderId: orderResponse.order.id,
      });

      // Initialize Razorpay payment
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'LIT School',
        description: description,
        order_id: orderResponse.order.id,
        handler: async (response: any) => {
          try {
            console.log(
              '🔍 [DEBUG] Payment successful, verifying...',
              response
            );

            // Verify payment
            console.log(
              '🔍 [DEBUG] UniversalPaymentService - verifying payment with amount:',
              amount
            );
            const verificationResult = await razorpayService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId: metadata.studentId || metadata.profileId || '',
              cohortId: metadata.cohortId || '',
              amount: amount, // Use the original amount (in rupees)
              paymentPlan: metadata.paymentPlan || 'one_shot',
              installmentId: metadata.installmentId,
              semesterNumber: metadata.semesterNumber,
              paymentType: metadata.type,
            });

            if (verificationResult.success) {
              console.log('🔍 [DEBUG] Payment verified successfully');
              toast.success('Payment completed successfully!');

              // Call success callback
              if (onSuccess) {
                await onSuccess();
              }
            } else {
              console.error(
                '❌ [DEBUG] Payment verification failed:',
                verificationResult.error
              );
              toast.error(
                'Payment verification failed. Please contact support.'
              );

              if (onError) {
                onError(
                  verificationResult.error || 'Payment verification failed'
                );
              }
            }
          } catch (error) {
            console.error('❌ [DEBUG] Error in payment handler:', error);
            Logger.getInstance().error('Payment handler error', {
              error,
              response,
            });
            toast.error('Payment processing failed. Please contact support.');

            if (onError) {
              onError(
                error instanceof Error
                  ? error.message
                  : 'Payment processing failed'
              );
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log('🔍 [DEBUG] Payment modal dismissed');
            toast.info('Payment cancelled');
          },
        },
        theme: {
          color: '#f97316', // Orange theme to match the app
        },
      };

      // Load Razorpay script if not already loaded
      await this.loadRazorpayScript();

      // Create Razorpay instance and open modal
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      return { success: true };
    } catch (error) {
      console.error('❌ [DEBUG] UniversalPaymentService error:', error);
      Logger.getInstance().error('UniversalPaymentService error', {
        error,
        request,
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Payment initiation failed';
      toast.error(errorMessage);

      if (request.onError) {
        request.onError(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate payment request based on type
   */
  private static validatePaymentRequest(request: PaymentRequest): boolean {
    const { amount, metadata } = request;

    // Basic validation
    if (!amount || amount <= 0) {
      console.error('❌ [DEBUG] Invalid amount:', amount);
      return false;
    }

    // Type-specific validation
    switch (metadata.type) {
      case 'application_fee':
        return !!(metadata.cohortId && metadata.profileId);

      case 'installment':
        return !!(
          metadata.studentId &&
          metadata.cohortId &&
          metadata.installmentId
        );

      case 'admission_fee':
        return !!(metadata.studentId && metadata.cohortId);

      default:
        return true; // Allow other types with basic validation
    }
  }

  /**
   * Load Razorpay script dynamically
   */
  private static async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('🔍 [DEBUG] Razorpay script loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ [DEBUG] Failed to load Razorpay script');
        reject(new Error('Failed to load Razorpay script'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Create application fee payment request
   */
  static createApplicationFeePayment(
    amount: number,
    cohortId: string,
    profileId: string,
    onSuccess?: () => Promise<void> | void,
    onError?: (error: string) => void
  ): PaymentRequest {
    return {
      amount,
      currency: 'INR',
      description: 'Application Fee Payment',
      metadata: {
        type: 'application_fee',
        cohortId,
        profileId,
      },
      onSuccess,
      onError,
    };
  }

  /**
   * Create installment payment request
   */
  static createInstallmentPayment(
    amount: number,
    studentId: string,
    cohortId: string,
    installmentId: string,
    paymentPlan: string,
    semesterNumber?: number,
    onSuccess?: () => Promise<void> | void,
    onError?: (error: string) => void
  ): PaymentRequest {
    return {
      amount,
      currency: 'INR',
      description: 'Installment Payment',
      metadata: {
        type: 'installment',
        studentId,
        cohortId,
        installmentId,
        paymentPlan,
        semesterNumber,
      },
      onSuccess,
      onError,
    };
  }
}
