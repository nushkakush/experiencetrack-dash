import { Scholarship } from '@/types/fee';

/**
 * Scholarship calculation utilities
 * Handles all scholarship-related calculations for fee structures
 */

/**
 * Calculate scholarship amount based on test score and available scholarships
 */
export const calculateScholarshipAmount = (
  programFee: number,
  testScore: number,
  scholarships: Scholarship[]
): number => {
  const applicableScholarship = scholarships.find(
    scholarship => testScore >= scholarship.start_percentage && testScore <= scholarship.end_percentage
  );
  
  if (!applicableScholarship) return 0;
  
  return Math.round(programFee * (applicableScholarship.amount_percentage / 100) * 100) / 100;
};

/**
 * Find applicable scholarship for a given test score
 */
export const findApplicableScholarship = (
  testScore: number,
  scholarships: Scholarship[]
): Scholarship | null => {
  return scholarships.find(
    scholarship => testScore >= scholarship.start_percentage && testScore <= scholarship.end_percentage
  ) || null;
};

/**
 * Validate scholarship ranges to ensure no overlaps
 */
export const validateScholarshipRanges = (
  scholarships: Scholarship[],
  excludeId?: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const filteredScholarships = excludeId 
    ? scholarships.filter(s => s.id !== excludeId)
    : scholarships;
  
  // Check for overlapping ranges
  for (let i = 0; i < filteredScholarships.length; i++) {
    for (let j = i + 1; j < filteredScholarships.length; j++) {
      const s1 = filteredScholarships[i];
      const s2 = filteredScholarships[j];
      
      if (
        (s1.start_percentage <= s2.end_percentage && s1.end_percentage >= s2.start_percentage) ||
        (s2.start_percentage <= s1.end_percentage && s2.end_percentage >= s1.start_percentage)
      ) {
        errors.push(`Scholarship ranges overlap: "${s1.name}" (${s1.start_percentage}%-${s1.end_percentage}%) and "${s2.name}" (${s2.start_percentage}%-${s2.end_percentage}%)`);
      }
    }
  }
  
  // Check for duplicate names
  const names = filteredScholarships.map(s => s.name.toLowerCase());
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate scholarship names: ${[...new Set(duplicateNames)].join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate total scholarship amount for multiple scholarships
 */
export const calculateTotalScholarshipAmount = (
  programFee: number,
  testScore: number,
  scholarships: Scholarship[]
): number => {
  return scholarships.reduce((total, scholarship) => {
    if (testScore >= scholarship.start_percentage && testScore <= scholarship.end_percentage) {
      return total + Math.round(programFee * (scholarship.amount_percentage / 100) * 100) / 100;
    }
    return total;
  }, 0);
};
