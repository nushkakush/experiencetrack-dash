/**
 * Payment Breakdown Types
 * Defines the structure of payment breakdown data used throughout the application
 */

export interface Installment {
  id: string;
  semesterNumber: number;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  amountPaid: number;
  amountRemaining: number;
  isOverdue: boolean;
  scholarshipApplied?: number;
  originalAmount: number;
}

export interface Semester {
  semesterNumber: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  installments: Installment[];
  scholarshipApplied?: number;
  originalAmount: number;
}

export interface AdmissionFee {
  baseAmount: number;
  gstAmount: number;
  totalPayable: number;
}

export interface OverallSummary {
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  totalScholarship: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
}

export interface PaymentBreakdown {
  totalProgramFee: number;
  totalPaid: number;
  totalRemaining: number;
  totalScholarship: number;
  paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise';
  semesters: Semester[];
  admissionFee: AdmissionFee;
  overallSummary: OverallSummary;
  nextDueDate?: string;
  nextDueAmount?: number;
  overallStatus: 'pending' | 'paid' | 'overdue' | 'partial';
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank_transfer' | 'cash' | 'razorpay' | 'other';
  isActive: boolean;
  requiresReference?: boolean;
  requiresFileUpload?: boolean;
}

export interface PaymentSubmissionData {
  installmentId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  fileUpload?: File;
}

export interface PaymentData {
  studentId: string;
  cohortId: string;
  paymentType: string;
  paymentPlan: string;
  amountPayable: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  notes?: string;
}

export interface StudentPaymentData {
  id: string;
  studentId: string;
  cohortId: string;
  paymentType: string;
  paymentPlan: string;
  amountPayable: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CohortData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  sessionsPerDay: number;
}

export interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  inviteStatus: 'pending' | 'sent' | 'accepted' | 'failed';
  acceptedAt?: string;
}

export interface FeeStructureData {
  id: string;
  cohortId: string;
  totalProgramFee: number;
  admissionFee: number;
  numberOfSemesters: number;
  installmentsPerSemester: number;
  oneShotDiscountPercentage: number;
  isSetupComplete: boolean;
}

export interface ScholarshipData {
  id: string;
  name: string;
  description?: string;
  amountPercentage: number;
  startPercentage: number;
  endPercentage: number;
  isActive: boolean;
}
