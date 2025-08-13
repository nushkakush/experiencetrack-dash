// Payment Service Types - Comprehensive type definitions for payment service functionality

import { PaymentStatus, PaymentType } from '@/types/fee';
import { 
  StudentPaymentRow,
  PaymentTransactionRow,
  CohortStudentRow,
  CohortScholarshipRow
} from '@/types/payments/DatabaseAlignedTypes';

// Student Types
export interface Student {
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

// Payment Summary Types
export interface PaymentSummary {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  scholarship_name?: string | null;
  scholarship_id?: string | null;
  token_fee_paid: boolean;
  payment_plan: string;
  student: Student;
  payments: StudentPaymentRow[];
}

// Scholarship Types
export interface StudentScholarship {
  id: string;
  student_id: string;
  scholarship_id: string;
  scholarship: {
    id: string;
    name: string;
    amount_percentage: number;
    description: string | null;
  };
  created_at: string;
  updated_at: string;
}

// Payment Status Update Types
export interface PaymentStatusUpdate {
  paymentId: string;
  status: PaymentStatus;
  notes?: string;
}

// Payment Recording Types
export interface PaymentRecord {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

// Payment Service Method Types
export interface PaymentServiceMethods {
  getCohortPayments: (cohortId: string) => Promise<ApiResponse<StudentPaymentRow[]>>;
  getPaymentSummary: (cohortId: string) => Promise<ApiResponse<PaymentSummary[]>>;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus, notes?: string) => Promise<ApiResponse<StudentPaymentRow>>;
  recordPayment: (paymentId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string) => Promise<ApiResponse<PaymentTransactionRow>>;
  getPaymentTransactions: (paymentId: string) => Promise<ApiResponse<PaymentTransactionRow[]>>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Payment Calculation Types
export interface PaymentCalculation {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  tokenFeePaid: boolean;
  paymentPlan: string;
}

// Payment Filter Types
export interface PaymentFilters {
  cohortId?: string;
  studentId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  dateFrom?: string;
  dateTo?: string;
}

// Payment Statistics Types
export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averagePayment: number;
  paymentRate: number;
}

// Payment Summary Calculation Types
export interface PaymentSummaryCalculation {
  student: Student;
  payments: StudentPaymentRow[];
  scholarship?: StudentScholarship;
  calculation: PaymentCalculation;
}

// Utility Types
export type PaymentSummaryUpdate = Partial<PaymentSummary>;
export type PaymentCalculationUpdate = Partial<PaymentCalculation>;
export type PaymentStatisticsUpdate = Partial<PaymentStatistics>;

// Database Query Types
export interface PaymentQueryParams {
  cohortId?: string;
  studentId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Payment Service Configuration Types
export interface PaymentServiceConfig {
  defaultPaymentMethod: string;
  supportedPaymentMethods: string[];
  maxPaymentAmount: number;
  minPaymentAmount: number;
  allowPartialPayments: boolean;
  requireReferenceNumber: boolean;
}
