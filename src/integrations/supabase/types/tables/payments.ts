export type FeeStructureTable = {
  Row: {
    id: string
    cohort_id: string
    total_program_fee: number
    admission_fee: number
    number_of_semesters: number
    instalments_per_semester: number
    one_shot_discount_percentage: number
    is_setup_complete: boolean
    created_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    cohort_id: string
    total_program_fee: number
    admission_fee?: number
    number_of_semesters?: number
    instalments_per_semester?: number
    one_shot_discount_percentage?: number
    is_setup_complete?: boolean
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    cohort_id?: string
    total_program_fee?: number
    admission_fee?: number
    number_of_semesters?: number
    instalments_per_semester?: number
    one_shot_discount_percentage?: number
    is_setup_complete?: boolean
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "fee_structures_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
  ]
}

export type CohortScholarshipTable = {
  Row: {
    id: string
    cohort_id: string
    name: string
    description: string | null
    amount_percentage: number
    start_percentage: number
    end_percentage: number
    created_by: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    cohort_id: string
    name: string
    description?: string | null
    amount_percentage: number
    start_percentage?: number
    end_percentage?: number
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    cohort_id?: string
    name?: string
    description?: string | null
    amount_percentage?: number
    start_percentage?: number
    end_percentage?: number
    created_by?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "cohort_scholarships_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
  ]
}

export type StudentPaymentTable = {
  Row: {
    id: string
    student_id: string
    cohort_id: string
    payment_type: string
    payment_plan: string
    amount_payable: number
    amount_paid: number
    due_date: string
    status: string
    notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    student_id: string
    cohort_id: string
    payment_type: string
    payment_plan: string
    amount_payable: number
    amount_paid?: number
    due_date: string
    status?: string
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    student_id?: string
    cohort_id?: string
    payment_type?: string
    payment_plan?: string
    amount_payable?: number
    amount_paid?: number
    due_date?: string
    status?: string
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "student_payments_student_id_fkey"
      columns: ["student_id"]
      isOneToOne: false
      referencedRelation: "cohort_students"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "student_payments_cohort_id_fkey"
      columns: ["cohort_id"]
      isOneToOne: false
      referencedRelation: "cohorts"
      referencedColumns: ["id"]
    },
  ]
}

export type PaymentTransactionTable = {
  Row: {
    id: string
    payment_id: string
    transaction_type: string
    amount: number
    payment_method: string
    reference_number: string | null
    status: string
    notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    payment_id: string
    transaction_type: string
    amount: number
    payment_method: string
    reference_number?: string | null
    status?: string
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    payment_id?: string
    transaction_type?: string
    amount?: number
    payment_method?: string
    reference_number?: string | null
    status?: string
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "payment_transactions_payment_id_fkey"
      columns: ["payment_id"]
      isOneToOne: false
      referencedRelation: "student_payments"
      referencedColumns: ["id"]
    },
  ]
}
