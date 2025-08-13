// Student Payment Types - Comprehensive type definitions for student payment functionality

import { PaymentPlan, PaymentStatus } from '@/types/fee';

// Student Types
export interface Student {
  id: string;
  email: string;
  phone?: string;
  user_id: string;
  cohort_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  invited_at?: string;
  accepted_at?: string;
  invite_status: 'pending' | 'accepted' | 'expired';
  invited_by?: string;
  invitation_token?: string;
  invitation_expires_at?: string;
}

// Student Payment Types
export interface StudentPayment {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_type: 'admission_fee' | 'semester_fee' | 'installment_fee' | 'other';
  payment_plan?: PaymentPlan;
  installment_number?: number;
  semester_number?: number;
  base_amount: number;
  scholarship_amount: number;
  discount_amount: number;
  gst_amount: number;
  amount_payable: number;
  amount_paid: number;
  due_date: string;
  payment_date?: string;
  status: PaymentStatus;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_amount_paid: number;
  remaining_amount: number;
  partial_payment_count: number;
  last_payment_date?: string;
  payment_completion_percentage: number;
  student?: Student;
}

// Payment Transaction Types
export interface PaymentTransaction {
  id: string;
  payment_id: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'razorpay' | 'other';
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  receipt_url?: string;
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

// Communication History Types
export interface CommunicationHistory {
  id: string;
  student_id: string;
  type: 'payment_reminder' | 'payment_confirmation' | 'general' | 'urgent';
  channel: 'email' | 'sms' | 'whatsapp' | 'in_app';
  subject: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Scholarship Types
export interface Scholarship {
  id: string;
  student_id: string;
  scholarship_id: string;
  amount_percentage: number;
  amount_fixed?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  scholarship?: {
    id: string;
    name: string;
    amount_percentage: number;
    amount_fixed?: number;
    description?: string;
    created_at: string;
    updated_at: string;
  };
}

// Student Payment Summary Types
export interface StudentPaymentSummary {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  scholarship_name?: string;
  scholarship_id?: string;
  token_fee_paid: boolean;
  payment_plan: PaymentPlan;
  student: Student;
  payments: StudentPayment[];
}

// Payment Plan Update Types
export interface PaymentPlanUpdate {
  studentId: string;
  cohortId: string;
  paymentPlan: PaymentPlan;
  scholarshipId?: string;
  forceUpdate: boolean;
}

export interface PaymentPlanUpdateResult {
  success: boolean;
  message: string;
}

// Payment Record Types
export interface PaymentRecord {
  student_id: string;
  cohort_id: string;
  payment_type: string;
  payment_plan: PaymentPlan;
  installment_number?: number;
  semester_number?: number;
  base_amount: number;
  scholarship_amount: number;
  discount_amount: number;
  gst_amount: number;
  amount_payable: number;
  amount_paid: number;
  due_date: string;
  status: PaymentStatus;
  receipt_url?: string;
  notes?: string;
  reference_number?: string;
  payment_method: string;
  submitted_by: string;
  submitted_at: string;
}

// Transaction Record Types
export interface TransactionRecord {
  payment_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  status: string;
  notes?: string;
  receipt_url?: string;
  submitted_by: string;
  submitted_at: string;
}

// Utility Types
export type StudentPaymentUpdate = Partial<StudentPayment>;
export type PaymentTransactionUpdate = Partial<PaymentTransaction>;
export type CommunicationHistoryUpdate = Partial<CommunicationHistory>;
export type ScholarshipUpdate = Partial<Scholarship>;
export type StudentPaymentSummaryUpdate = Partial<StudentPaymentSummary>;

// Database Query Result Types
export interface StudentPaymentQueryResult {
  data: StudentPayment[] | null;
  error: any;
}

export interface PaymentTransactionQueryResult {
  data: PaymentTransaction[] | null;
  error: any;
}

export interface CommunicationHistoryQueryResult {
  data: CommunicationHistory[] | null;
  error: any;
}

export interface ScholarshipQueryResult {
  data: Scholarship[] | null;
  error: any;
}
