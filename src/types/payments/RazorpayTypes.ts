// Razorpay Types - Comprehensive type definitions for Razorpay payment gateway integration

import { ApiResponse } from '@/types/common';

// Razorpay Order Types
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: RazorpayNotes;
  created_at: number;
}

// Razorpay Payment Types
export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  amount_refunded: number;
  refund_status: string;
  captured: boolean;
  description: string;
  card_id: string;
  bank: string;
  wallet: string;
  vpa: string;
  email: string;
  contact: string;
  notes: RazorpayNotes;
  fee: number;
  tax: number;
  error_code: string;
  error_description: string;
  created_at: number;
}

// Razorpay Configuration Types
export interface RazorpayConfig {
  key_id: string;
  key_secret: string;
  webhook_secret: string;
}

// Razorpay Notes Types
export interface RazorpayNotes {
  [key: string]: string | number | boolean;
}

// Razorpay Order Creation Types
export interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: RazorpayNotes;
  key_id: string;
  key_secret: string;
}

// Razorpay Payment Verification Types
export interface RazorpayPaymentVerification {
  orderId: string;
  paymentId: string;
  signature: string;
}

// Razorpay Webhook Types
export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: RazorpayWebhookPayload;
  created_at: number;
}

export interface RazorpayWebhookPayload {
  payment?: RazorpayPayment;
  order?: RazorpayOrder;
  refund?: RazorpayRefund;
}

// Razorpay Refund Types
export interface RazorpayRefund {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: RazorpayNotes;
  receipt: string;
  acquirer_data: RazorpayAcquirerData;
  created_at: number;
  batch_id: string;
  status: string;
  speed_processed: string;
  speed_requested: string;
}

export interface RazorpayAcquirerData {
  [key: string]: string | number | boolean;
}

// Razorpay Checkout Types
export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: RazorpayPrefill;
  theme?: RazorpayTheme;
  modal?: RazorpayModal;
}

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
  method?: string;
}

export interface RazorpayTheme {
  color?: string;
  hide_topbar?: boolean;
}

export interface RazorpayModal {
  ondismiss?: () => void;
  escape?: boolean;
  handleback?: boolean;
  confirm_close?: boolean;
  animation?: boolean;
}

// Razorpay Callback Types
export interface RazorpaySuccessCallback {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureCallback {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: RazorpayNotes;
  };
}

// Razorpay Service Method Types
export interface RazorpayServiceMethods {
  initializeConfig: (cohortId: string) => Promise<void>;
  createOrder: (amount: number, currency: string, receipt: string, notes?: RazorpayNotes) => Promise<ApiResponse<RazorpayOrder>>;
  verifyPaymentSignature: (orderId: string, paymentId: string, signature: string) => Promise<boolean>;
  getPaymentDetails: (paymentId: string) => Promise<ApiResponse<RazorpayPayment>>;
  processWebhook: (webhookBody: string, webhookSignature: string) => Promise<ApiResponse<RazorpayWebhookEvent>>;
  initializeCheckout: (options: RazorpayCheckoutOptions, onSuccess: (response: RazorpaySuccessCallback) => void, onFailure: (error: RazorpayFailureCallback) => void) => void;
  refundPayment: (paymentId: string, amount?: number, notes?: string) => Promise<ApiResponse<RazorpayRefund>>;
}

// Razorpay Error Types
export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: RazorpayNotes;
}

// Razorpay Payment Method Types
export interface RazorpayPaymentMethod {
  method: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: RazorpayNotes;
}

// Razorpay Settlement Types
export interface RazorpaySettlement {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  fees: number;
  tax: number;
  utr: string;
  created_at: number;
}

// Razorpay Dispute Types
export interface RazorpayDispute {
  id: string;
  entity: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  reason_code: string;
  reason_description: string;
  created_at: number;
}

// Utility Types
export type RazorpayOrderUpdate = Partial<RazorpayOrder>;
export type RazorpayPaymentUpdate = Partial<RazorpayPayment>;
export type RazorpayConfigUpdate = Partial<RazorpayConfig>;

// Razorpay API Response Types
export interface RazorpayApiResponse<T> {
  data: T;
  error: RazorpayError | null;
  success: boolean;
}

// Razorpay Webhook Handler Types
export interface RazorpayWebhookHandler {
  event: string;
  handler: (payload: RazorpayWebhookPayload) => Promise<void>;
}

// Razorpay Configuration Database Types
export interface RazorpayConfigRow {
  id: string;
  cohort_id: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_webhook_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
