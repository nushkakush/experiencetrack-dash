import { CohortStudent, Cohort } from '@/types/cohort';
import { UserProfile } from '@/types/auth';

export type EquipmentConditionStatus =
  | 'excellent'
  | 'good'
  | 'poor'
  | 'damaged'
  | 'under_repair'
  | 'lost'
  | 'decommissioned';

export type EquipmentAvailabilityStatus =
  | 'available'
  | 'borrowed'
  | 'maintenance'
  | 'retired'
  | 'lost'
  | 'decommissioned';

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface EquipmentLocation {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  category?: EquipmentCategory;
  location_id?: string;
  location?: EquipmentLocation;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  condition_status: EquipmentConditionStatus;
  availability_status: EquipmentAvailabilityStatus;
  images: string[];
  condition_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data for borrower information
  borrowings?: any[]; // EquipmentBorrowing[] - imported from borrowing.types
}

export interface EquipmentBlacklist {
  id: string;
  student_id: string;
  reason: string;
  blacklisted_by?: string;
  blacklisted_at: string;
  expires_at?: string;
  is_active: boolean;
  // Joined data
  student?: CohortStudent & {
    cohort?: Cohort;
  };
  blacklisted_by_user?: UserProfile;
}

export interface EquipmentDamageReport {
  id: string;
  equipment_id: string;
  borrowing_id?: string;
  reported_by?: string;
  damage_description: string;
  estimated_repair_cost?: number;
  status:
    | 'reported'
    | 'under_review'
    | 'repair_approved'
    | 'repair_completed'
    | 'replacement_approved'
    | 'resolved';
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  // Joined data
  equipment?: Equipment;
  borrowing?: EquipmentBorrowing;
  reported_by_user?: UserProfile;
  resolved_by_user?: UserProfile;
}

// Form types for creating/editing equipment
export interface CreateEquipmentFormData {
  name: string;
  description?: string;
  category_id: string;
  location_id?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  condition_status: EquipmentConditionStatus;
  availability_status: EquipmentAvailabilityStatus;
  images: string[];
  condition_notes?: string;
}

export interface CreateCategoryFormData {
  name: string;
  description?: string;
}

export interface CreateLocationFormData {
  name: string;
  description?: string;
}

// API response types
export interface EquipmentListResponse {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryListResponse {
  categories: EquipmentCategory[];
  total: number;
}

export interface LocationListResponse {
  locations: EquipmentLocation[];
  total: number;
}

// Equipment Borrowing Types - moved to borrowing.types.ts

// Equipment Issuance Types
export interface EquipmentIssuanceStep {
  step: 'cohort' | 'student' | 'equipment' | 'details' | 'review';
  title: string;
  description: string;
}

export interface IssuanceFormData {
  cohort_id?: string;
  student_id?: string;
  equipment_ids: string[];
  reason: string;
  expected_return_date: string;
  expected_return_time: string;
  notes?: string;
}

// Equipment Return Types - moved to borrowing.types.ts
// Equipment Blacklist Types - moved to blacklist.types.ts
// Equipment Damage Report Types - moved to damage.types.ts
