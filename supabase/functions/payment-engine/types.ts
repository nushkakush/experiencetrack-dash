// Types for the payment engine
export type Action =
  | 'breakdown'
  | 'status'
  | 'full'
  | 'partial_calculation'
  | 'admin_partial_approval'
  | 'partial_config';

export type PaymentPlan = 'one_shot' | 'sem_wise' | 'instalment_wise';

export type EdgeRequest = {
  action?: Action;
  studentId?: string;
  cohortId?: string;
  paymentPlan?: PaymentPlan;
  scholarshipId?: string | null;
  scholarshipData?: {
    // For temporary scholarships in preview mode
    id: string;
    amount_percentage: number;
    name: string;
  } | null;
  additionalDiscountPercentage?: number;
  // startDate removed - dates come from database only
  customDates?: Record<string, string>; // For preview with custom dates
  // Partial payment specific fields
  installmentId?: string;
  approvedAmount?: number;
  transactionId?: string;
  approvalType?: 'full' | 'partial' | 'reject';
  adminNotes?: string;
  rejectionReason?: string;
  allowPartialPayments?: boolean;
  feeStructureData?: {
    // For preview mode when no saved structure exists
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    program_fee_includes_gst: boolean;
    equal_scholarship_distribution: boolean;
    // Custom dates configuration (optional in preview mode)
    one_shot_dates?: Record<string, unknown>; // JSON data for one-shot payment dates
    sem_wise_dates?: Record<string, unknown>; // JSON data for semester-wise payment dates
    instalment_wise_dates?: Record<string, unknown>; // JSON data for installment-wise payment dates
  };
};

export type InstallmentView = {
  paymentDate: string;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  baseDiscountAmount: number; // Base one-shot discount only
  additionalDiscountAmount: number; // Additional discount only
  gstAmount: number;
  amountPayable: number;
  // enriched
  status?: string;
  amountPaid?: number;
  amountPending?: number;
  installmentNumber?: number;
};

export type SemesterView = {
  semesterNumber: number;
  instalments: InstallmentView[];
  total: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
};

export type Breakdown = {
  admissionFee: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
    paymentDate?: string;
  };
  semesters: SemesterView[];
  oneShotPayment?: InstallmentView;
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalScholarship: number;
    totalAmountPayable: number;
  };
};

export type EdgeResponse = {
  success: boolean;
  error?: string;
  breakdown?: Breakdown;
  feeStructure?: {
    id: string;
    cohort_id: string;
    student_id?: string | null;
    structure_type: 'cohort' | 'custom';
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    is_setup_complete: boolean;
    program_fee_includes_gst: boolean;
    equal_scholarship_distribution: boolean;

    one_shot_dates: Record<string, unknown>;
    sem_wise_dates: Record<string, unknown>;
    instalment_wise_dates: Record<string, unknown>;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
  };
  aggregate?: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
    nextDueDate: string | null;
    paymentStatus: string;
  };
  debug?: unknown;
};

export type FeeStructure = {
  id?: string;
  cohort_id: string;
  student_id?: string | null;
  structure_type: 'cohort' | 'custom';
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete?: boolean;
  program_fee_includes_gst: boolean;
  equal_scholarship_distribution: boolean;

  one_shot_dates?: Record<string, unknown>;
  sem_wise_dates?: Record<string, unknown>;
  instalment_wise_dates?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Transaction = {
  amount: number;
  verification_status: string | null;
  installment_id: string | null;
  semester_number: number | null;
};

export type InstallmentAllocation = {
  amount: number;
  approvedAmount: number;
  hasVerificationPending: boolean;
  hasApproved: boolean;
};

export type DueItem = {
  dueDate: string;
  pending: number;
  status: string;
};
