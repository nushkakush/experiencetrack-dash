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
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalAmountPayable: number;
  };
}
