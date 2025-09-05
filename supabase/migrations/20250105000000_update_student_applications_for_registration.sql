-- Update student_applications table to support self-registration flow
-- This migration adds the necessary columns for the registration process

-- Add new columns to support registration flow
ALTER TABLE public.student_applications 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS registration_source text DEFAULT 'manual' CHECK (registration_source IN ('manual', 'self_registration')),
ADD COLUMN IF NOT EXISTS registration_date timestamptz,
ADD COLUMN IF NOT EXISTS invitation_token text,
ADD COLUMN IF NOT EXISTS invitation_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS registration_completed boolean DEFAULT false;

-- Update the status constraint to include registration statuses
ALTER TABLE public.student_applications 
DROP CONSTRAINT IF EXISTS student_applications_status_check;

ALTER TABLE public.student_applications 
ADD CONSTRAINT student_applications_status_check 
CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'registration_initiated'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_applications_profile_id 
ON public.student_applications (profile_id);

CREATE INDEX IF NOT EXISTS idx_student_applications_invitation_token 
ON public.student_applications (invitation_token) 
WHERE invitation_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_applications_registration_source 
ON public.student_applications (registration_source);

-- Update RLS policies to allow profile-based access
DROP POLICY IF EXISTS "Students can insert their own applications" ON public.student_applications;

CREATE POLICY "Students can insert their own applications"
ON public.student_applications
FOR INSERT
WITH CHECK (
  -- Allow if student_id matches authenticated user
  student_id IN (
    SELECT id FROM public.cohort_students WHERE user_id = auth.uid()
  ) OR
  -- Allow if profile_id matches authenticated user's profile
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can update their own draft applications" ON public.student_applications;

CREATE POLICY "Students can update their own draft applications"
ON public.student_applications
FOR UPDATE
USING (
  -- Allow if student_id matches authenticated user
  (student_id IN (
    SELECT id FROM public.cohort_students WHERE user_id = auth.uid()
  ) AND status = 'draft') OR
  -- Allow if profile_id matches authenticated user's profile and status allows updates
  (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ) AND status IN ('draft', 'registration_initiated'))
);

-- Update the view policy to include profile-based access
DROP POLICY IF EXISTS "Users can view applications for their accessible cohorts" ON public.student_applications;

CREATE POLICY "Users can view applications for their accessible cohorts"
ON public.student_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'applications_manager', 'application_reviewer')
  ) OR
  -- Students can view their own applications via student_id
  (student_id IN (
    SELECT id FROM public.cohort_students WHERE user_id = auth.uid()
  )) OR
  -- Students can view their own applications via profile_id
  (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
);

-- Add comments for documentation
COMMENT ON COLUMN public.student_applications.profile_id IS 'Direct reference to profiles table for self-registration flow';
COMMENT ON COLUMN public.student_applications.registration_source IS 'Source of the application (manual or self_registration)';
COMMENT ON COLUMN public.student_applications.registration_date IS 'Date when the registration was initiated';
COMMENT ON COLUMN public.student_applications.invitation_token IS 'Token for email verification in self-registration flow';
COMMENT ON COLUMN public.student_applications.invitation_expires_at IS 'Expiration date for the invitation token';
COMMENT ON COLUMN public.student_applications.registration_completed IS 'Whether the registration process has been completed';
