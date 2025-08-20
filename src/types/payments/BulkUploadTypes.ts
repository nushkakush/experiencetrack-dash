/**
 * Bulk Upload Types for Scholarships and Payment Plans
 */

import { PaymentPlan } from './PaymentPlans';

// Bulk Scholarship Upload Types
export interface BulkScholarshipUpload {
  student_email: string;
  scholarship_name: string;
  additional_discount_percentage?: number;
  description?: string;
}

export interface BulkScholarshipUploadResult {
  student_id: string;
  scholarship_id: string;
  additional_discount_percentage: number;
  success: boolean;
  error?: string;
}

// Bulk Payment Plan Upload Types
export interface BulkPaymentPlanUpload {
  student_email: string;
  payment_plan: PaymentPlan;
  custom_dates?: Record<string, string>; // For custom payment schedules
}

export interface BulkPaymentPlanUploadResult {
  student_id: string;
  payment_plan: PaymentPlan;
  success: boolean;
  error?: string;
}

// Validation and Processing Results
export interface BulkUploadValidationResult<T> {
  valid: T[];
  invalid: Array<{
    data: any;
    errors: string[];
    row: number;
  }>;
  duplicates?: Array<{
    data: T;
    row: number;
    existingData?: any;
  }>;
}

// Configuration for bulk upload operations
export interface BulkUploadOperationConfig {
  cohortId: string;
  allowOverwrite: boolean;
  sendNotifications: boolean;
  customDateValidation?: boolean;
}
