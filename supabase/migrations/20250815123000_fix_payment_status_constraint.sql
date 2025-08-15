-- Fix payment status constraint to allow verification pending statuses
-- Drop the existing constraint
ALTER TABLE public.student_payments 
DROP CONSTRAINT IF EXISTS student_payments_payment_status_check;

-- Add the new constraint with all allowed statuses
ALTER TABLE public.student_payments 
ADD CONSTRAINT student_payments_payment_status_check 
CHECK (payment_status IN (
  'pending',
  'pending_10_plus_days', 
  'verification_pending',
  'paid',
  'overdue',
  'not_setup',
  'awaiting_bank_approval_e_nach',
  'awaiting_bank_approval_physical_mandate',
  'setup_request_failed_e_nach',
  'setup_request_failed_physical_mandate',
  'on_time',
  'failed_5_days_left',
  'complete',
  'dropped',
  'upcoming',
  'partially_paid_verification_pending',
  'partially_paid_days_left',
  'partially_paid_overdue',
  'partially_paid'
));
