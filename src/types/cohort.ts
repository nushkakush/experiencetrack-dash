
export interface Cohort {
  id: string;
  cohort_id: string;
  name: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  duration_months: number;
  end_date: string; // ISO date string (YYYY-MM-DD)
  description?: string | null;
  sessions_per_day: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CohortEpic {
  id: string;
  cohort_id: string;
  name: string;
  duration_months: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface NewCohortInput {
  name: string;
  cohort_id: string;
  start_date: string; // YYYY-MM-DD
  duration_months: number;
  end_date: string;   // YYYY-MM-DD
  description?: string;
  sessions_per_day: number;
}

export interface NewEpicInput {
  name: string;
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
  avatar_url?: string | null;
  user_id?: string | null;
  invite_status: 'pending' | 'sent' | 'accepted' | 'failed';
  invited_at?: string | null;
  accepted_at?: string | null;
  invitation_token?: string | null;
  invitation_expires_at?: string | null;
  invited_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewStudentInput {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  send_invite?: boolean;
  invite?: string; // For bulk upload - 'YES' or 'NO'
}
