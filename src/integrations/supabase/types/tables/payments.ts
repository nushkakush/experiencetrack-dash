export type FeeStructureTable = {
  Row: {
    id: string;
    cohort_id: string;
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    is_setup_complete: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    cohort_id: string;
    total_program_fee: number;
    admission_fee?: number;
    number_of_semesters?: number;
    instalments_per_semester?: number;
    one_shot_discount_percentage?: number;
    is_setup_complete?: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    cohort_id?: string;
    total_program_fee?: number;
    admission_fee?: number;
    number_of_semesters?: number;
    instalments_per_semester?: number;
    one_shot_discount_percentage?: number;
    is_setup_complete?: boolean;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'fee_structures_cohort_id_fkey';
      columns: ['cohort_id'];
      isOneToOne: false;
      referencedRelation: 'cohorts';
      referencedColumns: ['id'];
    },
  ];
};

export type CohortScholarshipTable = {
  Row: {
    id: string;
    cohort_id: string;
    name: string;
    description: string | null;
    amount_percentage: number;
    start_percentage: number;
    end_percentage: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    cohort_id: string;
    name: string;
    description?: string | null;
    amount_percentage: number;
    start_percentage?: number;
    end_percentage?: number;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    cohort_id?: string;
    name?: string;
    description?: string | null;
    amount_percentage?: number;
    start_percentage?: number;
    end_percentage?: number;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'cohort_scholarships_cohort_id_fkey';
      columns: ['cohort_id'];
      isOneToOne: false;
      referencedRelation: 'cohorts';
      referencedColumns: ['id'];
    },
  ];
};

export type StudentPaymentTable = {
  Row: {
    id: string;
    student_id: string;
    cohort_id: string;
    payment_plan: string;
    scholarship_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    student_id: string;
    cohort_id: string;
    payment_plan?: string;
    scholarship_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    student_id?: string;
    cohort_id?: string;
    payment_plan?: string;
    scholarship_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'student_payments_student_id_fkey';
      columns: ['student_id'];
      isOneToOne: false;
      referencedRelation: 'cohort_students';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'student_payments_cohort_id_fkey';
      columns: ['cohort_id'];
      isOneToOne: false;
      referencedRelation: 'cohorts';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'student_payments_scholarship_id_fkey';
      columns: ['scholarship_id'];
      isOneToOne: false;
      referencedRelation: 'cohort_scholarships';
      referencedColumns: ['id'];
    },
  ];
};

export type StudentPaymentSummaryView = {
  Row: {
    id: string;
    student_id: string;
    cohort_id: string;
    payment_plan: string;
    total_amount_payable: number;
    total_amount_paid: number;
    total_amount_pending: number;
    scholarship_id: string | null;
    payment_status: string;
    next_due_date: string | null;
    last_payment_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    scholarship_name: string | null;
    scholarship_id: string | null;
    scholarship_description: string | null;
    additional_discount_percentage: number | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  Insert: never;
  Update: never;
  Relationships: [];
};

export type PaymentTransactionTable = {
  Row: {
    id: string;
    payment_id: string;
    transaction_type: string;
    amount: number;
    payment_method: string;
    reference_number: string | null;
    status: string;
    notes: string | null;
    created_at: string | null;
    created_by: string | null;
    updated_at: string | null;
    verification_status: string | null;
    verified_by: string | null;
    verified_at: string | null;
    receipt_url: string | null;
    proof_of_payment_url: string | null;
    transaction_screenshot_url: string | null;
    bank_name: string | null;
    bank_branch: string | null;
    utr_number: string | null;
    account_number: string | null;
    cheque_number: string | null;
    payer_upi_id: string | null;
    razorpay_payment_id: string | null;
    razorpay_order_id: string | null;
    razorpay_signature: string | null;
    qr_code_url: string | null;
    receiver_bank_name: string | null;
    receiver_bank_logo_url: string | null;
    dd_number: string | null;
    dd_bank_name: string | null;
    dd_branch: string | null;
    verification_notes: string | null;
    rejection_reason: string | null;
    payment_date: string | null;
    transfer_date: string | null;
  };
  Insert: {
    id?: string;
    payment_id: string;
    transaction_type: string;
    amount: number;
    payment_method: string;
    reference_number?: string | null;
    status: string;
    notes?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    updated_at?: string | null;
    verification_status?: string | null;
    verified_by?: string | null;
    verified_at?: string | null;
    receipt_url?: string | null;
    proof_of_payment_url?: string | null;
    transaction_screenshot_url?: string | null;
    bank_name?: string | null;
    bank_branch?: string | null;
    utr_number?: string | null;
    account_number?: string | null;
    cheque_number?: string | null;
    payer_upi_id?: string | null;
    razorpay_payment_id?: string | null;
    razorpay_order_id?: string | null;
    razorpay_signature?: string | null;
    qr_code_url?: string | null;
    receiver_bank_name?: string | null;
    receiver_bank_logo_url?: string | null;
    dd_number?: string | null;
    dd_bank_name?: string | null;
    dd_branch?: string | null;
    verification_notes?: string | null;
    rejection_reason?: string | null;
    payment_date?: string | null;
    transfer_date?: string | null;
  };
  Update: {
    id?: string;
    payment_id?: string;
    transaction_type?: string;
    amount?: number;
    payment_method?: string;
    reference_number?: string | null;
    status?: string;
    notes?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    updated_at?: string | null;
    verification_status?: string | null;
    verified_by?: string | null;
    verified_at?: string | null;
    receipt_url?: string | null;
    proof_of_payment_url?: string | null;
    transaction_screenshot_url?: string | null;
    bank_name?: string | null;
    bank_branch?: string | null;
    utr_number?: string | null;
    account_number?: string | null;
    cheque_number?: string | null;
    payer_upi_id?: string | null;
    razorpay_payment_id?: string | null;
    razorpay_order_id?: string | null;
    razorpay_signature?: string | null;
    qr_code_url?: string | null;
    receiver_bank_name?: string | null;
    receiver_bank_logo_url?: string | null;
    dd_number?: string | null;
    dd_bank_name?: string | null;
    dd_branch?: string | null;
    verification_notes?: string | null;
    rejection_reason?: string | null;
    payment_date?: string | null;
    transfer_date?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'payment_transactions_created_by_fkey';
      columns: ['created_by'];
      isOneToOne: false;
      referencedRelation: 'profiles';
      referencedColumns: ['user_id'];
    },
    {
      foreignKeyName: 'payment_transactions_verified_by_fkey';
      columns: ['verified_by'];
      isOneToOne: false;
      referencedRelation: 'profiles';
      referencedColumns: ['user_id'];
    },
  ];
};
