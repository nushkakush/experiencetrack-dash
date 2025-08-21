import type { UserProfile } from './auth';
import type { Cohort } from './cohort';

// Base interface for user cohort assignment
export interface UserCohortAssignment {
  id: string;
  user_id: string;
  cohort_id: string;
  assigned_by: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

// Extended interface with related data
export interface CohortAssignmentWithDetails extends UserCohortAssignment {
  user: UserProfile;
  cohort: Cohort;
  assigned_by_user: UserProfile;
}

// Input types for creating/updating assignments
export interface CreateCohortAssignmentInput {
  user_id: string;
  cohort_id: string;
}

export interface UpdateCohortAssignmentInput {
  is_active?: boolean;
  notes?: string;
}

// Bulk operation types
export interface BulkCohortAssignmentInput {
  user_ids: string[];
  cohort_ids: string[];
}

export interface BulkCohortRemovalInput {
  user_ids: string[];
  cohort_ids: string[];
}

// Query types
export interface CohortAssignmentFilters {
  user_id?: string;
  cohort_id?: string;
  assigned_by?: string;
  is_active?: boolean;
}

// Response types
export interface CohortAssignmentStats {
  total_assignments: number;
  users_with_assignments: number;
  cohorts_with_assignments: number;
}
