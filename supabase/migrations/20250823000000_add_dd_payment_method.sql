-- Add DD (Demand Draft) payment method support
-- Migration: 20250823000000_add_dd_payment_method.sql

-- 1. Update payment_transactions table to support DD payment method
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS dd_number TEXT NULL,
ADD COLUMN IF NOT EXISTS dd_bank_name TEXT NULL,
ADD COLUMN IF NOT EXISTS dd_branch TEXT NULL;

-- 2. Update the payment_method CHECK constraint to include 'dd'
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

ALTER TABLE public.payment_transactions 
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'upi', 'cheque', 'dd'));

-- 3. Add dd_enabled column to payment_method_configurations table
-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_method_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  cash_enabled boolean NOT NULL DEFAULT false,
  bank_transfer_enabled boolean NOT NULL DEFAULT false,
  cheque_enabled boolean NOT NULL DEFAULT false,
  scan_to_pay_enabled boolean NOT NULL DEFAULT false,
  razorpay_enabled boolean NOT NULL DEFAULT false,
  dd_enabled boolean NOT NULL DEFAULT false,
  bank_account_number text,
  bank_account_holder text,
  ifsc_code text,
  bank_name text,
  bank_branch text,
  qr_code_url text,
  upi_id text,
  receiver_bank_name text,
  receiver_bank_logo_url text,
  razorpay_key_id text,
  razorpay_key_secret text,
  razorpay_webhook_secret text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT uniq_cohort_payment_config UNIQUE (cohort_id)
);

-- 4. Add RLS policies for payment_method_configurations
ALTER TABLE public.payment_method_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment method configurations are viewable by authenticated users" ON public.payment_method_configurations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Payment method configurations are insertable by super_admin and program_manager" ON public.payment_method_configurations
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'program_manager'::user_role)
    )
  );

CREATE POLICY "Payment method configurations are updatable by super_admin and program_manager" ON public.payment_method_configurations
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.has_role(auth.uid(), 'super_admin'::user_role) OR
      public.has_role(auth.uid(), 'program_manager'::user_role)
    )
  );

-- 5. Add updated_at trigger for payment_method_configurations
DO $$ BEGIN
  CREATE TRIGGER set_payment_method_configurations_updated_at
    BEFORE UPDATE ON public.payment_method_configurations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Add comments for documentation
COMMENT ON COLUMN public.payment_transactions.dd_number IS 'Demand Draft number for DD payments';
COMMENT ON COLUMN public.payment_transactions.dd_bank_name IS 'Name of the bank that issued the DD';
COMMENT ON COLUMN public.payment_transactions.dd_branch IS 'Branch of the bank that issued the DD';
COMMENT ON COLUMN public.payment_method_configurations.dd_enabled IS 'Whether DD payments are enabled for this cohort';
