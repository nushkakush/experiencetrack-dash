/**
 * Fee Structure Types
 * Defines the structure of fee-related data used throughout the application
 */

export interface FeeStructure {
  id: string;
  cohort_id: string;
  student_id?: string;
  structure_type: 'cohort' | 'custom';
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  custom_dates_enabled: boolean;
  one_shot_dates: Record<string, any>; // Specific to one-shot plan
  sem_wise_dates: Record<string, any>; // Specific to semester-wise plan
  instalment_wise_dates: Record<string, any>; // Specific to installment-wise plan
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeeStructureRow {
  id: string;
  cohort_id: string;
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeeStructureInsert {
  id?: string;
  cohort_id: string;
  student_id?: string;
  structure_type: 'cohort' | 'custom';
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete?: boolean;
  custom_dates_enabled?: boolean;
  one_shot_dates?: Record<string, any>; // Specific to one-shot plan
  sem_wise_dates?: Record<string, any>; // Specific to semester-wise plan
  instalment_wise_dates?: Record<string, any>; // Specific to installment-wise plan
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FeeStructureUpdate {
  id?: string;
  cohort_id?: string;
  student_id?: string;
  structure_type?: 'cohort' | 'custom';
  total_program_fee?: number;
  admission_fee?: number;
  number_of_semesters?: number;
  instalments_per_semester?: number;
  one_shot_discount_percentage?: number;
  is_setup_complete?: boolean;
  custom_dates_enabled?: boolean;
  one_shot_dates?: Record<string, any>; // Specific to one-shot plan
  sem_wise_dates?: Record<string, any>; // Specific to semester-wise plan
  instalment_wise_dates?: Record<string, any>; // Specific to installment-wise plan
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Type for fee structure with relationships
export interface FeeStructureWithRelationships extends FeeStructure {
  cohort?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  scholarships?: Array<{
    id: string;
    name: string;
    amount_percentage: number;
    start_percentage: number;
    end_percentage: number;
  }>;
}
