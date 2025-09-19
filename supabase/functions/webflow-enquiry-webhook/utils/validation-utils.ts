/**
 * Parse age field safely, handling empty strings and invalid values
 */
export function parseAge(ageValue: unknown): number | undefined {
  if (!ageValue || ageValue === '') {
    return undefined;
  }

  const parsed = parseInt(String(ageValue));
  return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
}

/**
 * Calculate age from date of birth string
 */
export function calculateAgeFromDateOfBirth(
  dateOfBirth: string | null
): number | undefined {
  if (!dateOfBirth) {
    return undefined;
  }

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    if (isNaN(birthDate.getTime())) {
      console.warn('Invalid date of birth format:', dateOfBirth);
      return undefined;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age > 0 ? age : undefined;
  } catch (error) {
    console.error('Error calculating age from date of birth:', error);
    return undefined;
  }
}

/**
 * Clean and validate mobile number for Indian format
 */
export function cleanMobile(phone: string | null): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  let mobileNumber = '';

  // Handle different formats
  if (digits.length === 10) {
    mobileNumber = digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    // Remove country code if present
    mobileNumber = digits.substring(2);
  } else if (digits.length === 13 && digits.startsWith('91')) {
    // Handle +91 case
    mobileNumber = digits.substring(2);
  } else {
    console.warn('Invalid phone number length:', phone, 'digits:', digits);
    return undefined;
  }

  // Validate Indian mobile number format (should start with 6, 7, 8, or 9)
  if (mobileNumber.length === 10 && /^[6-9]/.test(mobileNumber)) {
    return mobileNumber;
  }

  console.warn(
    'Invalid Indian mobile number format:',
    phone,
    'cleaned:',
    mobileNumber,
    'Must start with 6, 7, 8, or 9'
  );
  return undefined;
}

/**
 * Validate required fields for different form types
 */
export function validateRequiredFields(
  enquiryData: any,
  formName: string
): { isValid: boolean; missingFields?: string[] } {
  if (formName === 'Email Form') {
    // Email Form only requires email
    if (!enquiryData.email) {
      return { isValid: false, missingFields: ['email'] };
    }
  } else {
    // Other forms require name, email, and phone
    const missingFields: string[] = [];
    if (!enquiryData.full_name) missingFields.push('full_name');
    if (!enquiryData.email) missingFields.push('email');
    if (!enquiryData.phone) missingFields.push('phone');

    if (missingFields.length > 0) {
      return { isValid: false, missingFields };
    }
  }

  return { isValid: true };
}
