// Payment Store Types - Comprehensive type definitions for payment state management

import { PaymentPlan, PaymentStatus } from '@/types/fee';

// Payment Submission Types
export interface PaymentSubmission {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  receiptFile?: File;
  receiptUrl?: string;
  notes?: string;
  submittedAt: Date;
  status: 'pending' | 'submitted' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Payment Breakdown Types
export interface PaymentBreakdownItem {
  id: string;
  type: 'admission_fee' | 'semester_fee' | 'installment_fee';
  amountPayable: number;
  amountPaid: number;
  dueDate: Date;
  status: PaymentStatus;
  description: string;
}

export interface SemesterBreakdown {
  semesterNumber: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  instalments: PaymentBreakdownItem[];
}

export interface PaymentBreakdown {
  admissionFee: PaymentBreakdownItem;
  semesters: SemesterBreakdown[];
  totalProgramFee: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

// Payment Method Types
export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isEnabled: boolean;
  requiresFields: string[];
  validationRules?: Record<string, any>;
}

// Payment Store State Interface
export interface PaymentState {
  // Payment plan selection
  selectedPaymentPlan: PaymentPlan;
  setSelectedPaymentPlan: (plan: PaymentPlan) => void;
  
  // Payment submissions
  paymentSubmissions: Map<string, PaymentSubmission>;
  submittingPayments: Set<string>;
  addPaymentSubmission: (paymentId: string, submission: PaymentSubmission) => void;
  updatePaymentSubmission: (paymentId: string, updates: Partial<PaymentSubmission>) => void;
  removePaymentSubmission: (paymentId: string) => void;
  setSubmittingPayment: (paymentId: string, isSubmitting: boolean) => void;
  
  // Payment breakdown
  paymentBreakdown: PaymentBreakdown | null;
  setPaymentBreakdown: (breakdown: PaymentBreakdown) => void;
  
  // Expanded sections
  expandedSemesters: Set<number>;
  expandedInstallments: Set<string>;
  toggleSemester: (semesterNumber: number) => void;
  toggleInstallment: (installmentKey: string) => void;
  
  // Payment methods
  paymentMethods: PaymentMethod[];
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error states
  error: string | null;
  setError: (error: string | null) => void;
  
  // Reset store
  reset: () => void;
}

// Payment Store Actions Interface
export interface PaymentStoreActions {
  setSelectedPaymentPlan: (plan: PaymentPlan) => void;
  addPaymentSubmission: (paymentId: string, submission: PaymentSubmission) => void;
  updatePaymentSubmission: (paymentId: string, updates: Partial<PaymentSubmission>) => void;
  removePaymentSubmission: (paymentId: string) => void;
  setSubmittingPayment: (paymentId: string, isSubmitting: boolean) => void;
  setPaymentBreakdown: (breakdown: PaymentBreakdown) => void;
  toggleSemester: (semesterNumber: number) => void;
  toggleInstallment: (installmentKey: string) => void;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Payment Store Selectors Interface
export interface PaymentStoreSelectors {
  selectedPaymentPlan: PaymentPlan;
  paymentSubmissions: Map<string, PaymentSubmission>;
  submittingPayments: Set<string>;
  paymentBreakdown: PaymentBreakdown | null;
  expandedSemesters: Set<number>;
  expandedInstallments: Set<string>;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
}

// Utility Types
export type PaymentSubmissionUpdate = Partial<PaymentSubmission>;
export type PaymentMethodUpdate = Partial<PaymentMethod>;
export type PaymentBreakdownUpdate = Partial<PaymentBreakdown>;
