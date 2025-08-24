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
        name: 'paymentDate',
        label: 'Payment Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Payment date is required'
        }
      },
      {
        name: 'paymentTime',
        label: 'Payment Time',
        type: 'time',
        required: true,
        validation: {
          message: 'Payment time is required'
        }
      },
      {
        name: 'bankName',
        label: 'Select Bank',
        type: 'select',
        placeholder: 'Select bank',
        required: true,
        validation: {
          message: 'Bank name is required'
        }
      },
      {
        name: 'bankBranch',
        label: 'Branch Name',
        type: 'text',
        placeholder: 'Enter branch name',
        required: true,
        validation: {
          message: 'Branch name is required'
        }
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        placeholder: 'Enter account number',
        required: true,
        validation: {
          message: 'Account number is required'
        }
      },
      {
        name: 'transactionId',
        label: 'UTR Number',
        type: 'text',
        placeholder: 'Enter UTR number',
        required: true,
        validation: {
          minLength: 3,
          message: 'UTR number is required'
        }
      }
    ],
    fileUploads: [
      {
        name: 'bankTransferScreenshot',
        label: 'Bank Transfer Screenshot/Acknowledgement Receipt',
        description: 'Upload screenshot or acknowledgement receipt of your bank transfer',
        acceptedTypes: 'image/*,.pdf',
        required: true
      }
    ],
    validation: {
      required: ['paymentDate', 'paymentTime', 'bankName', 'bankBranch', 'accountNumber', 'transactionId'],
      files: ['bankTransferScreenshot']
    }
  },

  cash: {
    name: 'Cash',
    icon: DollarSign,
    fields: [
      {
        name: 'paymentDate',
        label: 'Payment Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Payment date is required'
        }
      },
      {
        name: 'paymentTime',
        label: 'Payment Time',
        type: 'time',
        required: true,
        validation: {
          message: 'Payment time is required'
        }
      }
    ],
    fileUploads: [
      {
        name: 'cashAcknowledgment',
        label: 'Payment Acknowledgement',
        description: 'Upload the payment acknowledgement document',
        acceptedTypes: 'image/*,.pdf',
        required: true
      }
    ],
    validation: {
      required: ['paymentDate', 'paymentTime'],
      files: ['cashAcknowledgment']
    }
  },

  cheque: {
    name: 'Cheque',
    icon: FileText,
    fields: [
      {
        name: 'paymentDate',
        label: 'Payment Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Payment date is required'
        }
      },
      {
        name: 'paymentTime',
        label: 'Payment Time',
        type: 'time',
        required: true,
        validation: {
          message: 'Payment time is required'
        }
      },
      {
        name: 'bankName',
        label: 'Select Bank',
        type: 'select',
        placeholder: 'Select bank',
        required: true,
        validation: {
          message: 'Bank name is required'
        }
      },
      {
        name: 'bankBranch',
        label: 'Branch Name',
        type: 'text',
        placeholder: 'Enter branch name',
        required: true,
        validation: {
          message: 'Branch name is required'
        }
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        type: 'text',
        placeholder: 'Enter account number',
        required: true,
        validation: {
          message: 'Account number is required'
        }
      },
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
        required: true
      }
    ],
    validation: {
      required: ['paymentDate', 'paymentTime', 'bankName', 'bankBranch', 'accountNumber', 'chequeNumber'],
      files: ['chequeImage', 'chequeAcknowledgment']
    }
  },

  razorpay: {
    name: 'Online Payment',
    icon: CreditCard,
    fields: [],
    fileUploads: [],
    validation: {
      required: [],
      files: []
    }
  },

  scan_to_pay: {
    name: 'Scan to Pay',
    icon: CreditCard,
    fields: [
      {
        name: 'paymentDate',
        label: 'Payment Date',
        type: 'date',
        required: true,
        validation: {
          message: 'Payment date is required'
        }
      },
      {
        name: 'paymentTime',
        label: 'Payment Time',
        type: 'time',
        required: true,
        validation: {
          message: 'Payment time is required'
        }
      },
      {
        name: 'payerUpiId',
        label: 'Payer UPI ID',
        type: 'text',
        placeholder: 'Enter payer UPI ID',
        required: true,
        validation: {
          message: 'Payer UPI ID is required'
        }
      }
    ],
    fileUploads: [
      {
        name: 'scanToPayScreenshot',
        label: 'UPI Payment Screenshot',
        description: 'Upload screenshot of your UPI payment',
        acceptedTypes: 'image/*',
        required: true
      }
    ],
    validation: {
      required: ['paymentDate', 'paymentTime', 'payerUpiId'],
      files: ['scanToPayScreenshot']
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
