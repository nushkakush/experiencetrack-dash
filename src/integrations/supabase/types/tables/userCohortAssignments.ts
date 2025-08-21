export type UserCohortAssignmentTable = {
  Row: {
    id: string
    user_id: string
    cohort_id: string
    assigned_by: string
    assigned_at: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    cohort_id: string
    assigned_by: string
    assigned_at?: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    cohort_id?: string
    assigned_by?: string
    assigned_at?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "user_cohort_assignments_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },
    {
      foreignKeyName: "user_cohort_assignments_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "user_cohort_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
  ]
}
