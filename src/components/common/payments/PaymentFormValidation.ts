export interface PaymentValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface PaymentDetails {
  transactionId?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  paymentDate?: string;
  chequeNumber?: string;
  qrCode?: string;
  payerUpiId?: string;
  [key: string]: any; // For any additional fields
}

export const validatePaymentForm = (
  selectedPaymentMode: string,
  amountToPay: number,
  maxAmount: number,
  paymentDetails: PaymentDetails,
  uploadedFiles: Record<string, File>
): PaymentValidationResult => {
  console.log('🔍 [DEBUG] validatePaymentForm called');
  console.log('🔍 [DEBUG] validatePaymentForm - selectedPaymentMode:', selectedPaymentMode);
  console.log('🔍 [DEBUG] validatePaymentForm - selectedPaymentMode type:', typeof selectedPaymentMode);
  console.log('🔍 [DEBUG] validatePaymentForm - selectedPaymentMode truthy:', !!selectedPaymentMode);
  console.log('🔍 [DEBUG] validatePaymentForm - selectedPaymentMode length:', selectedPaymentMode?.length);
  
  const errors: Record<string, string> = {};

  // Validate amount
  const amountError = validateAmount(amountToPay, maxAmount);
  if (amountError) {
    errors.amount = amountError;
  }

  // Validate payment mode
  if (!selectedPaymentMode) {
    console.log('❌ [DEBUG] Payment mode validation failed - selectedPaymentMode is falsy');
    errors.paymentMode = 'Please select a payment mode';
  } else {
    console.log('✅ [DEBUG] Payment mode validation passed');
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
      return ['paymentDate', 'bankName', 'bankBranch', 'accountNumber', 'transactionId'];
    case 'cash':
      return ['paymentDate'];
    case 'cheque':
      return ['paymentDate', 'bankName', 'bankBranch', 'accountNumber', 'chequeNumber'];
    case 'scan_to_pay':
      return ['qrCode', 'paymentDate', 'payerUpiId'];
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
      return ['cashAcknowledgment'];
    case 'cheque':
      return ['chequeImage', 'chequeAcknowledgment'];
    case 'scan_to_pay':
      return ['scanToPayScreenshot'];
    case 'razorpay':
      return []; // No files required for online payment
    default:
      return [];
  }
};
