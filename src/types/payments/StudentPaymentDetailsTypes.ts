// StudentPaymentDetails component types

export interface PaymentMethod {
  name: string;
  description: string;
  icon?: string;
}

export interface PaymentSubmission {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  receiptFile?: File;
  receiptUrl?: string;
  notes?: string;
  submittedAt: Date;
}

export interface OneShotPayment {
  paymentDate: Date;
  amountPayable: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Installment {
  paymentDate: Date;
  amountPayable: number;
  status: 'pending' | 'paid' | 'overdue';
  installmentNumber: number;
}

export interface Semester {
  semesterNumber: number;
  instalments: Installment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface PaymentBreakdown {
  oneShotPayment?: OneShotPayment;
  semesters?: Semester[];
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalScholarship: number;
    totalAmountPayable: number;
  };
}

export interface StudentData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  user_id: string;
}

export interface CohortData {
  id: string;
  name: string;
  course_name: string;
  start_date: string;
  end_date: string;
  cohort_id: string;
}

export interface FeeStructure {
  id: string;
  total_program_fee: number;
  admission_fee: number;
  semesters: number;
  instalments_per_semester: number;
  one_shot_discount: number;
}
