/**
 * Clean and validate mobile phone numbers for Indian format
 */
export function cleanMobile(
  phone: string | null | undefined
): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Remove leading country code if present (91 for India)
  const cleaned =
    digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;

  // Validate Indian mobile number format (10 digits starting with 6, 7, 8, or 9)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return cleaned;
  }

  console.warn('Invalid mobile number format:', phone, 'cleaned:', cleaned);
  return undefined;
}
