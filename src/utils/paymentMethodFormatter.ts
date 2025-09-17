/**
 * Payment Method Formatter Utilities
 * Handles formatting payment methods for different user contexts
 */

/**
 * Format payment method for student display
 * Masks 'cash' payments as 'bank_transfer' for students
 * @param method - The payment method from database
 * @returns Formatted payment method string for student display
 */
export const formatPaymentMethodForStudent = (method: string): string => {
  // Mask cash payments as bank_transfer for students
  const maskedMethod = method?.toLowerCase() === 'cash' ? 'bank_transfer' : method;
  
  switch (maskedMethod?.toLowerCase()) {
    case 'razorpay':
      return 'Online Payment';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cash':
      return 'Cash'; // This should never be reached due to masking above
    case 'cheque':
      return 'Cheque';
    case 'dd':
      return 'Demand Draft';
    case 'upi':
      return 'UPI';
    case 'scan_to_pay':
      return 'Scan to Pay (UPI)';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    default:
      return method ? method.replace('_', ' ').toUpperCase() : 'Unknown';
  }
};

/**
 * Format payment method for admin display
 * Shows actual payment method without masking
 * @param method - The payment method from database
 * @returns Formatted payment method string for admin display
 */
export const formatPaymentMethodForAdmin = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'razorpay':
      return 'Online Payment';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cash':
      return 'Cash';
    case 'cheque':
      return 'Cheque';
    case 'dd':
      return 'Demand Draft';
    case 'upi':
      return 'UPI';
    case 'scan_to_pay':
      return 'Scan to Pay (UPI)';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    default:
      return method ? method.replace('_', ' ').toUpperCase() : 'Unknown';
  }
};

/**
 * Format payment method for email display (student context)
 * Masks 'cash' payments as 'bank_transfer' for students
 * @param method - The payment method from database
 * @returns Formatted payment method string for email display
 */
export const formatPaymentMethodForEmail = (method: string): string => {
  // Mask cash payments as bank_transfer for students in emails
  const maskedMethod = method?.toLowerCase() === 'cash' ? 'bank_transfer' : method;
  
  switch (maskedMethod?.toLowerCase()) {
    case 'razorpay':
      return 'Online Payment';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cash':
      return 'Cash'; // This should never be reached due to masking above
    case 'cheque':
      return 'Cheque';
    case 'dd':
      return 'Demand Draft';
    case 'upi':
      return 'UPI';
    case 'scan_to_pay':
      return 'Scan to Pay (UPI)';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    default:
      return method ? method.replace('_', ' ').toUpperCase() : 'Unknown';
  }
};

/**
 * Simple payment method formatter with masking for students
 * Used in components that need simple string replacement
 * @param method - The payment method from database
 * @returns Formatted payment method string with simple replacement
 */
export const formatPaymentMethodSimple = (method: string): string => {
  console.log('🔍 [formatPaymentMethodSimple] Input method:', method);
  
  // Mask cash payments as bank_transfer for students
  const maskedMethod = method?.toLowerCase() === 'cash' ? 'bank_transfer' : method;
  
  console.log('🔍 [formatPaymentMethodSimple] Masked method:', maskedMethod);
  
  const result = maskedMethod ? maskedMethod.replace('_', ' ').toUpperCase() : 'Unknown';
  
  console.log('🔍 [formatPaymentMethodSimple] Final result:', result);
  
  return result;
};

/**
 * Uppercase payment method formatter with masking for students
 * Used in components that need uppercase display
 * @param method - The payment method from database
 * @returns Uppercase formatted payment method string
 */
export const formatPaymentMethodUppercase = (method: string): string => {
  // Mask cash payments as bank_transfer for students
  const maskedMethod = method?.toLowerCase() === 'cash' ? 'bank_transfer' : method;
  return maskedMethod ? maskedMethod.replace('_', ' ').toUpperCase() : 'UNKNOWN';
};
