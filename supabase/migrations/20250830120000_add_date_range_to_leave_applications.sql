-- Add date range support to leave_applications table
-- This allows students to apply for leave for multiple consecutive days

-- Add new columns for date range support
ALTER TABLE public.leave_applications 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS is_date_range boolean DEFAULT false;

-- Add constraint to ensure date range is valid
ALTER TABLE public.leave_applications 
ADD CONSTRAINT check_date_range_validity 
CHECK (
  (is_date_range = false AND start_date IS NULL AND end_date IS NULL) OR
  (is_date_range = true AND start_date IS NOT NULL AND end_date IS NOT NULL AND start_date <= end_date)
);

-- Add constraint to ensure single date and date range are mutually exclusive
ALTER TABLE public.leave_applications 
ADD CONSTRAINT check_date_exclusivity 
CHECK (
  (is_date_range = false AND session_date IS NOT NULL) OR
  (is_date_range = true AND session_date IS NULL)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_applications_date_range 
ON public.leave_applications (start_date, end_date) 
WHERE is_date_range = true;

CREATE INDEX IF NOT EXISTS idx_leave_applications_single_date 
ON public.leave_applications (session_date) 
WHERE is_date_range = false;

-- Add comment to explain the new structure
COMMENT ON COLUMN public.leave_applications.start_date IS 'Start date for date range leave applications';
COMMENT ON COLUMN public.leave_applications.end_date IS 'End date for date range leave applications';
COMMENT ON COLUMN public.leave_applications.is_date_range IS 'Whether this is a date range application (true) or single date (false)';
