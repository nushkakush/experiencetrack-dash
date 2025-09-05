-- Create application management tables
-- This migration creates the tables needed for the application form builder and management system

-- 1. Application configurations table
CREATE TABLE IF NOT EXISTS public.application_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  application_fee decimal(10,2) NOT NULL DEFAULT 0 CHECK (application_fee >= 0),
  is_setup_complete boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure only one configuration per cohort
  CONSTRAINT unique_cohort_application_config UNIQUE (cohort_id)
);

-- 2. Application form questions table
CREATE TABLE IF NOT EXISTS public.application_form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES public.application_configurations(id) ON DELETE CASCADE,
  question_text text NOT NULL CHECK (length(question_text) > 0),
  question_type text NOT NULL CHECK (question_type IN (
    'short_text', 'long_text', 'multiple_choice', 'checkboxes', 
    'dropdown', 'linear_scale', 'multiple_choice_grid', 
    'checkbox_grid', 'date', 'time', 'file_upload'
  )),
  is_required boolean NOT NULL DEFAULT false,
  question_order integer NOT NULL CHECK (question_order > 0),
  options jsonb DEFAULT '[]'::jsonb, -- For multiple choice, dropdown, etc.
  grid_rows jsonb DEFAULT '[]'::jsonb, -- For grid questions
  grid_columns jsonb DEFAULT '[]'::jsonb, -- For grid questions
  validation_rules jsonb DEFAULT '{}'::jsonb, -- For text length, number ranges, etc.
  description text, -- Help text for the question
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique order within configuration
  CONSTRAINT unique_question_order_per_config UNIQUE (configuration_id, question_order)
);

-- 3. Student applications table
CREATE TABLE IF NOT EXISTS public.student_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.cohort_students(id) ON DELETE CASCADE,
  application_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- All form responses (question_id -> answer mapping)
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(user_id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure only one application per student per cohort
  CONSTRAINT unique_student_application_per_cohort UNIQUE (cohort_id, student_id),
  
  -- Ensure submitted_at is set when status is not draft
  CONSTRAINT check_submitted_at_consistency CHECK (
    (status = 'draft' AND submitted_at IS NULL) OR
    (status != 'draft' AND submitted_at IS NOT NULL)
  ),
  
  -- Ensure review fields are consistent
  CONSTRAINT check_review_consistency CHECK (
    (status IN ('draft', 'submitted') AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
    (status IN ('under_review', 'approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_configurations_cohort_id 
ON public.application_configurations (cohort_id);

CREATE INDEX IF NOT EXISTS idx_application_form_questions_config_id 
ON public.application_form_questions (configuration_id);

CREATE INDEX IF NOT EXISTS idx_application_form_questions_order 
ON public.application_form_questions (configuration_id, question_order);

CREATE INDEX IF NOT EXISTS idx_student_applications_cohort_id 
ON public.student_applications (cohort_id);

CREATE INDEX IF NOT EXISTS idx_student_applications_student_id 
ON public.student_applications (student_id);

CREATE INDEX IF NOT EXISTS idx_student_applications_status 
ON public.student_applications (status);

CREATE INDEX IF NOT EXISTS idx_student_applications_submitted_at 
ON public.student_applications (submitted_at) WHERE submitted_at IS NOT NULL;

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_application_configurations_updated_at
BEFORE UPDATE ON public.application_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_form_questions_updated_at
BEFORE UPDATE ON public.application_form_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_applications_updated_at
BEFORE UPDATE ON public.student_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.application_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_configurations
CREATE POLICY "Users can view application configurations for their accessible cohorts"
ON public.application_configurations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'applications_manager', 'application_reviewer')
  )
);

CREATE POLICY "Super admins can manage application configurations"
ON public.application_configurations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- RLS Policies for application_form_questions
CREATE POLICY "Users can view form questions for accessible configurations"
ON public.application_form_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'applications_manager', 'application_reviewer')
  )
);

CREATE POLICY "Super admins and applications managers can manage form questions"
ON public.application_form_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'applications_manager')
  )
);

-- RLS Policies for student_applications
CREATE POLICY "Users can view applications for their accessible cohorts"
ON public.student_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'applications_manager', 'application_reviewer')
  ) OR
  -- Students can view their own applications
  (student_id IN (
    SELECT id FROM public.cohort_students WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Students can insert their own applications"
ON public.student_applications
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.cohort_students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own draft applications"
ON public.student_applications
FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM public.cohort_students WHERE user_id = auth.uid()
  ) AND status = 'draft'
);

CREATE POLICY "Application managers and reviewers can update application status"
ON public.student_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'applications_manager', 'application_reviewer')
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.application_configurations IS 'Stores application configuration including fees and form setup status for each cohort';
COMMENT ON TABLE public.application_form_questions IS 'Stores the form questions created by administrators for application forms';
COMMENT ON TABLE public.student_applications IS 'Stores student application submissions and their review status';

COMMENT ON COLUMN public.application_configurations.application_fee IS 'Fee amount required for application submission';
COMMENT ON COLUMN public.application_configurations.is_setup_complete IS 'Whether the application form and configuration is complete and ready for use';

COMMENT ON COLUMN public.application_form_questions.question_type IS 'Type of question (short_text, multiple_choice, etc.)';
COMMENT ON COLUMN public.application_form_questions.question_order IS 'Display order of the question in the form';
COMMENT ON COLUMN public.application_form_questions.options IS 'JSON array of options for choice-based questions';
COMMENT ON COLUMN public.application_form_questions.validation_rules IS 'JSON object containing validation rules for the question';

COMMENT ON COLUMN public.student_applications.application_data IS 'JSON object storing all form responses mapped by question_id';
COMMENT ON COLUMN public.student_applications.status IS 'Current status of the application (draft, submitted, under_review, approved, rejected)';
