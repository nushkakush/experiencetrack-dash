export type CommunicationHistoryTable = {
  Row: {
    id: string
    student_id: string
    type: string
    channel: string
    subject: string | null
    message: string
    sent_at: string
    status: string
    created_at: string
  }
  Insert: {
    id?: string
    student_id: string
    type: string
    channel: string
    subject?: string | null
    message: string
    sent_at?: string
    status?: string
    created_at?: string
  }
  Update: {
    id?: string
    student_id?: string
    type?: string
    channel?: string
    subject?: string | null
    message?: string
    sent_at?: string
    status?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "communication_history_student_id_fkey"
      columns: ["student_id"]
      isOneToOne: false
      referencedRelation: "cohort_students"
      referencedColumns: ["id"]
    },
  ]
}
