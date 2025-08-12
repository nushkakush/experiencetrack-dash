-- Fee Structures and Related Tables Migration

-- 1) Fee Structures table
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  total_program_fee decimal(10,2) NOT NULL CHECK (total_program_fee > 0),
  admission_fee decimal(10,2) NOT NULL DEFAULT 0 CHECK (admission_fee >= 0),
  number_of_semesters integer NOT NULL DEFAULT 3 CHECK (number_of_semesters > 0),
  instalments_per_semester integer NOT NULL DEFAULT 1 CHECK (instalments_per_semester > 0),
  one_shot_discount_percentage decimal(5,2) NOT NULL DEFAULT 0 CHECK (one_shot_discount_percentage >= 0 AND one_shot_discount_percentage <= 100),
  is_setup_complete boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_cohort_fee_structure UNIQUE (cohort_id)
);

-- 2) Cohort Scholarships table
CREATE TABLE IF NOT EXISTS public.cohort_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  amount_percentage decimal(5,2) NOT NULL CHECK (amount_percentage > 0 AND amount_percentage <= 100),
  start_percentage decimal(5,2) NOT NULL DEFAULT 0 CHECK (start_percentage >= 0),
  end_percentage decimal(5,2) NOT NULL DEFAULT 100 CHECK (end_percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_percentage_range CHECK (start_percentage <= end_percentage)
);

-- 3) Student Payments table
CREATE TABLE IF NOT EXISTS public.student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.cohort_students(id) ON DELETE CASCADE,
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('admission_fee', 'program_fee', 'scholarship')),
  payment_plan text NOT NULL CHECK (payment_plan IN ('one_shot', 'sem_wise', 'instalment_wise')),
  amount_payable decimal(10,2) NOT NULL CHECK (amount_payable >= 0),
  amount_paid decimal(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid', 'partially_paid_overdue')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT amount_paid_not_exceed_payable CHECK (amount_paid <= amount_payable)
);

-- 4) Payment Transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.student_payments(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'upi', 'cheque')),
  reference_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Communication History table
CREATE TABLE IF NOT EXISTS public.communication_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.cohort_students(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'notification')),
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  subject text,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER set_fee_structures_updated_at
    BEFORE UPDATE ON public.fee_structures
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_cohort_scholarships_updated_at
    BEFORE UPDATE ON public.cohort_scholarships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_student_payments_updated_at
    BEFORE UPDATE ON public.student_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7) RLS Policies for fee_structures
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fee structures are viewable by authenticated users" ON public.fee_structures
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Fee structures are insertable by super_admin and program_manager" ON public.fee_structures
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'program_manager'::user_role)
    )
  );

CREATE POLICY "Fee structures are updatable by super_admin and program_manager" ON public.fee_structures
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'program_manager'::user_role)
    )
  );

-- 8) RLS Policies for cohort_scholarships
ALTER TABLE public.cohort_scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scholarships are viewable by authenticated users" ON public.cohort_scholarships
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Scholarships are insertable by super_admin and program_manager" ON public.cohort_scholarships
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'program_manager'::user_role)
    )
  );

CREATE POLICY "Scholarships are updatable by super_admin and program_manager" ON public.cohort_scholarships
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'program_manager'::user_role)
    )
  );

-- 9) RLS Policies for student_payments
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student payments are viewable by authenticated users" ON public.student_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Student payments are insertable by super_admin and fee_collector" ON public.student_payments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'fee_collector'::user_role)
    )
  );

CREATE POLICY "Student payments are updatable by super_admin and fee_collector" ON public.student_payments
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'fee_collector'::user_role)
    )
  );

-- 10) RLS Policies for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment transactions are viewable by authenticated users" ON public.payment_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Payment transactions are insertable by super_admin and fee_collector" ON public.payment_transactions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'fee_collector'::user_role)
    )
  );

-- 11) RLS Policies for communication_history
ALTER TABLE public.communication_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communication history is viewable by authenticated users" ON public.communication_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Communication history is insertable by super_admin and fee_collector" ON public.communication_history
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'fee_collector'::user_role)
    )
  );

-- 12) Function to increment amount_paid
CREATE OR REPLACE FUNCTION public.increment_amount_paid(payment_id uuid, amount decimal)
RETURNS decimal AS $$
BEGIN
  RETURN (
    SELECT amount_paid + amount
    FROM public.student_payments
    WHERE id = payment_id
  );
END;
$$ LANGUAGE plpgsql;
