import type { ProfessionalStatus, YesNoMaybe } from '../lib/types.ts';

/**
 * Map professional status from Webflow to our format
 */
export function mapProfessionalStatus(
  webflowValue: string
): ProfessionalStatus {
  if (!webflowValue) return 'student'; // Default fallback

  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'student':
    case 'a student':
      return 'student';
    case 'working professional':
    case 'a working professional':
    case 'working':
    case 'professional':
      return 'A Working Professional';
    case 'in between jobs':
    case 'between jobs':
    case 'unemployed':
      return 'In Between Jobs';
    default:
      // If we can't map it, try to infer from the original value
      if (value.includes('student')) return 'student';
      if (value.includes('working') || value.includes('professional'))
        return 'A Working Professional';
      if (value.includes('between') || value.includes('unemployed'))
        return 'In Between Jobs';
      return 'student'; // final fallback
  }
}

/**
 * Map relocation possibility from Webflow to our format
 */
export function mapRelocationPossible(webflowValue: string): YesNoMaybe {
  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'maybe':
      return 'Maybe';
    default:
      return 'Maybe'; // fallback
  }
}

/**
 * Map investment willingness from Webflow to our format
 */
export function mapInvestmentWilling(webflowValue: string): YesNoMaybe {
  const value = webflowValue.toLowerCase().trim();

  switch (value) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'maybe':
      return 'Maybe';
    default:
      return 'Maybe'; // fallback
  }
}

/**
 * Map professional status to Meritto dropdown values
 */
export function mapProfessionalStatusToMeritto(status: string): string {
  switch (status) {
    case 'student':
      return 'A Student';
    case 'A Working Professional':
      return 'Working Professional';
    case 'In Between Jobs':
      return 'In Between Jobs';
    default:
      return 'A Student';
  }
}

/**
 * Map relocation possibility to Meritto dropdown values
 */
export function mapRelocationToMeritto(relocation: string): string {
  switch (relocation) {
    case 'Yes':
      return 'Yes';
    case 'No':
      return 'No';
    case 'Maybe':
      return 'May Be';
    default:
      return 'May Be';
  }
}

/**
 * Map investment willingness to Meritto dropdown values
 */
export function mapInvestmentToMeritto(investment: string): string {
  switch (investment) {
    case 'Yes':
      return 'Yes';
    case 'No':
      return 'No';
    case 'Maybe':
      return 'May Be';
    default:
      return 'May Be';
  }
}
