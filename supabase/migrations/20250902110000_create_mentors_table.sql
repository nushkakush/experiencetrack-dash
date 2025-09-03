-- Mentors table for internal mentor management (no auth users required)

-- 1) Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  specialization text,
  experience_years integer,
  current_company text,
  linkedin_url text,
  bio text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
  internal_notes text,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_mentors_email ON public.mentors (email);
CREATE INDEX IF NOT EXISTS idx_mentors_status ON public.mentors (status);
CREATE INDEX IF NOT EXISTS idx_mentors_specialization ON public.mentors (specialization);
CREATE INDEX IF NOT EXISTS idx_mentors_linkedin_url ON public.mentors (linkedin_url);

-- 3) Updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER set_mentors_updated_at
    BEFORE UPDATE ON public.mentors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Enable RLS
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies: mentor_manager and super_admin can manage
DROP POLICY IF EXISTS "Mentor managers can view mentors" ON public.mentors;
CREATE POLICY "Mentor managers can view mentors"
  ON public.mentors
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'mentor_manager'::public.user_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.user_role)
  );

DROP POLICY IF EXISTS "Mentor managers can manage mentors" ON public.mentors;
CREATE POLICY "Mentor managers can manage mentors"
  ON public.mentors
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'mentor_manager'::public.user_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.user_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'mentor_manager'::public.user_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.user_role)
  );


