import { CohortStudent } from './cohort';

export interface FeeStructure {
  id: string;
  cohort_id: string;
  admission_fee: number;
  total_program_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Scholarship {
  id: string;
  cohort_id: string;
  name: string;
  description?: string;
  start_percentage: number;
  end_percentage: number;
  amount_percentage: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NewFeeStructureInput {
  cohort_id: string;
  admission_fee: number;
  total_program_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
}

export interface NewScholarshipInput {
  cohort_id: string;
  name: string;
  description?: string;
  start_percentage: number;
  end_percentage: number;
  amount_percentage: number;
}

export type PaymentPlan = 'one_shot' | 'sem_wise' | 'instalment_wise';

export interface FeeCalculation {
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  totalPayable: number;
}

export interface PaymentBreakdown {
  paymentDate: string;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
}

export interface SemesterBreakdown {
  semesterNumber: number;
  instalments: PaymentBreakdown[];
  total: FeeCalculation;
}

export interface FeeStructureReview {
  admissionFee: FeeCalculation;
  semesters: SemesterBreakdown[];
  oneShotPayment?: PaymentBreakdown | null;
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalAmountPayable: number;
  };
}

export interface StudentScholarship {
  id: string;
  student_id: string;
  scholarship_id: string;
  additional_discount_percentage: number;
  assigned_by?: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  scholarship?: Scholarship;
  student?: CohortStudent;
}

export interface NewStudentScholarshipInput {
  student_id: string;
  scholarship_id: string;
  additional_discount_percentage?: number;
}

export interface StudentScholarshipWithDetails extends StudentScholarship {
  scholarship: Scholarship;
  student: CohortStudent;
}

// New types for payment tracking
export type PaymentStatus = 
  | 'pending' 
  | 'pending_10_plus_days' 
  | 'verification_pending' 
  | 'paid' 
  | 'overdue' 
  | 'not_setup' 
  | 'awaiting_bank_approval_e_nach' 
  | 'awaiting_bank_approval_physical_mandate' 
  | 'setup_request_failed_e_nach' 
  | 'setup_request_failed_physical_mandate' 
  | 'on_time' 
  | 'failed_5_days_left' 
  | 'complete' 
  | 'dropped' 
  | 'upcoming' 
  | 'partially_paid_verification_pending' 
  | 'partially_paid_days_left' 
  | 'partially_paid_overdue';

export type PaymentType = 'admission_fee' | 'instalments' | 'one_shot' | 'sem_plan';

export interface StudentPayment {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_type: PaymentType;
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
  payment_date?: string;
  status: PaymentStatus;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  student?: CohortStudent;
  scholarship?: StudentScholarship;
}

export interface StudentPaymentSummary {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  scholarship_name?: string;
  scholarship_percentage?: number;
  token_fee_paid: boolean;
  payment_plan: PaymentPlan;
  // Joined fields
  student?: CohortStudent;
  payments?: StudentPayment[];
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  transaction_type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  payment_method: 'online' | 'bank_transfer' | 'cash' | 'cheque';
  reference_number?: string;
  status: 'success' | 'failed' | 'pending';
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface CommunicationHistory {
  id: string;
  student_id: string;
  type: 'reminder' | 'receipt' | 'notification';
  channel: 'email' | 'whatsapp' | 'sms';
  subject: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed';
  created_by?: string;
}
