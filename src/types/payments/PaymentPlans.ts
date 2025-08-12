/**
 * Payment Plans Types
 * Centralized payment plan definitions and calculations
 */

import { CohortStudent } from '../cohort';

export type PaymentPlan = 'one_shot' | 'sem_wise' | 'instalment_wise' | 'not_selected';

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

export interface NewFeeStructureInput {
  cohort_id: string;
  admission_fee: number;
  total_program_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
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

export interface NewScholarshipInput {
  cohort_id: string;
  name: string;
  description?: string;
  start_percentage: number;
  end_percentage: number;
  amount_percentage: number;
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

/**
 * Payment Plan Utilities
 */
export const PAYMENT_PLAN_CONFIG = {
  one_shot: {
    label: 'One Shot Payment',
    description: 'Pay the entire amount at once with maximum discount',
    discountPercentage: 10,
    requiresSetup: false
  },
  sem_wise: {
    label: 'Semester-wise Payment',
    description: 'Pay semester by semester',
    discountPercentage: 5,
    requiresSetup: true
  },
  instalment_wise: {
    label: 'Installment-wise Payment',
    description: 'Pay in monthly installments',
    discountPercentage: 0,
    requiresSetup: true
  },
  not_selected: {
    label: 'Not Selected',
    description: 'Payment plan not yet selected',
    discountPercentage: 0,
    requiresSetup: false
  }
} as const;

export const getPaymentPlanConfig = (plan: PaymentPlan) => {
  return PAYMENT_PLAN_CONFIG[plan] || PAYMENT_PLAN_CONFIG.not_selected;
};

export const isPaymentPlanValid = (plan: PaymentPlan): boolean => {
  return plan !== 'not_selected';
};

export const getPaymentPlanDiscount = (plan: PaymentPlan, baseDiscount: number = 0): number => {
  const config = getPaymentPlanConfig(plan);
  return config.discountPercentage + baseDiscount;
};

export const calculateFeeBreakdown = (
  totalAmount: number,
  plan: PaymentPlan,
  scholarshipPercentage: number = 0,
  additionalDiscount: number = 0
): FeeCalculation => {
  const planDiscount = getPaymentPlanDiscount(plan);
  const totalDiscountPercentage = planDiscount + scholarshipPercentage + additionalDiscount;
  
  const baseAmount = totalAmount;
  const scholarshipAmount = (totalAmount * scholarshipPercentage) / 100;
  const discountAmount = (totalAmount * planDiscount) / 100;
  const additionalDiscountAmount = (totalAmount * additionalDiscount) / 100;
  const subtotal = totalAmount - scholarshipAmount - discountAmount - additionalDiscountAmount;
  const gstAmount = (subtotal * 18) / 100; // 18% GST
  const totalPayable = subtotal + gstAmount;

  return {
    baseAmount,
    scholarshipAmount,
    discountAmount: discountAmount + additionalDiscountAmount,
    gstAmount,
    totalPayable
  };
};
