export type HolidayTable = {
  Row: {
    cohort_id: string | null
    created_at: string | null
    created_by: string | null
    date: string
    description: string | null
    holiday_type: string
    id: string
    status: string
    title: string
    updated_at: string | null
  }
  Insert: {
    cohort_id?: string | null
    created_at?: string | null
    created_by?: string | null
    date: string
    description?: string | null
    holiday_type: string
    id?: string
    status?: string
    title: string
    updated_at?: string | null
  }
  Update: {
    cohort_id?: string | null
    created_at?: string | null
    created_by?: string | null
    date?: string
    description?: string | null
    holiday_type?: string
    id?: string
    status?: string
    title?: string
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "holidays_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
  ]
}
