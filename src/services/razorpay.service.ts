import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  studentId: string;
  cohortId: string;
  paymentPlan: string;
  installmentId?: string;
  semesterNumber?: number;
}

export interface RazorpayPaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  studentId: string;
  cohortId: string;
  amount: number;
  paymentPlan: string;
  installmentId?: string;
  semesterNumber?: number;
  paymentType?: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  };
  key_id: string;
  studentPaymentId: string;
}

export interface RazorpayPaymentVerificationResponse {
  success: boolean;
  message: string;
  payment_id: string;
  order_id: string;
  amount: number;
  status: string;
}

class RazorpayService {
  async createOrder(
    data: RazorpayOrderRequest
  ): Promise<RazorpayOrderResponse> {
    try {
      console.log(
        '🔍 [DEBUG] Creating Razorpay order with data:',
        JSON.stringify(data, null, 2)
      );

      // Check if user is authenticated
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      console.log('🔍 [DEBUG] Auth session:', session);
      console.log('🔍 [DEBUG] Auth error:', authError);

      if (!session) {
        throw new Error('User not authenticated. Please log in and try again.');
      }

      const requestBody = {
        action: 'create_order',
        ...data,
      };

      console.log(
        '🔍 [DEBUG] Sending request body:',
        JSON.stringify(requestBody, null, 2)
      );

      // Try direct fetch instead of supabase.functions.invoke
      console.log('🔍 [DEBUG] Using direct fetch to edge function');

      const response = await fetch(
        'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/razorpay-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('🔍 [DEBUG] Fetch response status:', response.status);
      console.log(
        '🔍 [DEBUG] Fetch response headers:',
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 [DEBUG] Fetch error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('🔍 [DEBUG] Fetch response data:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to create order');
      }

      return responseData;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  async verifyPayment(
    data: RazorpayPaymentVerificationRequest
  ): Promise<RazorpayPaymentVerificationResponse> {
    try {
      console.log(
        '🔍 [DEBUG] verifyPayment called with data:',
        JSON.stringify(data, null, 2)
      );

      // Check if user is authenticated
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated. Please log in and try again.');
      }

      console.log('🔍 [DEBUG] Auth session:', {
        hasSession: !!session,
        accessToken: session.access_token ? 'present' : 'missing',
      });

      const { data: response, error } = await supabase.functions.invoke(
        'razorpay-payment',
        {
          body: {
            action: 'verify_payment',
            ...data,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      console.log('🔍 [DEBUG] Edge function response:', { response, error });

      if (error) {
        console.log('🔍 [DEBUG] Edge function error:', error);
        throw new Error(error.message);
      }

      if (!response.success) {
        console.log(
          '🔍 [DEBUG] Edge function returned success: false:',
          response
        );
        throw new Error(response.error || 'Payment verification failed');
      }

      return response;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  }

  async initiatePayment(paymentData: {
    amount: number;
    studentId: string;
    cohortId: string;
    paymentPlan: string;
    installmentId?: string;
    semesterNumber?: number;
    onSuccess?: () => void;
    onError?: (error: string) => void;
  }): Promise<void> {
    try {
      console.log(
        '🔍 [DEBUG] initiatePayment called with:',
        JSON.stringify(paymentData, null, 2)
      );

      const {
        amount,
        studentId,
        cohortId,
        paymentPlan,
        installmentId,
        semesterNumber,
        onSuccess,
        onError,
      } = paymentData;

      // Create Razorpay order
      const orderResponse = await this.createOrder({
        amount,
        currency: 'INR',
        receipt: `payment_${Date.now()}`,
        notes: {
          paymentType: 'fee_payment',
          installmentId: installmentId || '',
          semesterNumber: semesterNumber?.toString() || '',
        },
        studentId,
        cohortId,
        paymentPlan,
        installmentId,
        semesterNumber,
      });

      // Initialize Razorpay payment
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'LIT School',
        description: 'Fee Payment',
        order_id: orderResponse.order.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            console.log('🔍 [DEBUG] Razorpay payment response:', response);
            console.log('🔍 [DEBUG] Verification parameters:', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId,
              cohortId,
              amount,
              paymentPlan,
              installmentId,
              semesterNumber,
            });

            // Verify payment
            const verificationResponse = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId,
              cohortId,
              amount,
              paymentPlan,
              installmentId,
              semesterNumber,
            });

            if (verificationResponse.success) {
              toast.success(
                'Payment completed successfully! Your payment is under verification.'
              );
              onSuccess?.();
            } else {
              throw new Error(
                verificationResponse.message || 'Payment verification failed'
              );
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            onError?.(
              error instanceof Error
                ? error.message
                : 'Payment verification failed'
            );
          }
        },
        prefill: {
          // You can prefill customer details if available
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
          },
        },
      };

      // Load Razorpay script dynamically
      await this.loadRazorpayScript();

      // Initialize and open Razorpay
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
      onError?.(
        error instanceof Error ? error.message : 'Payment initiation failed'
      );
    }
  }

  private async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is already loaded
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Razorpay script'));
      document.head.appendChild(script);
    });
  }
}

export const razorpayService = new RazorpayService();
