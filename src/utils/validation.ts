/**
 * Validation utilities with enterprise-level error handling
 * Centralized validation logic for forms and data processing
 */

import { ValidationError } from '@/types/common';

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  }

  /**
   * Validate email domain for signup (any domain allowed)
   */
  static isValidSignupEmail(email: string): boolean {
    const trimmedEmail = email.trim().toLowerCase();

    // Check if it's a valid email format
    return this.isValidEmail(trimmedEmail);
  }

  /**
   * Check if email is from litschool.in domain
   */
  static isLitschoolEmail(email: string): boolean {
    const trimmedEmail = email.trim().toLowerCase();
    return trimmedEmail.endsWith('@litschool.in');
  }

  /**
   * Get email domain validation error message
   */
  static getEmailDomainError(): string {
    return 'Please enter a valid email address';
  }

  /**
   * Get litschool domain requirement message
   */
  static getLitschoolDomainMessage(): string {
    return 'Only @litschool.in email addresses have full dashboard access';
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter',
      });
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter',
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number',
      });
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one special character',
      });
    }

    return errors;
  }

  /**
   * Validate required fields
   */
  static validateRequired(
    value: unknown,
    fieldName: string
  ): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
      };
    }
    return null;
  }

  /**
   * Validate string length
   */
  static validateLength(
    value: string,
    fieldName: string,
    min?: number,
    max?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (min !== undefined && value.length < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters long`,
      });
    }

    if (max !== undefined && value.length > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${max} characters`,
      });
    }

    return errors;
  }

  /**
   * Validate phone number format (Indian format)
   */
  static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Check for Indian phone number format: +91 followed by 10 digits, or just 10 digits
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Validate Indian postal code format
   */
  static isValidPostalCode(postalCode: string): boolean {
    const postalRegex = /^[1-9][0-9]{5}$/;
    return postalRegex.test(postalCode.trim());
  }

  /**
   * Validate CIBIL score (300-900)
   */
  static isValidCibilScore(score: string): boolean {
    const numScore = parseInt(score);
    return !isNaN(numScore) && numScore >= 300 && numScore <= 900;
  }

  /**
   * Validate loan amount (positive number)
   */
  static isValidLoanAmount(amount: string): boolean {
    // Remove currency symbols and commas
    const cleaned = amount.replace(/[₹,\s]/g, '');
    const numAmount = parseFloat(cleaned);
    return !isNaN(numAmount) && numAmount > 0;
  }

  /**
   * Validate age from date of birth (minimum age)
   */
  static isValidAge(
    day: string,
    month: string,
    year: string,
    minAge: number = 16
  ): boolean {
    if (!day || !month || !year) return false;

    const birthDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1 >= minAge;
    }

    return age >= minAge;
  }

  /**
   * Validate graduation year (not in future, not too old)
   */
  static isValidGraduationYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year <= currentYear && year >= currentYear - 50;
  }

  /**
   * Validate work experience date range
   */
  static isValidWorkDateRange(
    startYear: number,
    startMonth: string,
    endYear?: number,
    endMonth?: string
  ): boolean {
    if (!endYear || !endMonth) return true; // Current job

    const startDate = new Date(startYear, parseInt(startMonth) - 1);
    const endDate = new Date(endYear, parseInt(endMonth) - 1);

    return endDate >= startDate;
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate file upload
   */
  static validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const {
      maxSize = 5 * 1024 * 1024,
      allowedTypes = [],
      allowedExtensions = [],
    } = options;

    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`,
      });
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        message: `File type ${file.type} is not allowed`,
      });
    }

    if (allowedExtensions.length > 0) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push({
          field: 'file',
          message: `File extension .${extension} is not allowed`,
        });
      }
    }

    return errors;
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(
    ...results: (ValidationError | ValidationError[] | null)[]
  ): ValidationError[] {
    const allErrors: ValidationError[] = [];

    results.forEach(result => {
      if (result === null) return;
      if (Array.isArray(result)) {
        allErrors.push(...result);
      } else {
        allErrors.push(result);
      }
    });

    return allErrors;
  }
}
