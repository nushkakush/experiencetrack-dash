// Payment calculation related types

export interface FeeStructure {
  total_program_fee: string | number;
  admission_fee: string | number;
  semesters: number;
  instalments_per_semester: number;
  one_shot_discount: number;
}

export interface Scholarship {
  id: string;
  student_id: string;
  amount: number;
  type: 'percentage' | 'fixed';
  description?: string;
}

export interface StudentPayment {
  id: string;
  student_id: string;
  payment_plan?: string;
  amount_payable: number;
  amount_paid: number;
  status: string;
  payment_type: string;
}

export interface AdmissionFeeBreakdown {
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  totalPayable: number;
}

export interface SemesterBreakdown {
  semesterNumber: number;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  totalPayable: number;
  instalments: InstallmentBreakdown[];
}

export interface InstallmentBreakdown {
  installmentNumber: number;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  totalPayable: number;
  paymentDate: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export interface OverallSummary {
  totalProgramFee: number;
  admissionFee: number;
  totalGST: number;
  totalDiscount: number;
  totalScholarship: number;
  totalAmountPayable: number;
}

export interface OneShotPaymentBreakdown {
  paymentDate: string;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
}

export interface PaymentBreakdown {
  admissionFee: AdmissionFeeBreakdown;
  semesters: SemesterBreakdown[];
  oneShotPayment?: OneShotPaymentBreakdown;
  overallSummary: OverallSummary;
}

export type PaymentPlan = 'not_selected' | 'one_shot' | 'sem_wise' | 'instalment_wise';
