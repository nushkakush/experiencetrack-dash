-- Add separate date storage fields for each payment plan type
-- This prevents conflicts between different payment plans

ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS one_shot_dates jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sem_wise_dates jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS instalment_wise_dates jsonb DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN public.fee_structures.one_shot_dates IS 'Custom dates for one-shot payment plan';
COMMENT ON COLUMN public.fee_structures.sem_wise_dates IS 'Custom dates for semester-wise payment plan';
COMMENT ON COLUMN public.fee_structures.instalment_wise_dates IS 'Custom dates for installment-wise payment plan';

-- Keep the existing payment_schedule_dates for backward compatibility
-- but it will be deprecated in favor of the plan-specific fields
