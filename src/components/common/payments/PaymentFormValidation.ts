export interface PaymentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface PaymentDetails {
  transactionId?: string;
  bankName?: string;
  transferDate?: string;
  receiptNumber?: string;
  paymentDate?: string;
  chequeNumber?: string;
  chequeDate?: string;
  [key: string]: any; // For any additional fields
}

export const validatePaymentForm = (
  selectedPaymentMode: string,
  amountToPay: number,
  maxAmount: number,
  paymentDetails: PaymentDetails,
  uploadedFiles: Record<string, File>
): PaymentValidationResult => {
  const errors: Record<string, string> = {};

  // Validate amount
  const amountError = validateAmount(amountToPay, maxAmount);
  if (amountError) {
    errors.amount = amountError;
  }

  // Validate payment mode
  if (!selectedPaymentMode) {
    errors.paymentMode = 'Please select a payment mode';
  }

  // Validate payment mode specific fields
  if (selectedPaymentMode && selectedPaymentMode !== 'razorpay') {
    const requiredFields = getRequiredFieldsForMode(selectedPaymentMode);
    for (const field of requiredFields) {
      if (!paymentDetails[field]) {
        errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    }
  }

  // Validate file uploads
  const requiredFiles = getRequiredFilesForMode(selectedPaymentMode);
  for (const fileField of requiredFiles) {
    if (!uploadedFiles[fileField]) {
      errors[fileField] = 'Please upload the required file';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAmount = (amount: number, maxAmount: number): string => {
  if (amount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (amount > maxAmount) {
    return `Amount cannot exceed ${formatCurrency(maxAmount)}`;
  }
  return '';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const getRequiredFieldsForMode = (mode: string): string[] => {
  switch (mode) {
    case 'bank_transfer':
      return ['transactionId', 'bankName', 'transferDate'];
    case 'cash':
      return ['receiptNumber', 'paymentDate'];
    case 'cheque':
      return ['chequeNumber', 'bankName', 'chequeDate'];
    case 'scan_to_pay':
      return []; // No additional fields required for scan to pay
    case 'razorpay':
      return []; // No additional fields required for Razorpay
    default:
      return [];
  }
};

export const getRequiredFilesForMode = (mode: string): string[] => {
  switch (mode) {
    case 'bank_transfer':
      return ['bankTransferScreenshot'];
    case 'cash':
      return ['cashReceipt'];
    case 'cheque':
      return ['chequeImage'];
    case 'scan_to_pay':
      return ['scanToPayScreenshot'];
    case 'razorpay':
      return []; // Optional for Razorpay
    default:
      return [];
  }
};
