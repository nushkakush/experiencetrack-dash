export type CohortEpicTable = {
  Row: {
    cohort_id: string;
    created_at: string;
    description: string | null;
    duration_months: number;
    id: string;
    is_active: boolean | null;
    name: string;
    position: number;
    updated_at: string;
  };
  Insert: {
    cohort_id: string;
    created_at?: string;
    description?: string | null;
    duration_months: number;
    id?: string;
    is_active?: boolean | null;
    name: string;
    position?: number;
    updated_at?: string;
  };
  Update: {
    cohort_id?: string;
    created_at?: string;
    description?: string | null;
    duration_months?: number;
    id?: string;
    is_active?: boolean | null;
    name?: string;
    position?: number;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'cohort_epics_cohort_id_fkey';
      columns: ['cohort_id'];
      isOneToOne: false;
      referencedRelation: 'cohorts';
      referencedColumns: ['id'];
    },
  ];
};

export type CohortStudentTable = {
  Row: {
    accepted_at: string | null;
    avatar_url: string | null;
    cohort_id: string;
    communication_preferences: {
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
    email: string;
    first_name: string | null;
    id: string;
    invite_status: 'pending' | 'sent' | 'accepted' | 'failed';
    invited_at: string | null;
    last_name: string | null;
    phone: string | null;
    updated_at: string;
    user_id: string | null;
  };
  Insert: {
    accepted_at?: string | null;
    avatar_url?: string | null;
    cohort_id: string;
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
    created_at?: string;
    email: string;
    first_name?: string | null;
    id?: string;
    invite_status?: 'pending' | 'sent' | 'accepted' | 'failed';
    invited_at?: string | null;
    last_name?: string | null;
    phone?: string | null;
    updated_at?: string;
    user_id?: string | null;
  };
  Update: {
    accepted_at?: string | null;
    avatar_url?: string | null;
    cohort_id?: string;
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
    created_at?: string;
    email?: string;
    first_name?: string | null;
    id?: string;
    invite_status?: 'pending' | 'sent' | 'accepted' | 'failed';
    invited_at?: string | null;
    last_name?: string | null;
    phone?: string | null;
    updated_at?: string;
    user_id?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'cohort_students_cohort_id_fkey';
      columns: ['cohort_id'];
      isOneToOne: false;
      referencedRelation: 'cohorts';
      referencedColumns: ['id'];
    },
  ];
};

export type CohortTable = {
  Row: {
    cohort_id: string;
    created_at: string;
    created_by: string | null;
    description: string | null;
    duration_months: number;
    end_date: string;
    id: string;
    max_students: number;
    name: string;
    sessions_per_day: number;
    start_date: string;
    updated_at: string;
  };
  Insert: {
    cohort_id: string;
    created_at?: string;
    created_by?: string | null;
    description?: string | null;
    duration_months: number;
    end_date: string;
    id?: string;
    max_students: number;
    name: string;
    sessions_per_day?: number;
    start_date: string;
    updated_at?: string;
  };
  Update: {
    cohort_id?: string;
    created_at?: string;
    created_by?: string | null;
    description?: string | null;
    duration_months?: number;
    end_date?: string;
    id?: string;
    max_students?: number;
    name?: string;
    sessions_per_day?: number;
    start_date?: string;
    updated_at?: string;
  };
  Relationships: [];
};
