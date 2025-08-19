// Payment Form Types - Comprehensive type definitions for payment form components

import { PaymentPlan } from '@/types/fee';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';

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
  invite_status: 'pending' | 'sent' | 'accepted' | 'failed';
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Payment Breakdown Types
export interface PaymentBreakdown {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  semesters?: SemesterBreakdown[];
  oneShotPayment?: OneShotPayment;
  instalmentPayments?: InstalmentPayment[];
}

export interface SemesterBreakdown {
  semesterNumber: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  instalments: Instalment[];
}

export interface Instalment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAmount: number;
  paidDate?: string;
}

export interface OneShotPayment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAmount: number;
  paidDate?: string;
  discountPercentage: number;
}

export interface InstalmentPayment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAmount: number;
  paidDate?: string;
}

// Payment Submission Types
export interface PaymentSubmissionData {
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

// Payment Form Props Types
export interface PaymentFormProps {
  paymentSubmissions: Map<string, PaymentSubmissionData>;
  submittingPayments: Set<string>;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  studentData: StudentData;
  selectedPaymentPlan?: PaymentPlan;
  paymentBreakdown?: PaymentBreakdown;
  selectedInstallment?: Instalment;
  isAdminMode?: boolean; // Flag for admin mode to show additional fields
}

// Payment Mode Types
export interface PaymentModeConfig {
  name: string;
  fields: PaymentModeField[];
  requiredFiles: string[];
  description?: string;
}

export interface PaymentModeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: PaymentModeFieldOption[];
  validation?: PaymentModeFieldValidation;
}

export interface PaymentModeFieldOption {
  value: string;
  label: string;
}

export interface PaymentModeFieldValidation {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

// Payment Details Types
export interface PaymentDetails {
  [key: string]: string | number | boolean | null;
}

export interface UploadedFiles {
  [key: string]: File | null;
}

export interface FormErrors {
  [key: string]: string;
}

// Payment Form State Types
export interface PaymentFormState {
  selectedPaymentMode: string;
  amountToPay: number;
  paymentDetails: PaymentDetails;
  uploadedFiles: UploadedFiles;
  errors: FormErrors;
  maxAmount: number;
}

// Payment Form Actions Types
export interface PaymentFormActions {
  handlePaymentModeChange: (mode: string) => void;
  handleAmountChange: (amount: number) => void;
  handleFieldChange: (
    fieldName: string,
    value: string | number | boolean
  ) => void;
  handleFileUpload: (fieldName: string, file: File | null) => void;
  handleSubmit: () => Promise<void>;
  getPaymentModeConfig: () => PaymentModeConfig | null;
}

// Payment Form Hook Return Types
export interface UsePaymentFormReturn
  extends PaymentFormState,
    PaymentFormActions {}

export interface UsePaymentFormProps {
  selectedInstallment?: Instalment;
  paymentBreakdown?: PaymentBreakdown;
  selectedPaymentPlan?: PaymentPlan;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  studentData: StudentData;
  isAdminMode?: boolean;
}

// Payment Form Validation Types
export interface PaymentFormValidation {
  isValid: boolean;
  errors: FormErrors;
  warnings: string[];
}

// Payment Form Submission Types
export interface PaymentFormSubmission {
  data: PaymentSubmissionData;
  validation: PaymentFormValidation;
  isSubmitting: boolean;
}

// Utility Types
export type PaymentFormPropsUpdate = Partial<PaymentFormProps>;
export type PaymentFormStateUpdate = Partial<PaymentFormState>;
export type PaymentDetailsUpdate = Partial<PaymentDetails>;
export type UploadedFilesUpdate = Partial<UploadedFiles>;
export type FormErrorsUpdate = Partial<FormErrors>;

// Payment Form Event Types
export interface PaymentFormEvents {
  onModeChange: (mode: string) => void;
  onAmountChange: (amount: number) => void;
  onFieldChange: (fieldName: string, value: string | number | boolean) => void;
  onFileUpload: (fieldName: string, file: File | null) => void;
  onSubmit: (data: PaymentSubmissionData) => void;
  onCancel: () => void;
}

// Payment Form Configuration Types
export interface PaymentFormConfig {
  allowPartialPayments: boolean;
  requireReferenceNumber: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  supportedPaymentModes: string[];
  defaultPaymentMode?: string;
}
