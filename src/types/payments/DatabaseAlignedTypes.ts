// Database-Aligned Types - Type definitions that match the actual Supabase schema

// Student Payment Types (from StudentPaymentTable)
export interface StudentPaymentRow {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_type: string;
  payment_plan: string;
  amount_payable: number;
  amount_paid: number;
  due_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Payment Transaction Types (from PaymentTransactionTable)
export interface PaymentTransactionRow {
  id: string;
  payment_id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  invite_status: "pending" | "sent" | "accepted" | "failed";
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
  error: any;
}

// Student Payment Summary (aligned with actual database structure)
export interface StudentPaymentSummaryRow {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  scholarship_name?: string | null;
  scholarship_percentage?: number | null;
  token_fee_paid: boolean;
  payment_plan: string;
  student: CohortStudentRow;
  payments: StudentPaymentRow[];
}

// Utility Types for Database Operations
export type StudentPaymentInsert = Omit<StudentPaymentRow, 'id' | 'created_at' | 'updated_at'>;
export type PaymentTransactionInsert = Omit<PaymentTransactionRow, 'id' | 'created_at' | 'updated_at'>;
export type CommunicationHistoryInsert = Omit<CommunicationHistoryRow, 'id' | 'created_at'>;
export type CohortStudentInsert = Omit<CohortStudentRow, 'id' | 'created_at' | 'updated_at'>;

export type StudentPaymentUpdate = Partial<Omit<StudentPaymentRow, 'id' | 'created_at' | 'updated_at'>>;
export type PaymentTransactionUpdate = Partial<Omit<PaymentTransactionRow, 'id' | 'created_at' | 'updated_at'>>;
export type CommunicationHistoryUpdate = Partial<Omit<CommunicationHistoryRow, 'id' | 'created_at'>>;
export type CohortStudentUpdate = Partial<Omit<CohortStudentRow, 'id' | 'created_at' | 'updated_at'>>;
