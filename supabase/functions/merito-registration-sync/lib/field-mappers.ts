/**
 * Field mapping utilities for converting data to Meritto format
 */

/**
 * Map gender values to Meritto format
 */
export function mapGender(gender: string): string | undefined {
  if (!gender) return undefined;

  switch (gender.toLowerCase()) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    case 'other':
      return 'Other';
    default:
      return undefined;
  }
}

/**
 * Map month values to full month names
 */
export function mapMonth(month: string | number): string | undefined {
  if (!month) return undefined;

  // Convert to string and handle both padded (01, 02) and unpadded (1, 2) formats
  const monthStr = month.toString().toLowerCase();
  const monthNum = parseInt(monthStr, 10);

  const monthMap: { [key: string]: string } = {
    '1': 'January',
    '01': 'January',
    january: 'January',
    jan: 'January',
    '2': 'February',
    '02': 'February',
    february: 'February',
    feb: 'February',
    '3': 'March',
    '03': 'March',
    march: 'March',
    mar: 'March',
    '4': 'April',
    '04': 'April',
    april: 'April',
    apr: 'April',
    '5': 'May',
    '05': 'May',
    may: 'May',
    '6': 'June',
    '06': 'June',
    june: 'June',
    jun: 'June',
    '7': 'July',
    '07': 'July',
    july: 'July',
    jul: 'July',
    '8': 'August',
    '08': 'August',
    august: 'August',
    aug: 'August',
    '9': 'September',
    '09': 'September',
    september: 'September',
    sep: 'September',
    '10': 'October',
    october: 'October',
    oct: 'October',
    '11': 'November',
    november: 'November',
    nov: 'November',
    '12': 'December',
    december: 'December',
    dec: 'December',
  };

  // First try direct mapping
  if (monthMap[monthStr]) {
    return monthMap[monthStr];
  }

  // If direct mapping fails, try using the parsed number
  if (monthNum >= 1 && monthNum <= 12) {
    return monthMap[monthNum.toString()];
  }

  return undefined;
}

/**
 * Map application status to Meritto status names
 */
export function mapApplicationStatusToMeritto(status: string): string {
  const statusMap: { [key: string]: string } = {
    registration_initiated: 'Application Initiated',
    registration_paid: 'Application Fee Paid',
    application_initiated: 'Application Submitted',
    application_accepted: 'Application Shortlisted',
    interview_selected: 'Interview Accepted',
    // Fallback for other statuses
    registration_complete: 'registration_complete',
    application_rejected: 'application_rejected',
    application_on_hold: 'application_on_hold',
    interview_scheduled: 'interview_scheduled',
    interview_rejected: 'interview_rejected',
    enrolled: 'enrolled',
  };

  return statusMap[status] || status;
}

/**
 * Format family income for Meritto (alphanumeric only constraint)
 */
export function formatFamilyIncome(
  income: string | null | undefined
): string | undefined {
  if (!income) return undefined;

  // Handle common dropdown formats and convert to alphanumeric format
  const incomeMap: { [key: string]: string } = {
    '5 00 000 10 00 000': '500000to1000000',
    '10 00 000 20 00 000': '1000000to2000000',
    '20 00 000 30 00 000': '2000000to3000000',
    '30 00 000 50 00 000': '3000000to5000000',
    '50 00 000 1 00 00 000': '5000000to10000000',
    'above 1 00 00 000': 'above10000000',
    'below 5 00 000': 'below500000',
    // Handle variations with different spacing/formatting
    '500000 1000000': '500000to1000000',
    '1000000 2000000': '1000000to2000000',
    '2000000 3000000': '2000000to3000000',
    '3000000 5000000': '3000000to5000000',
    '5000000 10000000': '5000000to10000000',
    // Handle comma-separated formats
    '5,00,000-10,00,000': '500000to1000000',
    '10,00,000-20,00,000': '1000000to2000000',
    '20,00,000-30,00,000': '2000000to3000000',
    '30,00,000-50,00,000': '3000000to5000000',
    '50,00,000-1,00,00,000': '5000000to10000000',
  };

  // Normalize the input by removing extra spaces and converting to lowercase
  const normalized = income.toLowerCase().replace(/\s+/g, ' ').trim();

  // Check if we have a direct mapping
  if (incomeMap[normalized]) {
    return incomeMap[normalized];
  }

  // If no direct mapping found, clean to alphanumeric only
  const cleaned = income.replace(/[^a-zA-Z0-9]/g, '');

  return cleaned || 'notspecified';
}
