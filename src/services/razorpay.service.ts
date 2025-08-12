import { supabase } from "@/integrations/supabase/client";
import { ApiResponse } from "@/types/common";
import { 
  RazorpayOrder,
  RazorpayPayment,
  RazorpayConfig,
  RazorpayNotes,
  RazorpayWebhookEvent,
  RazorpayRefund,
  RazorpaySuccessCallback,
  RazorpayFailureCallback
} from "@/types/payments/RazorpayTypes";



class RazorpayService {
  private config: RazorpayConfig | null = null;

  // Initialize Razorpay configuration
  async initializeConfig(cohortId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("payment_method_configurations")
        .select("razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret")
        .eq("cohort_id", cohortId)
        .single();

      if (error) throw error;

      this.config = {
        key_id: data.razorpay_key_id,
        key_secret: data.razorpay_key_secret,
        webhook_secret: data.razorpay_webhook_secret
      };
    } catch (error) {
      console.error('Failed to initialize Razorpay config:', error);
      throw error;
    }
  }

  // Create a Razorpay order
  async createOrder(
    amount: number,
    currency: string = 'INR',
    receipt: string,
    notes?: RazorpayNotes
  ): Promise<ApiResponse<RazorpayOrder>> {
    if (!this.config) {
      throw new Error('Razorpay not configured for this cohort');
    }

    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency,
          receipt,
          notes,
          key_id: this.config.key_id,
          key_secret: this.config.key_secret
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Razorpay order');
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  // Verify Razorpay payment signature
  async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    if (!this.config) {
      throw new Error('Razorpay not configured for this cohort');
    }

    try {
      const response = await fetch('/api/razorpay/verify-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          payment_id: paymentId,
          signature,
          key_secret: this.config.key_secret
        }),
      });

      const data = await response.json();
      return data.verified === true;
    } catch (error) {
      console.error('Failed to verify payment signature:', error);
      return false;
    }
  }

  // Get payment details from Razorpay
  async getPaymentDetails(paymentId: string): Promise<ApiResponse<RazorpayPayment>> {
    if (!this.config) {
      throw new Error('Razorpay not configured for this cohort');
    }

    try {
      const response = await fetch(`/api/razorpay/payment/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get payment details');
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  // Process Razorpay webhook
  async processWebhook(
    webhookBody: string,
    webhookSignature: string
  ): Promise<ApiResponse<RazorpayWebhookEvent>> {
    if (!this.config) {
      throw new Error('Razorpay not configured for this cohort');
    }

    try {
      const response = await fetch('/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': webhookSignature,
        },
        body: webhookBody,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process webhook');
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  // Initialize Razorpay checkout
  initializeCheckout(
    orderId: string,
    amount: number,
    currency: string = 'INR',
    name: string = 'LIT School',
    description: string = 'Fee Payment',
    prefill: RazorpayNotes = {},
    onSuccess: (response: RazorpaySuccessCallback) => void,
    onFailure: (error: RazorpayFailureCallback) => void
  ): void {
    if (!this.config) {
      throw new Error('Razorpay not configured for this cohort');
    }

    const options = {
      key: this.config.key_id,
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      name,
      description,
      order_id: orderId,
      prefill,
      handler: onSuccess,
      modal: {
        ondismiss: onFailure
      },
      theme: {
        color: '#3B82F6'
      }
    };

    // @ts-ignore - Razorpay types
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  // Refund payment
  async refundPayment(
    paymentId: string,
    amount?: number,
    notes?: string
  ): Promise<ApiResponse<RazorpayRefund>> {
    if (!this.config) {
      throw new Error('Razorpay not configured for this cohort');
    }

    try {
      const response = await fetch('/api/razorpay/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: amount ? amount * 100 : undefined, // Razorpay expects amount in paise
          notes,
          key_secret: this.config.key_secret
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refund payment');
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }
}

export const razorpayService = new RazorpayService();
