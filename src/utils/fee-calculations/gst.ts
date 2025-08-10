/**
 * GST (Goods and Services Tax) calculation utilities
 * Handles all GST-related calculations for fee structures
 */

const GST_RATE = 18; // 18%

/**
 * Calculate GST amount for a given base amount
 */
export const calculateGST = (baseAmount: number): number => {
  return Math.round(baseAmount * (GST_RATE / 100) * 100) / 100;
};

/**
 * Extract GST amount from a total amount that already includes GST
 */
export const extractGSTFromTotal = (totalAmount: number): number => {
  // Formula: GST = Total Amount - (Total Amount / (1 + GST_RATE/100))
  const baseAmount = totalAmount / (1 + GST_RATE / 100);
  const gstAmount = totalAmount - baseAmount;
  return Math.round(gstAmount * 100) / 100;
};

/**
 * Extract base amount from a total amount that already includes GST
 */
export const extractBaseAmountFromTotal = (totalAmount: number): number => {
  // Formula: Base Amount = Total Amount / (1 + GST_RATE/100)
  return Math.round((totalAmount / (1 + GST_RATE / 100)) * 100) / 100;
};

/**
 * Calculate total amount including GST
 */
export const calculateTotalWithGST = (baseAmount: number): number => {
  return Math.round((baseAmount * (1 + GST_RATE / 100)) * 100) / 100;
};

/**
 * Get the current GST rate
 */
export const getGSTRate = (): number => {
  return GST_RATE;
};
