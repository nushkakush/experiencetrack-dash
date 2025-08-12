// Payment Form Types - Comprehensive type definitions for payment form functionality

import { PaymentPlan } from '@/types/fee';
import { 
  PaymentBreakdown, 
  PaymentSubmission 
} from '@/types/payments/PaymentStoreTypes';

// Student Data Types
export interface StudentData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  user_id: string;
  cohort_id: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Installment Types
export interface Installment {
  id: string;
  installmentNumber: number;
  amountPayable: number;
  amountPaid: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  description: string;
}

export interface SemesterInstallment {
  semesterNumber: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  instalments: Installment[];
}

// Payment Form Props Interface
export interface UsePaymentFormProps {
  selectedInstallment?: Installment;
  paymentBreakdown?: PaymentBreakdown;
  selectedPaymentPlan?: PaymentPlan;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  studentData: StudentData;
}

// Payment Details Types
export interface PaymentDetails {
  [key: string]: string | number | boolean;
}

export interface UploadedFiles {
  [key: string]: File | null;
}

export interface FormErrors {
  [key: string]: string;
}

// Payment Submission Data
export interface PaymentSubmissionData {
  studentId: string;
  cohortId: string;
  amount: number;
  paymentMode: string;
  paymentDetails: PaymentDetails;
  uploadedFiles: UploadedFiles;
  installmentId?: string;
  paymentPlan: PaymentPlan;
  timestamp: string;
}

// Payment Form State Interface
export interface PaymentFormState {
  selectedPaymentMode: string;
  amountToPay: number;
  paymentDetails: PaymentDetails;
  uploadedFiles: UploadedFiles;
  errors: FormErrors;
  maxAmount: number;
}

// Payment Form Actions Interface
export interface PaymentFormActions {
  setSelectedPaymentMode: (mode: string) => void;
  setAmountToPay: (amount: number) => void;
  setPaymentDetails: (details: PaymentDetails) => void;
  setUploadedFiles: (files: UploadedFiles) => void;
  setErrors: (errors: FormErrors) => void;
  handleAmountChange: (value: string) => void;
  handlePaymentModeChange: (mode: string) => void;
  handleFieldChange: (fieldName: string, value: string | number | boolean) => void;
  handleFileUpload: (fieldName: string, file: File | null) => void;
  handleSubmit: () => void;
  validateForm: () => boolean;
  getPaymentModeConfig: () => any; // Will be properly typed when PaymentModeConfig is updated
  formatCurrency: (amount: number) => string;
}

// Payment Form Return Interface
export interface UsePaymentFormReturn extends PaymentFormState, PaymentFormActions {}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

// Payment Mode Configuration Types
export interface PaymentModeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'file';
  required: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
  };
}

export interface PaymentModeConfig {
  name: string;
  description: string;
  icon?: string;
  fields: PaymentModeField[];
  requiresFiles: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
}

// Utility Types
export type PaymentFormUpdate = Partial<PaymentFormState>;
export type PaymentDetailsUpdate = Partial<PaymentDetails>;
export type UploadedFilesUpdate = Partial<UploadedFiles>;
export type FormErrorsUpdate = Partial<FormErrors>;
