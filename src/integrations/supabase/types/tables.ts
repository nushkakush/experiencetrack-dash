export type AttendanceRecordTable = {
  Row: {
    absence_type: string | null
    cohort_id: string | null
    created_at: string | null
    epic_id: string | null
    id: string
    marked_by: string | null
    reason: string | null
    session_date: string
    session_number: number
    status: string
    student_id: string
    updated_at: string | null
  }
  Insert: {
    absence_type?: string | null
    cohort_id?: string | null
    created_at?: string | null
    epic_id?: string | null
    id?: string
    marked_by?: string | null
    reason?: string | null
    session_date?: string
    session_number?: number
    status: string
    student_id: string
    updated_at?: string | null
  }
  Update: {
    absence_type?: string | null
    cohort_id?: string | null
    created_at?: string | null
    epic_id?: string | null
    id?: string
    marked_by?: string | null
    reason?: string | null
    session_date?: string
    session_number?: number
    status?: string
    student_id?: string
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "attendance_records_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "attendance_records_epic_id_fkey"
      columns: ["epic_id"]
      isOneToOne: false
      referencedRelation: "cohort_epics"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "attendance_records_marked_by_fkey"
      columns: ["marked_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "attendance_records_student_id_fkey"
      columns: ["student_id"]
      isOneToOne: false
      referencedRelation: "cohort_students"
      referencedColumns: ["id"]
    },
  ]
}

export type CancelledSessionTable = {
  Row: {
    cancelled_at: string | null
    cancelled_by: string | null
    cohort_id: string
    created_at: string | null
    epic_id: string
    id: string
    session_date: string
    session_number: number
  }
  Insert: {
    cancelled_at?: string | null
    cancelled_by?: string | null
    cohort_id: string
    created_at?: string | null
    epic_id: string
    id?: string
    session_date: string
    session_number: number
  }
  Update: {
    cancelled_at?: string | null
    cancelled_by?: string | null
    cohort_id?: string
    created_at?: string | null
    epic_id?: string
    id?: string
    session_date?: string
    session_number?: number
  }
  Relationships: [
    {
      foreignKeyName: "cancelled_sessions_cancelled_by_fkey"
      columns: ["cancelled_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "cancelled_sessions_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "cancelled_sessions_epic_id_fkey"
      columns: ["epic_id"]
      isOneToOne: false
      referencedRelation: "cohort_epics"
      referencedColumns: ["id"]
    },
  ]
}

export type CohortEpicTable = {
  Row: {
    cohort_id: string
    created_at: string
    description: string | null
    duration_months: number
    id: string
    is_active: boolean | null
    name: string
    position: number
    updated_at: string
  }
  Insert: {
    cohort_id: string
    created_at?: string
    description?: string | null
    duration_months: number
    id?: string
    is_active?: boolean | null
    name: string
    position?: number
    updated_at?: string
  }
  Update: {
    cohort_id?: string
    created_at?: string
    description?: string | null
    duration_months?: number
    id?: string
    is_active?: boolean | null
    name?: string
    position?: number
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "cohort_epics_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
  ]
}

export type CohortStudentTable = {
  Row: {
    accepted_at: string | null
    avatar_url: string | null
    cohort_id: string
    created_at: string
    email: string
    first_name: string | null
    id: string
    invite_status: "pending" | "sent" | "accepted" | "failed"
    invited_at: string | null
    last_name: string | null
    phone: string | null
    updated_at: string
    user_id: string | null
  }
  Insert: {
    accepted_at?: string | null
    avatar_url?: string | null
    cohort_id: string
    created_at?: string
    email: string
    first_name?: string | null
    id?: string
    invite_status?: "pending" | "sent" | "accepted" | "failed"
    invited_at?: string | null
    last_name?: string | null
    phone?: string | null
    updated_at?: string
    user_id?: string | null
  }
  Update: {
    accepted_at?: string | null
    avatar_url?: string | null
    cohort_id?: string
    created_at?: string
    email?: string
    first_name?: string | null
    id?: string
    invite_status?: "pending" | "sent" | "accepted" | "failed"
    invited_at?: string | null
    last_name?: string | null
    phone?: string | null
    updated_at?: string
    user_id?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "cohort_students_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
  ]
}

export type CohortTable = {
  Row: {
    cohort_id: string
    created_at: string
    created_by: string | null
    description: string | null
    duration_months: number
    end_date: string
    id: string
    name: string
    sessions_per_day: number
    start_date: string
    updated_at: string
  }
  Insert: {
    cohort_id: string
    created_at?: string
    created_by?: string | null
    description?: string | null
    duration_months: number
    end_date: string
    id?: string
    name: string
    sessions_per_day?: number
    start_date: string
    updated_at?: string
  }
  Update: {
    cohort_id?: string
    created_at?: string
    created_by?: string | null
    description?: string | null
    duration_months?: number
    end_date?: string
    id?: string
    name?: string
    sessions_per_day?: number
    start_date?: string
    updated_at?: string
  }
  Relationships: []
}

export type ProfileTable = {
  Row: {
    created_at: string
    email: string | null
    first_name: string | null
    id: string
    last_name: string | null
    role: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
    updated_at: string
    user_id: string
  }
  Insert: {
    created_at?: string
    email?: string | null
    first_name?: string | null
    id?: string
    last_name?: string | null
    role?: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
    updated_at?: string
    user_id: string
  }
  Update: {
    created_at?: string
    email?: string | null
    first_name?: string | null
    id?: string
    last_name?: string | null
    role?: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}
