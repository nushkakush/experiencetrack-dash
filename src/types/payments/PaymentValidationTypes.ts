// Payment Validation Types - Comprehensive type definitions for payment validation functionality

import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';

// Validation Result Types
export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentPlanValidation {
  isValid: boolean;
  errors: string[];
  recommendations: string[];
}

// Fee Structure Types
export interface FeeStructure {
  id: string;
  cohort_id: string;
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Student Data Types
export interface StudentData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  cohort_id: string;
  user_id: string | null;
  invite_status: "pending" | "sent" | "accepted" | "failed";
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Payment Submission Types
export interface PaymentSubmission {
  studentId: string;
  cohortId: string;
  paymentType: string;
  paymentPlan: PaymentPlan;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  receiptFile?: File;
  installmentId?: string;
  semesterNumber?: number;
}

// Scholarship Types
export interface Scholarship {
  id: string;
  name: string;
  description: string | null;
  amount_percentage: number;
  start_percentage: number;
  end_percentage: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentScholarship {
  id: string;
  student_id: string;
  scholarship_id: string;
  scholarship: Scholarship;
  created_at: string;
  updated_at: string;
}

// Payment Validation Method Types
export interface PaymentValidationMethods {
  validatePayment: (payment: Partial<StudentPaymentRow>) => PaymentValidationResult;
  validatePaymentPlan: (paymentPlan: PaymentPlan, feeStructure: FeeStructure, studentData: StudentData) => PaymentPlanValidation;
  validatePaymentSubmission: (submission: PaymentSubmission) => PaymentValidationResult;
  validateScholarshipAssignment: (scholarshipId: string, studentId: string, existingScholarships: StudentScholarship[]) => PaymentValidationResult;
}

// Payment Plan Validation Types
export interface PaymentPlanValidationContext {
  feeStructure: FeeStructure;
  studentData: StudentData;
  existingPayments?: StudentPaymentRow[];
  existingScholarships?: StudentScholarship[];
}

// Payment Amount Validation Types
export interface PaymentAmountValidation {
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
  amountPaid: number;
  isValid: boolean;
  errors: string[];
}

// Date Validation Types
export interface DateValidation {
  dueDate: string;
  paymentDate?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Status Validation Types
export interface StatusValidation {
  status: PaymentStatus;
  isValid: boolean;
  errors: string[];
  allowedTransitions: PaymentStatus[];
}

// Validation Configuration Types
export interface ValidationConfig {
  allowNegativeAmounts: boolean;
  allowPastDueDates: boolean;
  requireReferenceNumber: boolean;
  maxPaymentAmount: number;
  minPaymentAmount: number;
  supportedPaymentMethods: string[];
  supportedPaymentPlans: PaymentPlan[];
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  recommendation?: string;
}

// Utility Types
export type PaymentValidationUpdate = Partial<PaymentValidationResult>;
export type PaymentPlanValidationUpdate = Partial<PaymentPlanValidation>;
export type ValidationConfigUpdate = Partial<ValidationConfig>;

// Validation Rule Types
export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  payment: ValidationRule[];
  paymentPlan: ValidationRule[];
  paymentSubmission: ValidationRule[];
  scholarship: ValidationRule[];
}
