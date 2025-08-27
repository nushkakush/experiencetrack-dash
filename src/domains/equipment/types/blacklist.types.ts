export interface EquipmentBlacklist {
  id: string;
  student_id: string;
  reason: string;
  blacklisted_by?: string;
  blacklisted_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: any; // CohortStudent type
  blacklisted_by_user?: any; // UserProfile type
}

export interface CreateBlacklistData {
  student_id: string;
  reason: string;
  expires_at?: string;
}
