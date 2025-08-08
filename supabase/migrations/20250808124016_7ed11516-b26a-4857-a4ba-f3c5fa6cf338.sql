
-- 1) Enum for invite status
DO $$ BEGIN
  CREATE TYPE public.invite_status AS ENUM ('pending','sent','accepted','failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Cohorts table
CREATE TABLE IF NOT EXISTS public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id text NOT NULL UNIQUE,
  name text NOT NULL,
  start_date date NOT NULL,
  duration_months int NOT NULL CHECK (duration_months > 0),
  end_date date NOT NULL,
  description text,
  sessions_per_day int NOT NULL DEFAULT 1 CHECK (sessions_per_day > 0),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Cohort epics
CREATE TABLE IF NOT EXISTS public.cohort_epics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_months int NOT NULL CHECK (duration_months > 0),
  position int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Cohort students
CREATE TABLE IF NOT EXISTS public.cohort_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  user_id uuid, -- optional: linked after signup; do not FK due to profiles.user_id not being PK
  invite_status public.invite_status NOT NULL DEFAULT 'pending',
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_cohort_email UNIQUE (cohort_id, email)
);

-- 5) Updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER set_cohorts_updated_at
    BEFORE UPDATE ON public.cohorts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_cohort_epics_updated_at
    BEFORE UPDATE ON public.cohort_epics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_cohort_students_updated_at
    BEFORE UPDATE ON public.cohort_students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date ON public.cohorts (start_date);
CREATE INDEX IF NOT EXISTS idx_cohort_epics_cohort_position ON public.cohort_epics (cohort_id, position);
CREATE INDEX IF NOT EXISTS idx_cohort_students_user_id ON public.cohort_students (user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_students_status ON public.cohort_students (cohort_id, invite_status);

-- 7) Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_students ENABLE ROW LEVEL SECURITY;

-- 8) RLS Policies
-- Cohorts: only super_admin and program_manager can CRUD/SELECT
DROP POLICY IF EXISTS "Cohorts admin select" ON public.cohorts;
CREATE POLICY "Cohorts admin select" ON public.cohorts
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  );

DROP POLICY IF EXISTS "Cohorts admin modify" ON public.cohorts;
CREATE POLICY "Cohorts admin modify" ON public.cohorts
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  );

-- Cohort epics: same admins only
DROP POLICY IF EXISTS "Cohort epics admin select" ON public.cohort_epics;
CREATE POLICY "Cohort epics admin select" ON public.cohort_epics
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  );

DROP POLICY IF EXISTS "Cohort epics admin modify" ON public.cohort_epics;
CREATE POLICY "Cohort epics admin modify" ON public.cohort_epics
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  );

-- Cohort students:
-- Admins can see all; students can see only their own row
DROP POLICY IF EXISTS "Cohort students admin select" ON public.cohort_students;
CREATE POLICY "Cohort students admin select" ON public.cohort_students
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
    OR user_id = auth.uid()
  );

-- Admins can insert/update/delete
DROP POLICY IF EXISTS "Cohort students admin modify" ON public.cohort_students;
CREATE POLICY "Cohort students admin modify" ON public.cohort_students
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role)
  );

-- 9) Realtime support (optional but useful)
ALTER TABLE public.cohorts REPLICA IDENTITY FULL;
ALTER TABLE public.cohort_epics REPLICA IDENTITY FULL;
ALTER TABLE public.cohort_students REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.cohorts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cohort_epics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cohort_students;
