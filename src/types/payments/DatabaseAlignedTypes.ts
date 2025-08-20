// Database-Aligned Types - Type definitions that match the actual Supabase schema

// Student Payment Types (from StudentPaymentTable)
export interface StudentPaymentRow {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_plan: string;
  payment_schedule: Record<string, unknown> | null; // JSON object containing payment schedule
  total_amount_payable: number;
  scholarship_id?: string;
  next_due_date?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Payment Transaction Types (from PaymentTransactionTable)
export interface PaymentTransactionRow {
  id: string;
  payment_id: string;
  transaction_type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  payment_method: 'online' | 'bank_transfer' | 'cash' | 'cheque';
  reference_number: string | null;
  status: 'success' | 'failed' | 'pending';
  notes: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  verification_status:
    | 'pending'
    | 'verification_pending'
    | 'approved'
    | 'rejected'
    | null;
  verified_by: string | null;
  verified_at: string | null;
  receipt_url: string | null;
  proof_of_payment_url: string | null;
  transaction_screenshot_url: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  utr_number: string | null;
  account_number: string | null;
  cheque_number: string | null;
  payer_upi_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  razorpay_signature: string | null;
  qr_code_url: string | null;
  receiver_bank_name: string | null;
  receiver_bank_logo_url: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  payment_date: string | null;
  transfer_date: string | null;
  // Installment tracking fields (added for targeted payments)
  installment_id: string | null;
  semester_number: number | null;
  // User tracking fields
  recorded_by_user_id: string | null; // Who initiated/recorded the payment (student vs admin)
}

// Communication History Types (from CommunicationHistoryTable)
export interface CommunicationHistoryRow {
  id: string;
  student_id: string;
  type: string;
  channel: string;
  subject: string | null;
  message: string;
  sent_at: string;
  status: string;
  created_at: string;
}

// Cohort Student Types (from CohortStudentTable)
export interface CohortStudentRow {
  accepted_at: string | null;
  avatar_url: string | null;
  cohort_id: string;
  created_at: string;
  email: string;
  first_name: string | null;
  id: string;
  invite_status: 'pending' | 'sent' | 'accepted' | 'failed';
  invited_at: string | null;
  last_name: string | null;
  phone: string | null;
  updated_at: string;
  user_id: string | null;
}

// Cohort Scholarship Types (from CohortScholarshipTable)
export interface CohortScholarshipRow {
  id: string;
  cohort_id: string;
  name: string;
  description: string | null;
  amount_percentage: number;
  start_percentage: number;
  end_percentage: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Database Query Result Types
export interface DatabaseQueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

// Student Payment Summary (aligned with actual database structure)
export interface StudentPaymentSummaryRow {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  scholarship_name?: string | null;
  scholarship_id?: string | null;
  token_fee_paid: boolean;
  payment_plan: string;
  student: CohortStudentRow;
  payments: StudentPaymentRow[];
  // Payment engine aggregate status
  aggregate_status?: string;
}

// Utility Types for Database Operations
export type StudentPaymentInsert = Omit<
  StudentPaymentRow,
  'id' | 'created_at' | 'updated_at'
>;
export type PaymentTransactionInsert = Omit<
  PaymentTransactionRow,
  'id' | 'created_at' | 'updated_at'
>;
export type CommunicationHistoryInsert = Omit<
  CommunicationHistoryRow,
  'id' | 'created_at'
>;
export type CohortStudentInsert = Omit<
  CohortStudentRow,
  'id' | 'created_at' | 'updated_at'
>;

export type StudentPaymentUpdate = Partial<
  Omit<StudentPaymentRow, 'id' | 'created_at' | 'updated_at'>
>;
export type PaymentTransactionUpdate = Partial<
  Omit<PaymentTransactionRow, 'id' | 'created_at' | 'updated_at'>
>;
export type CommunicationHistoryUpdate = Partial<
  Omit<CommunicationHistoryRow, 'id' | 'created_at'>
>;
export type CohortStudentUpdate = Partial<
  Omit<CohortStudentRow, 'id' | 'created_at' | 'updated_at'>
>;
