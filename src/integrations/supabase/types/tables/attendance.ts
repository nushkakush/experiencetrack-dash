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
    session_date: string
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
    session_date: string
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
