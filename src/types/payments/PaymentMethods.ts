/**
 * Payment Methods Types
 * Centralized payment method definitions and configurations
 */

export interface PaymentMethodConfiguration {
  id: string;
  cohort_id: string;
  cash_enabled: boolean;
  bank_transfer_enabled: boolean;
  cheque_enabled: boolean;
  scan_to_pay_enabled: boolean;
  razorpay_enabled: boolean;
  bank_account_number?: string;
  bank_account_holder?: string;
  ifsc_code?: string;
  bank_name?: string;
  bank_branch?: string;
  qr_code_url?: string;
  upi_id?: string;
  receiver_bank_name?: string;
  receiver_bank_logo_url?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_webhook_secret?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface IndianBank {
  id: string;
  bank_name: string;
  bank_code?: string;
  ifsc_code_prefix?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentSubmissionData {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  receiptFile?: File;
  proofOfPaymentFile?: File;
  transactionScreenshotFile?: File;
  bankName?: string;
  bankBranch?: string;
  transferDate?: string;
  qrCodeUrl?: string;
  upiId?: string;
  receiverBankName?: string;
  receiverBankLogoUrl?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  studentId?: string;
  cohortId?: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  transaction_type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  payment_method: 'online' | 'bank_transfer' | 'cash' | 'cheque';
  reference_number?: string;
  status: 'success' | 'failed' | 'pending';
  notes?: string;
  created_at: string | null;
  created_by?: string | null;
  updated_at: string | null;
  verification_status?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  receipt_url?: string | null;
  proof_of_payment_url?: string | null;
  transaction_screenshot_url?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  utr_number?: string | null;
  account_number?: string | null;
  cheque_number?: string | null;
  payer_upi_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_signature?: string | null;
  qr_code_url?: string | null;
  receiver_bank_name?: string | null;
  receiver_bank_logo_url?: string | null;
  verification_notes?: string | null;
  rejection_reason?: string | null;
  payment_date?: string | null;
  transfer_date?: string | null;
}

/**
 * Payment Method Utilities
 */
export const PAYMENT_METHOD_CONFIG = {
  cash: {
    label: 'Cash',
    icon: '💵',
    requiresReference: false,
    requiresFile: false,
    requiresBankDetails: false
  },
  bank_transfer: {
    label: 'Bank Transfer',
    icon: '🏦',
    requiresReference: true,
    requiresFile: true,
    requiresBankDetails: true
  },
  cheque: {
    label: 'Cheque',
    icon: '📄',
    requiresReference: true,
    requiresFile: true,
    requiresBankDetails: false
  },
  online: {
    label: 'Online Payment',
    icon: '💳',
    requiresReference: false,
    requiresFile: false,
    requiresBankDetails: false
  },
  scan_to_pay: {
    label: 'Scan to Pay',
    icon: '📱',
    requiresReference: false,
    requiresFile: false,
    requiresBankDetails: false
  },
  razorpay: {
    label: 'Razorpay',
    icon: '🔗',
    requiresReference: false,
    requiresFile: false,
    requiresBankDetails: false
  }
} as const;

export const getPaymentMethodConfig = (method: string) => {
  return PAYMENT_METHOD_CONFIG[method as keyof typeof PAYMENT_METHOD_CONFIG] || {
    label: method,
    icon: '❓',
    requiresReference: false,
    requiresFile: false,
    requiresBankDetails: false
  };
};

export const isPaymentMethodEnabled = (
  config: PaymentMethodConfiguration,
  method: string
): boolean => {
  switch (method) {
    case 'cash':
      return config.cash_enabled;
    case 'bank_transfer':
      return config.bank_transfer_enabled;
    case 'cheque':
      return config.cheque_enabled;
    case 'scan_to_pay':
      return config.scan_to_pay_enabled;
    case 'razorpay':
      return config.razorpay_enabled;
    default:
      return false;
  }
};

export const getAvailablePaymentMethods = (
  config: PaymentMethodConfiguration
): string[] => {
  const methods: string[] = [];
  
  if (config.cash_enabled) methods.push('cash');
  if (config.bank_transfer_enabled) methods.push('bank_transfer');
  if (config.cheque_enabled) methods.push('cheque');
  if (config.scan_to_pay_enabled) methods.push('scan_to_pay');
  if (config.razorpay_enabled) methods.push('razorpay');
  
  return methods;
};
