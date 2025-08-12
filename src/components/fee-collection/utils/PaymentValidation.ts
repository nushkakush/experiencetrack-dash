import { toast } from 'sonner';

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePaymentForm = (
  selectedMethod: string,
  amountPaid: number,
  requiredAmount: number,
  paymentReferenceNumber: string,
  transferDate: string,
  bankName: string,
  bankBranch: string,
  receiptFile: File | null,
  proofOfPaymentFile: File | null,
  transactionScreenshotFile: File | null
): PaymentValidationResult => {
  const errors: string[] = [];

  // Basic validation
  if (!selectedMethod) {
    errors.push('Please select a payment method');
  }

  if (amountPaid <= 0) {
    errors.push('Please enter a valid amount');
  }

  if (amountPaid > requiredAmount) {
    errors.push('Amount paid cannot exceed required amount');
  }

  // Method-specific validation
  switch (selectedMethod) {
    case 'cash':
      if (!receiptFile) {
        errors.push('Please upload Fee Acknowledgement Receipt for cash payment');
      }
      break;

    case 'bank_transfer':
    case 'cheque':
      if (!paymentReferenceNumber) {
        errors.push('Please enter payment reference number');
      }
      if (!transferDate) {
        errors.push('Please select transfer date');
      }
      if (!bankName) {
        errors.push('Please select bank name');
      }
      if (!bankBranch) {
        errors.push('Please enter bank branch');
      }
      if (!proofOfPaymentFile) {
        errors.push('Please upload proof of payment document');
      }
      break;

    case 'scan_to_pay':
      if (!transactionScreenshotFile) {
        errors.push('Please upload transaction screenshot');
      }
      break;

    case 'razorpay':
      // Razorpay validation will be handled by the payment gateway
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const showValidationErrors = (errors: string[]) => {
  errors.forEach(error => {
    toast.error(error);
  });
};
