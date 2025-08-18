-- Remove the legacy payment_schedule_dates column since we're using plan-specific fields
-- and don't need backward compatibility for test data

ALTER TABLE public.fee_structures 
DROP COLUMN IF EXISTS payment_schedule_dates;
