/**
 * Format date of birth to DD/MM/YYYY format for Meritto API
 */
export function formatDateOfBirth(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  try {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateStr);
      return undefined;
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return undefined;
  }
}

/**
 * Format application created date to DD/MM/YYYY format
 */
export function formatApplicationDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
