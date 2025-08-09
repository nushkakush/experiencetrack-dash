export type AttendanceSummaryView = {
  Row: {
    absent_count: number | null
    cohort_id: string | null
    cohort_name: string | null
    epic_id: string | null
    epic_name: string | null
    is_cancelled: boolean | null
    late_count: number | null
    marked_attendance: number | null
    present_count: number | null
    session_date: string | null
    session_number: number | null
    sessions_per_day: number | null
    total_students: number | null
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
  ]
}
