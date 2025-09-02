export interface Program {
  id: string;
  name: string;
  description?: string;
  cohort_id: string;
  epic_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Epic {
  id: string;
  title: string;
  description?: string;
  cohort_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
