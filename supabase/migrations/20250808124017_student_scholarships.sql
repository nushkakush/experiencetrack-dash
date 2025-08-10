-- Student Scholarship Assignments
-- This table tracks which scholarships are assigned to which students

CREATE TABLE IF NOT EXISTS public.student_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.cohort_students(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  additional_discount_percentage decimal(5,2) DEFAULT 0 CHECK (additional_discount_percentage >= 0 AND additional_discount_percentage <= 100),
  assigned_by uuid REFERENCES public.profiles(user_id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_student_scholarship UNIQUE (student_id, scholarship_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_scholarships_student_id ON public.student_scholarships (student_id);
CREATE INDEX IF NOT EXISTS idx_student_scholarships_scholarship_id ON public.student_scholarships (scholarship_id);

-- Enable RLS
ALTER TABLE public.student_scholarships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_scholarships
-- Admins can see all assignments
DROP POLICY IF EXISTS "Student scholarships admin select" ON public.student_scholarships;
CREATE POLICY "Student scholarships admin select" ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role) OR
    public.has_role(auth.uid(), 'fee_collector'::user_role)
  );

-- Admins can modify assignments
DROP POLICY IF EXISTS "Student scholarships admin modify" ON public.student_scholarships;
CREATE POLICY "Student scholarships admin modify" ON public.student_scholarships
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role) OR
    public.has_role(auth.uid(), 'fee_collector'::user_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::user_role) OR
    public.has_role(auth.uid(), 'program_manager'::user_role) OR
    public.has_role(auth.uid(), 'fee_collector'::user_role)
  );

-- Students can see their own scholarship assignments
DROP POLICY IF EXISTS "Student scholarships student select" ON public.student_scholarships;
CREATE POLICY "Student scholarships student select" ON public.student_scholarships
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cohort_students cs
      WHERE cs.id = student_scholarships.student_id
      AND cs.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER set_student_scholarships_updated_at
    BEFORE UPDATE ON public.student_scholarships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable real-time for student_scholarships
ALTER TABLE public.student_scholarships REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_scholarships;
