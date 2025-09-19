/**
 * Clean alphanumeric text by removing special characters
 */
export function cleanAlphanumeric(
  text: string | null | undefined
): string | undefined {
  if (!text) return undefined;

  // Remove special characters, keep only alphanumeric and spaces
  const cleaned = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || undefined;
}

/**
 * Clean address specifically for Meritto API constraints
 */
export function cleanAddress(
  text: string | null | undefined
): string | undefined {
  if (!text) return undefined;

  // Remove all special characters except spaces, keep only alphanumeric and spaces
  const cleaned = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || undefined;
}

/**
 * Clean and validate email address
 */
export function cleanEmail(
  email: string | null | undefined
): string | undefined {
  if (!email) return undefined;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : undefined;
}

/**
 * Clean and format name by removing special characters
 */
export function cleanName(firstName?: string, lastName?: string): string {
  const fullName = `${firstName || ''} ${lastName || ''}`;
  const cleaned = fullName.replace(/[^a-zA-Z\s]/g, '').trim();

  return cleaned || 'Unknown User';
}
