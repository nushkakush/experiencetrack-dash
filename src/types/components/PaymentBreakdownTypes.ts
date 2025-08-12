// Payment Breakdown Types - Comprehensive type definitions for payment breakdown components

// Payment Breakdown Structure Types
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
  installmentKey: string;
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

// Payment Breakdown Component Props Types
export interface PaymentBreakdownSectionProps {
  paymentBreakdown: PaymentBreakdown;
  expandedSemesters: Set<number>;
  expandedInstallments: Set<string>;
  onToggleSemester: (semesterNumber: number) => void;
  onToggleInstallment: (installmentKey: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export interface SemesterCardProps {
  semester: SemesterBreakdown;
  expanded: boolean;
  onToggle: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export interface InstalmentItemProps {
  instalment: Instalment;
  expanded: boolean;
  onToggle: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

// Payment Status Types
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface PaymentStatusConfig {
  status: PaymentStatus;
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Payment Summary Types
export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  completionPercentage: number;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  overdueInstallments: number;
}

export interface PaymentSummaryCardProps {
  summary: PaymentSummary;
  formatCurrency: (amount: number) => string;
}

// Payment Breakdown Calculation Types
export interface PaymentBreakdownCalculation {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  semesters: SemesterCalculation[];
}

export interface SemesterCalculation {
  semesterNumber: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  instalments: InstalmentCalculation[];
}

export interface InstalmentCalculation {
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  isOverdue: boolean;
  dueDate: string;
  paidDate?: string;
}

// Payment Breakdown Display Types
export interface PaymentBreakdownDisplay {
  showSemesters: boolean;
  showInstallments: boolean;
  showOneShot: boolean;
  expandedSemesters: Set<number>;
  expandedInstallments: Set<string>;
}

export interface PaymentBreakdownDisplayProps {
  display: PaymentBreakdownDisplay;
  onToggleSemester: (semesterNumber: number) => void;
  onToggleInstallment: (installmentKey: string) => void;
}

// Payment Breakdown Action Types
export interface PaymentBreakdownActions {
  onInstallmentClick: (instalment: Instalment, semesterNumber: number, installmentIndex: number) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  onToggleSemester: (semesterNumber: number) => void;
  onToggleInstallment: (installmentKey: string) => void;
}

// Payment Submission Types
export interface PaymentSubmissionData {
  studentId: string;
  cohortId: string;
  paymentType: string;
  paymentPlan: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  receiptFile?: File;
  installmentId?: string;
  semesterNumber?: number;
}

// Utility Types
export type PaymentBreakdownUpdate = Partial<PaymentBreakdown>;
export type SemesterBreakdownUpdate = Partial<SemesterBreakdown>;
export type InstalmentUpdate = Partial<Instalment>;
export type PaymentSummaryUpdate = Partial<PaymentSummary>;

// Payment Breakdown Event Types
export interface PaymentBreakdownEvents {
  onSemesterToggle: (semesterNumber: number) => void;
  onInstallmentToggle: (installmentKey: string) => void;
  onInstallmentClick: (instalment: Instalment, semesterNumber: number, installmentIndex: number) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

// Payment Breakdown Configuration Types
export interface PaymentBreakdownConfig {
  showSemesterDetails: boolean;
  showInstallmentDetails: boolean;
  showPaymentActions: boolean;
  allowPartialPayments: boolean;
  maxDisplayedInstallments: number;
  currencyFormat: string;
  dateFormat: string;
}

// Payment Breakdown State Types
export interface PaymentBreakdownState {
  expandedSemesters: Set<number>;
  expandedInstallments: Set<string>;
  selectedInstalment: Instalment | null;
  isSubmitting: boolean;
  error: string | null;
}
