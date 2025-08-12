import { NewFeeStructureInput, Scholarship } from '@/types/fee';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class FeeValidationService {
  /**
   * Validates fee structure data
   */
  static validateFeeStructure(data: NewFeeStructureInput): ValidationResult {
    const errors: ValidationError[] = [];

    if (data.admission_fee < 0) {
      errors.push({
        field: 'admission_fee',
        message: 'Admission fee cannot be negative'
      });
    }

    if (data.total_program_fee <= 0) {
      errors.push({
        field: 'total_program_fee',
        message: 'Total program fee must be greater than 0'
      });
    }

    if (data.number_of_semesters < 1 || data.number_of_semesters > 12) {
      errors.push({
        field: 'number_of_semesters',
        message: 'Number of semesters must be between 1 and 12'
      });
    }

    if (data.instalments_per_semester < 1 || data.instalments_per_semester > 12) {
      errors.push({
        field: 'instalments_per_semester',
        message: 'Instalments per semester must be between 1 and 12'
      });
    }

    if (data.one_shot_discount_percentage < 0 || data.one_shot_discount_percentage > 100) {
      errors.push({
        field: 'one_shot_discount_percentage',
        message: 'Discount percentage must be between 0 and 100'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates scholarship data
   */
  static validateScholarships(scholarships: Scholarship[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (scholarships.length === 0) {
      errors.push({
        field: 'scholarships',
        message: 'At least one scholarship is required'
      });
      return { isValid: false, errors };
    }

    // Check for overlapping scholarships
    for (let i = 0; i < scholarships.length; i++) {
      const current = scholarships[i];
      
      for (let j = 0; j < scholarships.length; j++) {
        if (i === j) continue;
        
        const other = scholarships[j];
        const currentStart = current.start_percentage;
        const currentEnd = current.end_percentage;
        const otherStart = other.start_percentage;
        const otherEnd = other.end_percentage;
        
        if (currentStart <= otherEnd && otherStart <= currentEnd) {
          errors.push({
            field: 'scholarship_overlap',
            message: `Overlapping scholarships detected: "${current.name}" (${current.start_percentage}%-${current.end_percentage}%) overlaps with "${other.name}" (${other.start_percentage}%-${other.end_percentage}%). Scholarship ranges cannot overlap.`
          });
        }
      }
    }

    // Validate individual scholarship fields
    scholarships.forEach((scholarship, index) => {
      if (!scholarship.name?.trim()) {
        errors.push({
          field: `scholarship-${index}-name`,
          message: 'Scholarship name is required'
        });
      }
      
      if (!scholarship.amount_percentage || scholarship.amount_percentage <= 0) {
        errors.push({
          field: `scholarship-${index}-amount`,
          message: 'Amount percentage must be greater than 0'
        });
      }
      
      if (scholarship.amount_percentage > 100) {
        errors.push({
          field: `scholarship-${index}-amount`,
          message: 'Amount percentage cannot exceed 100%'
        });
      }
      
      if (scholarship.start_percentage >= scholarship.end_percentage) {
        errors.push({
          field: `scholarship-${index}-range`,
          message: 'Start percentage must be less than end percentage'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates a single scholarship
   */
  static validateSingleScholarship(scholarship: Scholarship, index: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!scholarship.name?.trim()) {
      errors.push({
        field: `scholarship-${index}-name`,
        message: 'Scholarship name is required'
      });
    }
    
    if (!scholarship.amount_percentage || scholarship.amount_percentage <= 0) {
      errors.push({
        field: `scholarship-${index}-amount`,
        message: 'Amount percentage must be greater than 0'
      });
    }
    
    if (scholarship.amount_percentage > 100) {
      errors.push({
        field: `scholarship-${index}-amount`,
        message: 'Amount percentage cannot exceed 100%'
      });
    }
    
    if (scholarship.start_percentage >= scholarship.end_percentage) {
      errors.push({
        field: `scholarship-${index}-range`,
        message: 'Start percentage must be less than end percentage'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converts validation errors to Record format for form components
   */
  static errorsToRecord(errors: ValidationError[]): Record<string, string> {
    return errors.reduce((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Validates complete fee collection setup
   */
  static validateCompleteSetup(
    feeStructure: NewFeeStructureInput,
    scholarships: Scholarship[]
  ): ValidationResult {
    const feeStructureValidation = this.validateFeeStructure(feeStructure);
    const scholarshipsValidation = this.validateScholarships(scholarships);

    const allErrors = [
      ...feeStructureValidation.errors,
      ...scholarshipsValidation.errors
    ];

    return {
      isValid: feeStructureValidation.isValid && scholarshipsValidation.isValid,
      errors: allErrors
    };
  }
}
