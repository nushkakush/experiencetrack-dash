import { z } from 'zod';
import {
  paymentPlanSchema,
  paymentSubmissionSchema,
  paymentAmountSchema,
  paymentStatusUpdateSchema,
  scholarshipAssignmentSchema,
  feeStructureSchema,
  paymentPlanValidationSchema,
  type PaymentPlanInput,
  type PaymentSubmissionInput,
  type PaymentAmountInput,
  type PaymentStatusUpdateInput,
  type ScholarshipAssignmentInput,
  type FeeStructureInput,
  type PaymentPlanValidationInput,
} from '../schemas/paymentSchemas';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
}

export class PaymentValidator {
  /**
   * Validate payment plan selection
   */
  static validatePaymentPlan(input: unknown): ValidationResult<PaymentPlanInput> {
    try {
      const data = paymentPlanSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid payment plan data'],
      };
    }
  }

  /**
   * Validate payment submission
   */
  static validatePaymentSubmission(input: unknown): ValidationResult<PaymentSubmissionInput> {
    try {
      const data = paymentSubmissionSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid payment submission data'],
      };
    }
  }

  /**
   * Validate payment amount
   */
  static validatePaymentAmount(input: unknown): ValidationResult<PaymentAmountInput> {
    try {
      const data = paymentAmountSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid payment amount data'],
      };
    }
  }

  /**
   * Validate payment status update
   */
  static validatePaymentStatusUpdate(input: unknown): ValidationResult<PaymentStatusUpdateInput> {
    try {
      const data = paymentStatusUpdateSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid payment status update data'],
      };
    }
  }

  /**
   * Validate scholarship assignment
   */
  static validateScholarshipAssignment(input: unknown): ValidationResult<ScholarshipAssignmentInput> {
    try {
      const data = scholarshipAssignmentSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid scholarship assignment data'],
      };
    }
  }

  /**
   * Validate fee structure
   */
  static validateFeeStructure(input: unknown): ValidationResult<FeeStructureInput> {
    try {
      const data = feeStructureSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid fee structure data'],
      };
    }
  }

  /**
   * Validate payment plan with business rules
   */
  static validatePaymentPlanWithBusinessRules(input: unknown): ValidationResult<PaymentPlanValidationInput> {
    try {
      const data = paymentPlanValidationSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
          fieldErrors: this.formatFieldErrors(error.errors),
        };
      }
      return {
        success: false,
        errors: ['Invalid payment plan validation data'],
      };
    }
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      maxSizeMB?: number;
    } = {}
  ): ValidationResult<File> {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'] } = options;
    const errors: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      errors.push(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return { success: true, data: file };
  }

  /**
   * Validate amount with business rules
   */
  static validateAmountWithBusinessRules(
    amount: number,
    options: {
      minAmount?: number;
      maxAmount?: number;
      currency?: string;
    } = {}
  ): ValidationResult<number> {
    const { minAmount = 1, maxAmount = 1000000, currency = 'INR' } = options;
    const errors: string[] = [];

    if (amount < minAmount) {
      errors.push(`Amount must be at least ${currency} ${minAmount}`);
    }

    if (amount > maxAmount) {
      errors.push(`Amount cannot exceed ${currency} ${maxAmount.toLocaleString()}`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return { success: true, data: amount };
  }

  /**
   * Format Zod field errors into a more usable format
   */
  private static formatFieldErrors(zodErrors: z.ZodIssue[]): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    zodErrors.forEach((error) => {
      const field = error.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(error.message);
    });

    return fieldErrors;
  }

  /**
   * Get first error message for a specific field
   */
  static getFieldError(fieldErrors: Record<string, string[]> | undefined, field: string): string | undefined {
    return fieldErrors?.[field]?.[0];
  }

  /**
   * Check if a field has errors
   */
  static hasFieldError(fieldErrors: Record<string, string[]> | undefined, field: string): boolean {
    return !!fieldErrors?.[field]?.length;
  }
}
