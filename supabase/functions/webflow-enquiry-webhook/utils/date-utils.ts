/**
 * Format date of birth for Meritto API (DD/MM/YYYY format)
 */
export function formatDateOfBirthForMeritto(
  dateOfBirth: string | null
): string | undefined {
  if (!dateOfBirth) {
    return undefined;
  }

  try {
    // Parse the date (assuming it's in ISO format from Supabase: YYYY-MM-DD)
    const date = new Date(dateOfBirth);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date of birth format:', dateOfBirth);
      return undefined;
    }

    // Format as DD/MM/YYYY for Meritto
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
    const year = date.getFullYear().toString();

    const formattedDate = `${day}/${month}/${year}`;
    console.log(
      `📅 Formatted date of birth: ${dateOfBirth} → ${formattedDate}`
    );

    return formattedDate;
  } catch (error) {
    console.error('Error formatting date of birth:', error);
    return undefined;
  }
}
