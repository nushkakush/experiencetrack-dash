import { CohortStudent } from '@/types/cohort';
import { UserProfile } from '@/types/auth';
import { EquipmentConditionStatus } from './equipment.types';

export type BorrowingStatus = 'active' | 'returned' | 'overdue' | 'cancelled';

export interface EquipmentBorrowing {
  id: string;
  equipment_id: string;
  student_id: string;
  borrowed_at: string;
  expected_return_date: string;
  actual_return_date?: string;
  reason: string;
  status: BorrowingStatus;
  returned_to?: string;
  notes?: string;
  issue_condition?: EquipmentConditionStatus;
  return_condition?: EquipmentConditionStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  equipment?: any; // Equipment type
  student?: CohortStudent;
  returned_to_user?: UserProfile;
}

export interface CreateBorrowingFormData {
  equipment_id: string;
  student_id: string;
  reason: string;
  expected_return_date: string;
  issue_condition?: EquipmentConditionStatus;
  notes?: string;
}

export interface ReturnEquipmentData {
  borrowing_id: string;
  return_condition: EquipmentConditionStatus;
  notes?: string;
  returned_to?: string;
}

export interface EquipmentReturn {
  id: string;
  borrowing_id: string;
  returned_at: string;
  return_condition: EquipmentConditionStatus;
  notes?: string;
  returned_to?: string;
  created_at: string;
  // Joined data
  borrowing?: EquipmentBorrowing;
  returned_to_user?: UserProfile;
}
