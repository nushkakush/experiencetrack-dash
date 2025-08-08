/**
 * Unit tests for validation utilities
 * Tests validation logic and error handling
 */

import { describe, it, expect } from 'vitest';
import { ValidationUtils } from '@/utils/validation';

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com',
        'UPPERCASE@EXAMPLE.COM',
      ];

      validEmails.forEach(email => {
        expect(ValidationUtils.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example..com',
        '',
        '   ',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationUtils.isValidEmail(email)).toBe(false);
      });
    });

    it('should handle whitespace correctly', () => {
      expect(ValidationUtils.isValidEmail('  test@example.com  ')).toBe(true);
      expect(ValidationUtils.isValidEmail('  ')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongPass123!';
      const errors = ValidationUtils.validatePassword(strongPassword);
      expect(errors).toHaveLength(0);
    });

    it('should detect weak passwords', () => {
      const weakPassword = 'weak';
      const errors = ValidationUtils.validatePassword(weakPassword);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should check minimum length', () => {
      const shortPassword = 'Short1!';
      const errors = ValidationUtils.validatePassword(shortPassword);
      const lengthError = errors.find(error => error.message.includes('8 characters'));
      expect(lengthError).toBeDefined();
    });

    it('should check for lowercase letters', () => {
      const noLowercase = 'UPPERCASE123!';
      const errors = ValidationUtils.validatePassword(noLowercase);
      const lowercaseError = errors.find(error => error.message.includes('lowercase'));
      expect(lowercaseError).toBeDefined();
    });

    it('should check for uppercase letters', () => {
      const noUppercase = 'lowercase123!';
      const errors = ValidationUtils.validatePassword(noUppercase);
      const uppercaseError = errors.find(error => error.message.includes('uppercase'));
      expect(uppercaseError).toBeDefined();
    });

    it('should check for numbers', () => {
      const noNumbers = 'NoNumbers!';
      const errors = ValidationUtils.validatePassword(noNumbers);
      const numberError = errors.find(error => error.message.includes('number'));
      expect(numberError).toBeDefined();
    });

    it('should check for special characters', () => {
      const noSpecialChars = 'NoSpecialChars123';
      const errors = ValidationUtils.validatePassword(noSpecialChars);
      const specialCharError = errors.find(error => error.message.includes('special character'));
      expect(specialCharError).toBeDefined();
    });
  });

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      expect(ValidationUtils.validateRequired('value', 'field')).toBeNull();
      expect(ValidationUtils.validateRequired(0, 'field')).toBeNull();
      expect(ValidationUtils.validateRequired(false, 'field')).toBeNull();
    });

    it('should reject empty values', () => {
      const emptyValues = ['', null, undefined];
      
      emptyValues.forEach(value => {
        const error = ValidationUtils.validateRequired(value, 'testField');
        expect(error).toEqual({
          field: 'testField',
          message: 'testField is required',
        });
      });
    });
  });

  describe('validateLength', () => {
    it('should validate string length within bounds', () => {
      const value = 'test string';
      const errors = ValidationUtils.validateLength(value, 'field', 5, 15);
      expect(errors).toHaveLength(0);
    });

    it('should detect strings that are too short', () => {
      const value = 'test';
      const errors = ValidationUtils.validateLength(value, 'field', 10);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('at least 10 characters');
    });

    it('should detect strings that are too long', () => {
      const value = 'this is a very long string';
      const errors = ValidationUtils.validateLength(value, 'field', 5, 10);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('not exceed 10 characters');
    });

    it('should handle only min length', () => {
      const value = 'test';
      const errors = ValidationUtils.validateLength(value, 'field', 10);
      expect(errors).toHaveLength(1);
    });

    it('should handle only max length', () => {
      const value = 'very long string';
      const errors = ValidationUtils.validateLength(value, 'field', undefined, 5);
      expect(errors).toHaveLength(1);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+1 234 567 8900',
        '(123) 456-7890',
        '123-456-7890',
        '1234567890',
        '+44 20 7946 0958',
      ];

      validPhones.forEach(phone => {
        expect(ValidationUtils.isValidPhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'not-a-phone',
        '+',
        '',
        '   ',
      ];

      invalidPhones.forEach(phone => {
        expect(ValidationUtils.isValidPhone(phone)).toBe(false);
      });
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://example.com?param=value',
        'https://example.com#fragment',
      ];

      validUrls.forEach(url => {
        expect(ValidationUtils.isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'ftp://example.com',
        '',
        '   ',
      ];

      invalidUrls.forEach(url => {
        expect(ValidationUtils.isValidUrl(url)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize input strings', () => {
      const input = '  <script>alert("xss")</script>  ';
      const sanitized = ValidationUtils.sanitizeString(input);
      
      expect(sanitized).toBe('scriptalert("xss")/script');
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    it('should trim whitespace', () => {
      const input = '  test string  ';
      const sanitized = ValidationUtils.sanitizeString(input);
      expect(sanitized).toBe('test string');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(2000);
      const sanitized = ValidationUtils.sanitizeString(longString);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('validateFile', () => {
    it('should validate file size', () => {
      const mockFile = {
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/jpeg',
        name: 'test.jpg',
      } as File;

      const errors = ValidationUtils.validateFile(mockFile, { maxSize: 5 * 1024 * 1024 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('5MB');
    });

    it('should validate file type', () => {
      const mockFile = {
        size: 1024,
        type: 'image/png',
        name: 'test.png',
      } as File;

      const errors = ValidationUtils.validateFile(mockFile, { 
        allowedTypes: ['image/jpeg', 'image/gif'] 
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('image/png');
    });

    it('should validate file extension', () => {
      const mockFile = {
        size: 1024,
        type: 'text/plain',
        name: 'test.txt',
      } as File;

      const errors = ValidationUtils.validateFile(mockFile, { 
        allowedExtensions: ['pdf', 'doc'] 
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('.txt');
    });

    it('should accept valid files', () => {
      const mockFile = {
        size: 1024,
        type: 'image/jpeg',
        name: 'test.jpg',
      } as File;

      const errors = ValidationUtils.validateFile(mockFile, {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg'],
        allowedExtensions: ['jpg'],
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple validation results', () => {
      const result1 = { field: 'email', message: 'Invalid email' };
      const result2 = [
        { field: 'password', message: 'Too short' },
        { field: 'password', message: 'Missing uppercase' },
      ];
      const result3 = null;

      const combined = ValidationUtils.combineValidationResults(result1, result2, result3);
      
      expect(combined).toHaveLength(3);
      expect(combined[0]).toEqual(result1);
      expect(combined[1]).toEqual(result2[0]);
      expect(combined[2]).toEqual(result2[1]);
    });

    it('should handle empty results', () => {
      const combined = ValidationUtils.combineValidationResults(null, [], null);
      expect(combined).toHaveLength(0);
    });
  });
});
