import { Building2, DollarSign, FileText, CreditCard } from 'lucide-react';

export interface PaymentField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FileUploadField {
  name: string;
  label: string;
  description: string;
  acceptedTypes: string;
  required: boolean;
}

import { LucideIcon } from 'lucide-react';

export interface PaymentModeConfig {
  name: string;
  icon: LucideIcon;
  fields: PaymentField[];
  fileUploads: FileUploadField[];
  validation: {
    required: string[];
    files: string[];
  };
  ui?: {
    alert?: {
      icon: LucideIcon;
      description: string;
    };
    customComponent?: string;
  };
}

export const PAYMENT_MODE_CONFIG: Record<string, PaymentModeConfig> = {
  bank_transfer: {
    name: 'Bank Transfer',
    icon: Building2,
    fields: [
      {
        name: 'transactionId',
        label: 'Transaction ID / Reference Number',
        type: 'text',
        placeholder: 'Enter transaction ID',
        required: true,
        validation: {
          minLength: 3,
          message: 'Transaction ID is required'
        }
      },
      {
        name: 'bankName',
        label: 'Bank Name',
        type: 'text',
        placeholder: 'Enter bank name',
        required: true,
        validation: {
          minLength: 2,
          message: 'Bank name is required'
        }
      },
      {
        name: 'transferDate',
        label: 'Transfer Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Transfer date is required'
        }
      }
    ],
    fileUploads: [
      {
        name: 'bankTransferScreenshot',
        label: 'Bank Transfer Screenshot/Receipt',
        description: 'Upload screenshot or receipt of your bank transfer',
        acceptedTypes: 'image/*,.pdf',
        required: true
      },
      {
        name: 'bankTransferAcknowledgment',
        label: 'Transfer Acknowledgment',
        description: 'Upload bank acknowledgment or confirmation',
        acceptedTypes: 'image/*,.pdf',
        required: false
      }
    ],
    validation: {
      required: ['transactionId', 'bankName', 'transferDate'],
      files: ['bankTransferScreenshot']
    }
  },

  cash: {
    name: 'Cash',
    icon: DollarSign,
    fields: [
      {
        name: 'receiptNumber',
        label: 'Receipt Number',
        type: 'text',
        placeholder: 'Enter receipt number',
        required: true,
        validation: {
          minLength: 3,
          message: 'Receipt number is required'
        }
      },
      {
        name: 'paymentDate',
        label: 'Payment Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Payment date is required'
        }
      }
    ],
    fileUploads: [
      {
        name: 'cashReceipt',
        label: 'Cash Payment Receipt',
        description: 'Upload the original cash payment receipt',
        acceptedTypes: 'image/*,.pdf',
        required: true
      },
      {
        name: 'cashAcknowledgment',
        label: 'Payment Acknowledgment',
        description: 'Upload any acknowledgment document',
        acceptedTypes: 'image/*,.pdf',
        required: false
      }
    ],
    validation: {
      required: ['receiptNumber', 'paymentDate'],
      files: ['cashReceipt']
    }
  },

  cheque: {
    name: 'Cheque',
    icon: FileText,
    fields: [
      {
        name: 'chequeNumber',
        label: 'Cheque Number',
        type: 'text',
        placeholder: 'Enter cheque number',
        required: true,
        validation: {
          minLength: 3,
          message: 'Cheque number is required'
        }
      },
      {
        name: 'bankName',
        label: 'Bank Name',
        type: 'text',
        placeholder: 'Enter bank name',
        required: true,
        validation: {
          minLength: 2,
          message: 'Bank name is required'
        }
      },
      {
        name: 'chequeDate',
        label: 'Cheque Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Cheque date is required'
        }
      }
    ],
    fileUploads: [
      {
        name: 'chequeImage',
        label: 'Cheque Image',
        description: 'Upload front and back images of the cheque',
        acceptedTypes: 'image/*',
        required: true
      },
      {
        name: 'chequeAcknowledgment',
        label: 'Cheque Acknowledgment',
        description: 'Upload bank acknowledgment for cheque deposit',
        acceptedTypes: 'image/*,.pdf',
        required: false
      }
    ],
    validation: {
      required: ['chequeNumber', 'bankName', 'chequeDate'],
      files: ['chequeImage']
    }
  },

  razorpay: {
    name: 'Online Payment (Razorpay)',
    icon: CreditCard,
    fields: [],
    fileUploads: [
      {
        name: 'razorpayReceipt',
        label: 'Payment Receipt',
        description: 'Upload Razorpay payment receipt (optional)',
        acceptedTypes: 'image/*,.pdf',
        required: false
      }
    ],
    validation: {
      required: [],
      files: []
    },
    ui: {
      alert: {
        icon: CreditCard,
        description: 'You will be redirected to Razorpay for secure online payment processing.'
      }
    }
  },

  scan_to_pay: {
    name: 'Scan to Pay (UPI)',
    icon: CreditCard,
    fields: [],
    fileUploads: [
      {
        name: 'scanToPayScreenshot',
        label: 'UPI Payment Screenshot',
        description: 'Upload screenshot of your UPI payment confirmation',
        acceptedTypes: 'image/*',
        required: true
      },
      {
        name: 'scanToPayReceipt',
        label: 'Payment Receipt',
        description: 'Upload UPI payment receipt (optional)',
        acceptedTypes: 'image/*,.pdf',
        required: false
      }
    ],
    validation: {
      required: [],
      files: ['scanToPayScreenshot']
    },
    ui: {
      alert: {
        icon: CreditCard,
        description: 'Scan the QR code below with your UPI application to make the payment.'
      },
      customComponent: 'QRCodeDisplay'
    }
  }
};

export const getPaymentModeConfig = (mode: string): PaymentModeConfig | null => {
  return PAYMENT_MODE_CONFIG[mode] || null;
};

export const getAvailablePaymentModes = (): string[] => {
  return Object.keys(PAYMENT_MODE_CONFIG);
};

export const getRequiredFieldsForMode = (mode: string): string[] => {
  const config = getPaymentModeConfig(mode);
  return config?.validation.required || [];
};

export const getRequiredFilesForMode = (mode: string): string[] => {
  const config = getPaymentModeConfig(mode);
  return config?.validation.files || [];
};
