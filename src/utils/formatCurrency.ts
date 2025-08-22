/**
 * Currency formatting utilities
 */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN').format(amount);
};

export const parseCurrencyInput = (input: string): number => {
  // Remove currency symbols, commas, and whitespace
  const cleanInput = input.replace(/[₹,\s]/g, '');
  return parseFloat(cleanInput) || 0;
};
