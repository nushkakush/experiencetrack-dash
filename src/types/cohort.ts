export interface Cohort {
  id: string;
  cohort_id: string;
  name: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  duration_months: number;
  end_date: string; // ISO date string (YYYY-MM-DD)
  description?: string | null;
  sessions_per_day: number;
  max_students: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Epic {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CohortEpic {
  id: string;
  cohort_id: string;
  epic_id: string;
  epic: Epic;
  duration_months: number;
  position: number;
  description?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface NewCohortInput {
  name: string;
  cohort_id: string;
  start_date: string; // YYYY-MM-DD
  duration_months: number;
  end_date: string; // YYYY-MM-DD
  description?: string;
  sessions_per_day: number;
  max_students: number;
}

export interface NewEpicInput {
  epic_id?: string; // For existing epics
  name?: string; // For new epics
  duration_months: number;
}

export interface CohortWithCounts extends Cohort {
  students_count: number;
}

export interface CohortStudent {
  id: string;
  cohort_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  user_id?: string | null;
  invite_status: 'pending' | 'sent' | 'accepted' | 'failed';
  invited_at?: string | null;
  accepted_at?: string | null;
  invitation_token?: string | null;
  invitation_expires_at?: string | null;
  invited_by?: string | null;
  dropped_out_status: 'active' | 'dropped_out';
  dropped_out_reason?: string | null;
  dropped_out_at?: string | null;
  dropped_out_by?: string | null;
  communication_preferences?: {
    automated_communications: {
      email: {
        enabled: boolean;
        last_updated: string | null;
      };
      whatsapp: {
        enabled: boolean;
        last_updated: string | null;
      };
    };
    manual_communications: {
      email: boolean;
      whatsapp: boolean;
    };
  } | null;
  created_at: string;
  updated_at: string;
}

export interface NewStudentInput {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  send_invite?: boolean;
  invite?: string; // For bulk upload - 'YES' or 'NO'
}
