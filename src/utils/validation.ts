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
  static validateRequired(value: any, fieldName: string): ValidationError | null {
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
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.trim());
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
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

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
  static combineValidationResults(...results: (ValidationError | ValidationError[] | null)[]): ValidationError[] {
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